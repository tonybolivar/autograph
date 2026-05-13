(() => {
  "use strict";
  if (window.__AUTOGRAPH_LOADED__) return;
  window.__AUTOGRAPH_LOADED__ = true;

  let currentSite = null;
  let currentSiteId = null;
  let currentInstanceKey = null;
  let adapter = null;
  let active = false;
  let jobId = null;
  let observer = null;
  let observerTimer = null;
  const seenFields = new WeakSet();
  const inflightDropdownFields = new Set();
  const filledHighlightSelectors = new Set();
  const suppressedFieldIds = new Set();
  const observedFieldIds = new Set();
  let firstPassDone = false;
  let fillsThisVisit = 0;
  let detectedThisVisit = 0;
  let pathKey = null;
  let runInProgress = false;
  let rerunQueued = false;
  let toastHost = null;
  let toastRoot = null;
  let toastTimer = null;
  let highlightStyle = null;

  function pickAdapter(adapterName) {
    const globalKey = `AG_ADAPTER_${(adapterName || "default").toUpperCase()}`;
    const siteAdapter = globalThis[globalKey] || {};
    return Object.assign({}, AG_ADAPTER_DEFAULT, siteAdapter);
  }

  function elementInstanceKey(fieldId) {
    if (currentInstanceKey && adapter.instanceFields && adapter.instanceFields.length) {
      for (const pat of adapter.instanceFields) {
        if (pat instanceof RegExp ? pat.test(fieldId) : pat === fieldId) return currentInstanceKey;
      }
    }
    return currentSiteId;
  }

  function isTextish(el) {
    if (adapter.isTextField) return adapter.isTextField(el);
    return agIsTextField(el);
  }

  function isCheckRadio(el) {
    if (adapter.isCheckbox) return adapter.isCheckbox(el);
    return agIsCheckRadio(el);
  }

  function isDropdown(el) {
    return !!(adapter.isDropdown && adapter.isDropdown(el));
  }

  function isMultiselect(el) {
    return !!(adapter.isMultiselect && adapter.isMultiselect(el));
  }

  function isExcluded(el) {
    if (adapter.isExcluded && adapter.isExcluded(el)) return true;
    return agIsExcludedInput(el);
  }

  function getFieldId(el) {
    if (adapter.getFieldId) {
      const id = adapter.getFieldId(el);
      if (id) return id;
    }
    return agExtractFieldId(el);
  }

  function getFieldLabel(el) {
    if (adapter.getFieldLabel) {
      const lbl = adapter.getFieldLabel(el);
      if (lbl) return agCleanLabel(lbl);
    }
    return agExtractLabel(el) || "Unknown Field Name";
  }

  function highlight(el, fieldId) {
    if (adapter.getHighlightSelector) {
      const sel = adapter.getHighlightSelector(fieldId, el);
      if (sel) {
        filledHighlightSelectors.add(sel);
        applyHighlightStyle();
        return;
      }
    }
    el.setAttribute("data-ag-filled", "true");
    if (el.type === "radio" || el.type === "checkbox") {
      const wrap = el.closest("label") || el.parentElement;
      if (wrap) wrap.setAttribute("data-ag-filled", "true");
    }
  }

  function applyHighlightStyle() {
    if (!highlightStyle) {
      highlightStyle = document.createElement("style");
      highlightStyle.id = "autograph-highlights";
      document.head.appendChild(highlightStyle);
    }
    const sels = Array.from(filledHighlightSelectors).join(",\n");
    highlightStyle.textContent = `${sels} {
      background-color: #fffde7 !important;
      outline: 2px solid #fdd835 !important;
      outline-offset: -2px !important;
    }`;
  }

  async function fillElement(el, fieldId, value, ctx) {
    if (isDropdown(el)) {
      const arr = Array.isArray(value) ? value : (typeof value === "string" ? [value] : []);
      if (isMultiselect(el) && adapter.fillDropdown && arr.length > 0) {
        let any = false;
        for (const v of arr) {
          const ok = await adapter.fillDropdown(el, fieldId, [v], ctx);
          if (ok) any = true;
        }
        return any;
      }
      if (adapter.fillDropdown) return await adapter.fillDropdown(el, fieldId, arr, ctx);
      return false;
    }
    if (isTextish(el)) {
      if (adapter.fillTextField && await adapter.fillTextField(el, fieldId, value)) return true;
      return agFillTextField(el, value);
    }
    if (agIsSelectField(el)) {
      const arr = Array.isArray(value) ? value : (typeof value === "string" ? [value] : []);
      if (adapter.fillSelect && adapter.fillSelect(el, fieldId, arr)) return true;
      if (agFillSelect(el, arr)) return true;
      if (ctx && ctx.declineEligible) {
        const dec = agFindDeclineOption(Array.from(el.options));
        if (dec) {
          el.value = dec.value;
          agFireFieldEvents(el);
          return true;
        }
      }
      return false;
    }
    if (isCheckRadio(el)) {
      const optionLabel = adapter.getRadioValue
        ? adapter.getRadioValue(el, agExtractLabel(el))
        : (agExtractLabel(el) || el.value || "");
      const candidates = Array.isArray(value) ? value : [value];
      const sameNameCount = el.name
        ? document.querySelectorAll(`input[type="${el.type}"][name="${CSS.escape(el.name)}"]`).length
        : 1;
      const isYesNoSingleCheckbox = el.type === "checkbox" && sameNameCount <= 1 &&
        candidates.length === 1 && (candidates[0] === "Yes" || candidates[0] === "No" || candidates[0] === true || candidates[0] === false);

      let target;
      if (isYesNoSingleCheckbox) {
        target = candidates[0] === "Yes" || candidates[0] === true || candidates[0] === "true";
      } else {
        const optL = String(optionLabel).toLowerCase().trim();
        target = candidates.some(cand => {
          if (cand === true || cand === "true") return optL === "yes" || optL.startsWith("yes");
          if (cand === false || cand === "false") return optL === "no" || optL.startsWith("no");
          const c = String(cand).toLowerCase().trim();
          if (!c) return false;
          if (optL === c) return true;
          if (optL.startsWith(c)) return true;
          if (c.length >= 4 && c.startsWith(optL.slice(0, Math.max(4, optL.length)))) return true;
          return false;
        });
      }

      const adapterHasCheckbox = adapter.isCheckbox && adapter.isCheckbox(el);
      const currentChecked = adapter.getCheckboxChecked ? adapter.getCheckboxChecked(el) : el.checked;
      if (currentChecked === target) return false;
      if (adapterHasCheckbox && adapter.fillCheckbox) {
        adapter.fillCheckbox(el, target);
      } else if (target) {
        el.click();
      } else {
        el.checked = false;
        agFireFieldEvents(el);
      }
      return true;
    }
    return false;
  }

  async function runFillPass() {
    if (!active || !currentSiteId) return { detected: 0, filled: 0 };
    if (runInProgress) {
      rerunQueued = true;
      return { detected: 0, filled: 0 };
    }
    runInProgress = true;
    try {
      const profile = await agLoadProfile();
      const siteData = await agLoadFieldData(currentSiteId);
      const instanceData = currentInstanceKey ? await agLoadFieldData(currentInstanceKey) : {};
      const labels = await agLoadFieldLabels(currentSiteId);
      const workHistory = (typeof agLoadWorkHistory === "function") ? await agLoadWorkHistory() : [];

      const currentJob = workHistory.find(j => j.is_current) || workHistory[0];
      if (currentJob) {
        if (!profile.current_company && currentJob.company) profile.current_company = currentJob.company;
        if (!profile.current_title && currentJob.title) profile.current_title = currentJob.title;
      }

      const selector = adapter.fieldSelector || "input, select, textarea";
      const els = Array.from(document.querySelectorAll(selector));
      if (adapter.shadowContainerSelector) {
        for (const host of document.querySelectorAll(adapter.shadowContainerSelector)) {
          if (host.shadowRoot) els.push(...host.shadowRoot.querySelectorAll(selector));
        }
      }

      let filled = 0;
      let detected = 0;
      const labelMap = {};

      for (const el of els) {
        if (seenFields.has(el)) continue;
        if (isExcluded(el)) continue;
        const fieldId = getFieldId(el);
        if (!fieldId) continue;

        const useInstance = currentInstanceKey && adapter.instanceFields?.some(p =>
          p instanceof RegExp ? p.test(fieldId) : p === fieldId
        );
        const dataSource = useInstance ? instanceData : siteData;
        const labelKey = elementInstanceKey(fieldId);
        const label = getFieldLabel(el);
        labelMap[fieldId] = label;
        detected++;

        let value = dataSource[fieldId];

        if (value === undefined) {
          const recalled = agRecallByLabelSiblings(fieldId, label, labels, dataSource);
          if (recalled !== undefined) value = recalled;
        }

        if (value === undefined && workHistory.length > 0 && typeof agParseWorkFieldId === "function") {
          const work = agParseWorkFieldId(label, fieldId);
          if (work) {
            const entry = workHistory[work.index];
            if (entry) {
              const v = agWorkEntryValueFor(entry, work.subfield);
              if (v !== undefined) value = v;
            }
          }
        }

        if (value === undefined && adapter.synthesizeValue) {
          const synth = adapter.synthesizeValue(profile, fieldId, label, el);
          if (synth !== undefined && synth !== null) value = synth;
        }

        let usedProfile = false;
        let profileFieldId = null;
        if (value === undefined && (isTextish(el) || agIsSelectField(el) || isCheckRadio(el))) {
          profileFieldId = agMatchToProfileField(label, fieldId);
          if (profileFieldId && profile[profileFieldId]) {
            const raw = profile[profileFieldId];
            if (agIsSelectField(el) || isDropdown(el)) {
              const denorm = AG_VALUE_DENORMALIZERS[profileFieldId];
              value = denorm ? denorm(raw) : [raw];
            } else if (el.type === "radio" || el.type === "checkbox") {
              const denorm = AG_VALUE_DENORMALIZERS[profileFieldId];
              value = denorm ? denorm(raw) : [raw];
            } else {
              value = raw;
            }
            usedProfile = true;
          } else if (profileFieldId === "phone_type" && agIsSelectField(el)) {
            value = AG_PHONE_TYPE_FALLBACKS.slice();
            usedProfile = true;
          }
        }

        const declineEligible = value === undefined && agIsDemographicField(label, fieldId);
        if (value === undefined && declineEligible) {
          if (agIsSelectField(el)) {
            const dec = agFindDeclineOption(Array.from(el.options));
            if (dec) value = dec.textContent.trim();
          } else if (isDropdown(el)) {
            value = AG_DECLINE_OPTION_LABELS.slice();
          } else if (el.type === "radio" || el.type === "checkbox") {
            value = AG_DECLINE_OPTION_LABELS.slice();
          }
        }

        if (value !== undefined) {
          if (isDropdown(el) && adapter.getDropdownValue) {
            const current = adapter.getDropdownValue(el);
            const blanks = adapter.emptyPlaceholderValues || [];
            if (current && current.trim() && !blanks.includes(current)) {
              attachCapture(el, fieldId, labelKey);
              seenFields.add(el);
              continue;
            }
          }
          if (adapter.suppressRefillOnRerender && suppressedFieldIds.has(fieldId)) {
            attachCapture(el, fieldId, labelKey);
            seenFields.add(el);
            continue;
          }
          if (inflightDropdownFields.has(fieldId)) {
            seenFields.add(el);
            continue;
          }
          inflightDropdownFields.add(fieldId);
          try {
            const ok = await fillElement(el, fieldId, value, { declineEligible, masterProfile: profile });
            if (ok) {
              highlight(el, fieldId);
              filled++;
              if (adapter.suppressRefillOnRerender) suppressedFieldIds.add(fieldId);
              await new Promise(r => setTimeout(r, 30));
            }
          } finally {
            inflightDropdownFields.delete(fieldId);
          }
        }

        attachCapture(el, fieldId, labelKey);
        seenFields.add(el);
        observedFieldIds.add(fieldId);
      }

      agSaveFieldLabels(currentSiteId, labelMap);

      const resumeFilled = await fillResumeInputs();
      filled += resumeFilled;

      return { detected, filled };
    } finally {
      runInProgress = false;
      if (rerunQueued) {
        rerunQueued = false;
        setTimeout(() => {
          runFillPass().then(({ detected, filled }) => {
            detectedThisVisit += detected;
            if (filled > 0) bumpFillToast(filled);
          });
        }, 80);
      }
    }
  }

  const resumeFilledInputs = new WeakSet();
  let cachedResumeFile = undefined;

  async function fillResumeInputs() {
    if (typeof agSynthesizeResumeFile !== "function") return 0;
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
    if (fileInputs.length === 0) return 0;
    const candidates = fileInputs.filter(el =>
      !resumeFilledInputs.has(el) &&
      el.files.length === 0 &&
      agIsResumeFileInput(el) &&
      (!adapter.shouldFillResumeInput || adapter.shouldFillResumeInput(el))
    );
    if (candidates.length === 0) return 0;
    if (cachedResumeFile === undefined) {
      cachedResumeFile = await agSynthesizeResumeFile();
    }
    if (!cachedResumeFile) return 0;
    let count = 0;
    for (const el of candidates) {
      const ok = agFillFileInput(el, cachedResumeFile);
      if (ok) {
        resumeFilledInputs.add(el);
        const fid = getFieldId(el) || "resume_file";
        highlight(el, fid);
        count++;
        await new Promise(r => setTimeout(r, 50));
      }
    }
    return count;
  }

  function attachCapture(el, fieldId, labelKey) {
    if (el._agCaptureAttached) return;
    el._agCaptureAttached = true;
    if (isDropdown(el)) {
      if (adapter.attachDropdownListener) {
        adapter.attachDropdownListener(el, fieldId, () => captureValue(el, fieldId, labelKey));
      }
      return;
    }
    if (adapter.isCheckbox && adapter.isCheckbox(el) && adapter.attachCheckboxListener) {
      adapter.attachCheckboxListener(el, fieldId, () => captureValue(el, fieldId, labelKey));
      return;
    }
    if (adapter.attachTextCaptureListener && adapter.attachTextCaptureListener(el, fieldId, () => captureValue(el, fieldId, labelKey))) {
      return;
    }
    el.addEventListener("change", () => captureValue(el, fieldId, labelKey));
    el.addEventListener("blur", () => captureValue(el, fieldId, labelKey));
  }

  async function captureValue(el, fieldId, labelKey) {
    if (!active || !currentSiteId) return;
    if (isExcluded(el)) return;
    let value;
    if (isCheckRadio(el)) {
      if (el.type === "radio") {
        const label = agExtractLabel(el);
        value = el.checked ? (adapter.getRadioValue?.(el, label) || el.value) : null;
      } else {
        value = adapter.getCheckboxChecked ? adapter.getCheckboxChecked(el) : el.checked;
      }
    } else if (isDropdown(el)) {
      value = adapter.getDropdownValue ? adapter.getDropdownValue(el) : (el.textContent || "").trim();
    } else {
      value = adapter.getTextValue ? adapter.getTextValue(el) : el.value;
    }

    const blanks = adapter.emptyPlaceholderValues || [];
    if (value === "" || value == null || blanks.includes(value)) {
      await agClearFieldValue(labelKey || currentSiteId, fieldId);
      return;
    }

    let opposites = null;
    if (el.type === "radio" && el.checked && el.name) {
      const peers = document.querySelectorAll(`input[name="${CSS.escape(el.name)}"]`);
      opposites = [];
      for (const peer of peers) {
        if (peer === el) continue;
        const pid = getFieldId(peer);
        if (pid && pid !== fieldId) opposites.push(pid);
      }
    }

    const isDropdownLike = isDropdown(el) || agIsSelectField(el);
    const recordKey = labelKey || currentSiteId;

    if (isMultiselect(el)) {
      let arr;
      try { arr = JSON.parse(value); } catch (e) { arr = [value]; }
      if (!Array.isArray(arr)) arr = [arr];
      await agSaveFieldValue(recordKey, fieldId, arr, false);
    } else {
      await agSaveFieldValue(recordKey, fieldId, value, isDropdownLike && !isMultiselect(el), opposites);
    }

    if (typeof value === "string" && value.trim()) {
      const label = getFieldLabel(el);
      let pid = agMatchToProfileField(label, fieldId);
      if (!pid) {
        const lower = (label || "").toLowerCase();
        const fLower = (fieldId || "").toLowerCase();
        if ((/\b(url|website|link|portfolio|profile)\b/.test(lower) || /\b(url|website|link|portfolio|profile)\b/.test(fLower)) && AG_LINKEDIN_RE.test(value)) {
          pid = "linkedin_profile";
        }
      }
      if (pid) agCaptureToProfile(pid, value);
    }
  }

  function showFillToast(count) {
    if (toastHost) toastHost.remove();
    if (!document.body) return;
    const host = document.createElement("div");
    host.id = "autograph-toast-host";
    const root = host.attachShadow({ mode: "closed" });
    root.innerHTML = `
      <style>
        .ag-toast {
          position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
          width: 320px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
          padding: 14px 18px; display: flex; align-items: center; gap: 12px;
          opacity: 0; transform: translateY(10px);
          transition: opacity 200ms ease, transform 200ms ease;
        }
        .ag-toast.visible { opacity: 1; transform: translateY(0); }
        .ag-text { flex: 1; font-size: 14px; color: #1e293b; line-height: 1.4; }
        .ag-text strong { font-weight: 700; }
        .ag-text .ag-sub { color: #64748b; font-size: 12px; }
        .ag-dismiss {
          background: none; border: none; color: #94a3b8;
          cursor: pointer; font-size: 18px; padding: 4px; line-height: 1;
        }
        .ag-dismiss:hover { color: #475569; }
      </style>
      <div class="ag-toast">
        <div class="ag-text">
          <strong>Autograph filled ${count} field${count !== 1 ? "s" : ""}</strong><br>
          <span class="ag-sub">Review and submit when ready.</span>
        </div>
        <button class="ag-dismiss" aria-label="Dismiss">&times;</button>
      </div>
    `;
    document.body.appendChild(host);
    toastHost = host;
    toastRoot = root;
    const toast = root.querySelector(".ag-toast");
    requestAnimationFrame(() => toast.classList.add("visible"));
    const dismiss = () => {
      toast.classList.remove("visible");
      const ref = host;
      setTimeout(() => {
        ref.remove();
        if (toastHost === ref) { toastHost = null; toastRoot = null; }
      }, 200);
    };
    root.querySelector(".ag-dismiss").addEventListener("click", dismiss);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(dismiss, 5000);
  }

  function bumpFillToast(filledCount) {
    fillsThisVisit += filledCount;
    clearTimeout(observerTimer);
    observerTimer = setTimeout(() => {
      if (fillsThisVisit > 0) {
        showFillToast(fillsThisVisit);
        fillsThisVisit = 0;
      }
    }, 400);
  }

  function setupObserver() {
    if (observer) return;
    observer = new MutationObserver(muts => {
      let added = 0;
      for (const m of muts) added += m.addedNodes.length;
      if (added === 0) return;
      clearTimeout(setupObserver._t);
      setupObserver._t = setTimeout(async () => {
        if (adapter.prefillPass) {
          try {
            const profile = await agLoadProfile();
            const workHistory = (typeof agLoadWorkHistory === "function") ? await agLoadWorkHistory() : [];
            await adapter.prefillPass({ profile, workHistory });
          } catch (err) {}
        }
        const { detected, filled } = await runFillPass();
        detectedThisVisit += detected;
        if (filled > 0) {
          bumpFillToast(filled);
          chrome.runtime.sendMessage({ type: "AG_FILL_COMPLETE", count: filled, site: currentSiteId });
        }
      }, 250);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (adapter.shadowContainerSelector) {
      for (const host of document.querySelectorAll(adapter.shadowContainerSelector)) {
        if (host.shadowRoot) observer.observe(host.shadowRoot, { childList: true, subtree: true });
      }
    }
  }

  function waitForVisibility(selector) {
    return new Promise(resolve => {
      let done = false;
      const seen = new Set();
      let io;
      let mo;
      const finish = () => {
        if (done) return;
        done = true;
        if (io) io.disconnect();
        if (mo) mo.disconnect();
        resolve();
      };
      io = new IntersectionObserver(entries => {
        for (const e of entries) if (e.isIntersecting) return finish();
      });
      const scan = () => {
        const els = document.querySelectorAll(selector);
        for (const el of els) {
          if (seen.has(el)) continue;
          seen.add(el);
          io.observe(el);
        }
      };
      scan();
      mo = new MutationObserver(scan);
      mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
      setTimeout(finish, 8000);
    });
  }

  async function activate(site) {
    currentSite = site;
    currentSiteId = site.id;
    active = true;
    adapter = pickAdapter(site.adapter);
    const url = window.location.href;
    const instanceId = adapter.getInstanceId ? adapter.getInstanceId(url) : null;
    currentInstanceKey = instanceId ? `${site.id}|${instanceId}` : null;
    jobId = adapter.getJobId ? adapter.getJobId(url) : null;
    if (!jobId) {
      try {
        const u = new URL(url);
        if (!/\/search\b/i.test(u.pathname)) {
          const path = u.hostname + u.pathname.replace(/\/+$/, "");
          if (path) jobId = path;
        }
      } catch (e) {}
    }
    firstPassDone = false;
    fillsThisVisit = 0;
    detectedThisVisit = 0;
    if (adapter.waitForReady) await adapter.waitForReady();
    if (adapter.gateFillOnVisibility && adapter.fieldSelector) {
      await waitForVisibility(adapter.fieldSelector);
    }
    if (adapter.prefillPass) {
      try {
        const profile = await agLoadProfile();
        const workHistory = (typeof agLoadWorkHistory === "function") ? await agLoadWorkHistory() : [];
        await adapter.prefillPass({ profile, workHistory });
      } catch (err) {}
    }
    const { detected, filled } = await runFillPass();
    detectedThisVisit = detected;
    setupObserver();
    if (filled > 0) {
      bumpFillToast(filled);
      chrome.runtime.sendMessage({ type: "AG_FILL_COMPLETE", count: filled, site: currentSiteId });
    }
    firstPassDone = true;
  }

  function deactivate() {
    active = false;
    currentSite = null;
    currentSiteId = null;
    currentInstanceKey = null;
    adapter = null;
    jobId = null;
    fillsThisVisit = 0;
    detectedThisVisit = 0;
    suppressedFieldIds.clear();
    observedFieldIds.clear();
    if (observer) { observer.disconnect(); observer = null; }
    clearTimeout(observerTimer);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "AG_ACTIVATE") {
      const site = AG_SUPPORTED_SITES.find(s => s.id === msg.siteId);
      if (site) activate(site);
    } else if (msg.type === "AG_DEACTIVATE") {
      deactivate();
    } else if (msg.type === "AG_TRIGGER_FILL") {
      runFillPass().then(({ detected, filled }) => {
        detectedThisVisit += detected;
        if (filled > 0) bumpFillToast(filled);
        sendResponse({ detected, filled });
      });
      return true;
    }
  });

  (async () => {
    const host = window.location.hostname;
    const toggles = (await chrome.storage.local.get("siteToggles")).siteToggles || {};

    const site = agFindSiteForHost(host);
    if (site) {
      if (toggles[site.id] === false) return;
      activate(site);
      return;
    }

    if (typeof agFindCustomDomainForHostname === "function") {
      const storedCustom = (await chrome.storage.sync.get("customDomains")).customDomains || {};
      const custom = agFindCustomDomainForHostname(host, storedCustom);
      if (custom) {
        if (toggles[custom.host] === false) return;
        const detected = (typeof agDetectEmbeddedATS === "function") ? agDetectEmbeddedATS() : null;
        const adapterId = detected || custom.adapter;
        activate({ id: custom.host, name: custom.host, adapter: adapterId, isCustomDomain: true });
      }
    }
  })();
})();
