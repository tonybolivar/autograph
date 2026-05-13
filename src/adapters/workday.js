var AG_ADAPTER_WORKDAY = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([data-automation-id="searchBox"]), select, textarea, button[data-automation-id*="select"], button[aria-haspopup="listbox"], [data-automation-id="multiSelectContainer"]',

  gateFillOnVisibility: true,
  suppressRefillOnRerender: true,

  getJobId(url) {
    const m = url.match(/myworkdayjobs\.com\/[^/]+\/(?:job|details)\/[^/]+\/([^/?#]+)/i) ||
              url.match(/jobId=([A-Za-z0-9-_]+)/i);
    return m ? m[1] : null;
  },

  getInstanceId(url) {
    try {
      const u = new URL(url);
      const parts = u.hostname.split(".");
      return parts.slice(0, -3).join(".") || parts[0];
    } catch (e) {
      return null;
    }
  },

  instanceFields: [/^job-/, /^application-/, /candidatePosting/i],

  async waitForReady() {
    const start = Date.now();
    while (Date.now() - start < 8000) {
      if (document.querySelector("[data-automation-id]")) return;
      await new Promise(r => setTimeout(r, 200));
    }
  },

  getFieldId(el) {
    let host = el;
    const automationHost = el.closest("[data-automation-id]");
    if (automationHost) host = automationHost;
    const auto = host.getAttribute("data-automation-id");
    if (auto && !/^(input|textInput|formField|wrapper)\d*$/i.test(auto)) {
      const compoundParent = el.closest("[data-automation-id*='--']");
      if (compoundParent) {
        const compound = compoundParent.getAttribute("data-automation-id");
        if (compound && compound.includes("--")) return compound.toLowerCase();
      }
      return auto.toLowerCase();
    }
    if (el.name) return el.name;
    if (el.id && !/^input-\d+$/.test(el.id)) return el.id;
    return null;
  },

  getFieldLabel(el) {
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const refs = labelledBy.split(/\s+/).map(id => document.getElementById(id)).filter(Boolean);
      const text = refs.map(r => r.textContent.trim()).join(" ").trim();
      if (text) return text.replace(/\*$/, "").trim();
    }
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel.replace(/\*$/, "").trim();
    const wrap = el.closest("[data-automation-id]");
    if (wrap) {
      const lbl = wrap.querySelector("label");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  isExcluded(el) {
    if (el.closest("[data-automation-id='resumeAttachments']")) return true;
    if (el.closest("[data-automation-id='legalName']") && el.getAttribute("data-automation-id") === "legalName") return true;
    return false;
  },

  isDropdown(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === "button") {
      const auto = el.getAttribute("data-automation-id") || "";
      if (/select|prompt|dropdown/i.test(auto)) return true;
      if (el.getAttribute("aria-haspopup") === "listbox") return true;
    }
    if (el.getAttribute && el.getAttribute("data-automation-id") === "multiSelectContainer") return true;
    return false;
  },

  isMultiselect(el) {
    return el.getAttribute && el.getAttribute("data-automation-id") === "multiSelectContainer";
  },

  getDropdownValue(el) {
    const display = el.querySelector("[data-automation-id*='selectedItem'], .css-1cu7zr1");
    if (display && display.textContent.trim()) return display.textContent.trim();
    return (el.textContent || "").trim();
  },

  emptyPlaceholderValues: ["", "Select One", "Select one", "Select"],

  async fillDropdown(el, fieldId, candidates) {
    if (!candidates || candidates.length === 0) return false;
    el.scrollIntoView({ block: "center", behavior: "instant" });
    const isMulti = el.getAttribute && el.getAttribute("data-automation-id") === "multiSelectContainer";
    el.click();
    await new Promise(r => setTimeout(r, 250));
    if (isMulti) {
      const searchBox = el.querySelector('input[data-automation-id="searchBox"]') || el.querySelector('input[type="text"]');
      for (const cand of candidates) {
        if (!searchBox) break;
        const query = String(cand).trim();
        if (!query) continue;
        searchBox.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(searchBox, query);
        searchBox.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise(r => setTimeout(r, 500));
        const opts = Array.from(document.querySelectorAll('[data-automation-id="promptOption"]'));
        const lower = query.toLowerCase();
        const exact = opts.find(o => o.textContent.trim().toLowerCase() === lower);
        const starts = opts.find(o => o.textContent.trim().toLowerCase().startsWith(lower));
        const contains = opts.find(o => o.textContent.trim().toLowerCase().includes(lower));
        const pick = exact || starts || contains;
        if (pick) {
          pick.click();
          await new Promise(r => setTimeout(r, 150));
          return true;
        }
      }
      if (searchBox) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(searchBox, "");
        searchBox.dispatchEvent(new Event("input", { bubbles: true }));
      }
      document.body.click();
      return false;
    }
    let panel = document.querySelector("[data-automation-id='promptOption'], [role='listbox'][data-automation-id]");
    if (!panel) {
      const popup = document.querySelector("[role='dialog'][aria-expanded='true'], [role='listbox']");
      if (popup) panel = popup;
    }
    let options = [];
    if (panel) {
      options = Array.from(panel.querySelectorAll("[data-automation-id='promptOption'], [role='option']"));
    }
    if (options.length === 0) {
      options = Array.from(document.querySelectorAll("[data-automation-id='promptOption']"));
    }
    if (options.length === 0) {
      el.click();
      return false;
    }
    for (const cand of candidates) {
      const lower = String(cand).toLowerCase().trim();
      const m = options.find(o => {
        const t = o.textContent.trim().toLowerCase();
        return t === lower || t.startsWith(lower);
      });
      if (m) {
        m.click();
        await new Promise(r => setTimeout(r, 150));
        return true;
      }
    }
    document.body.click();
    return false;
  },

  attachDropdownListener(el, fieldId, onChange) {
    const observer = new MutationObserver(() => onChange("workday-dropdown"));
    observer.observe(el, { childList: true, subtree: true, characterData: true });
  },

  getRadioGroup(el) {
    return el.closest("[data-automation-id='radioBtn'], [role='radiogroup']");
  },

  getRadioOptionText(el) {
    const lbl = el.closest("label") || el.parentElement?.querySelector("label");
    return lbl ? lbl.textContent.trim() : el.value;
  },

  async prefillPass({ workHistory, profile }) {
    var advanced = await this._maybeAdvanceSignInGate(profile);
    if (advanced) return;
    await this._maybeExpandWorkHistory(workHistory);
    await this._maybeAttachResume();
    await this._maybeFillAccountCreation(profile);
  },

  async _maybeAdvanceSignInGate(profile) {
    if (!profile || !profile.account_email || !profile.account_password) return false;
    if (document.querySelector('input[data-automation-id="verifyPassword"]')) return false;
    var key = this._pageKey();
    var applyManually = document.querySelector('[data-automation-id="applyManually"]');
    if (applyManually && window.__autograph_wd_applyManually !== key) {
      window.__autograph_wd_applyManually = key;
      applyManually.click();
      await new Promise(r => setTimeout(r, 1800));
      return true;
    }
    var emailChoice = document.querySelector('[data-automation-id="SignInWithEmailButton"]');
    if (emailChoice && window.__autograph_wd_emailChoice !== key) {
      window.__autograph_wd_emailChoice = key;
      emailChoice.click();
      await new Promise(r => setTimeout(r, 1800));
      return true;
    }
    var createBtn = Array.from(document.querySelectorAll('button, a'))
      .find(b => /^\s*create account\s*$/i.test((b.textContent || "").trim()));
    if (createBtn && window.__autograph_wd_createChoice !== key) {
      window.__autograph_wd_createChoice = key;
      createBtn.click();
      await new Promise(r => setTimeout(r, 1800));
      return true;
    }
    return false;
  },

  async _maybeFillAccountCreation(profile) {
    if (!profile) return;
    const email = document.querySelector('input[data-automation-id="email"]');
    const pw = document.querySelector('input[data-automation-id="password"]');
    const verifyPw = document.querySelector('input[data-automation-id="verifyPassword"]');
    if (!pw && !email) return;
    const useEmail = profile.account_email || profile.email;
    if (email && !email.value && useEmail) this._setPwInput(email, useEmail);
    if (pw && !pw.value && profile.account_password) this._setPwInput(pw, profile.account_password);
    if (verifyPw && !verifyPw.value && profile.account_password) this._setPwInput(verifyPw, profile.account_password);
  },

  _setPwInput(el, value) {
    const proto = window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    el.focus();
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    try { el.setAttribute("data-ag-filled", "true"); } catch (e) {}
  },

  _pageKey() {
    return location.pathname + location.search;
  },

  async _maybeExpandWorkHistory(workHistory) {
    if (!workHistory || workHistory.length === 0) return;
    const key = this._pageKey();
    if (window.__autograph_wd_work_expanded === key) return;
    const section = this._findWorkExperienceSection();
    if (!section) return;
    const addBtn = this._findAddAnotherButton(section, /work/i);
    if (!addBtn) return;
    const rowSelector = '[data-automation-id*="workExperience-"], [data-automation-id*="WorkExperience-"], [data-automation-id^="workHistory-"]';
    const target = Math.min(workHistory.length, 8);
    let safety = 12;
    while (safety-- > 0) {
      const existing = section.querySelectorAll(rowSelector).length;
      if (existing >= target) break;
      addBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }
    window.__autograph_wd_work_expanded = key;
  },

  async _maybeAttachResume() {
    if (typeof agSynthesizeResumeFile !== "function") return;
    const key = this._pageKey();
    if (window.__autograph_wd_resume_attached === key) return;
    const fileInput = document.querySelector(
      'input[type="file"][data-automation-id*="file-upload"], ' +
      'input[type="file"][data-automation-id*="resume"], ' +
      '[data-automation-id*="resume"] input[type="file"], ' +
      '[data-automation-id*="fileUpload"] input[type="file"]'
    );
    if (!fileInput) return;
    if (fileInput.files && fileInput.files.length > 0) {
      window.__autograph_wd_resume_attached = key;
      return;
    }
    const file = await agSynthesizeResumeFile();
    if (!file) return;
    if (typeof agFillFileInput === "function" && agFillFileInput(fileInput, file)) {
      window.__autograph_wd_resume_attached = key;
    }
  },

  _findWorkExperienceSection() {
    const explicit = document.querySelector('[data-automation-id*="workExperience"], [data-automation-id*="WorkExperience"], [data-automation-id*="workHistory"]');
    if (!explicit) return null;
    return explicit.closest('[data-automation-id*="ection"], section') || explicit.parentElement || explicit;
  },

  _findAddAnotherButton(section, contextRe) {
    if (!section) return null;
    const buttons = section.querySelectorAll('button, [role="button"]');
    let fallback = null;
    for (const btn of buttons) {
      const text = (btn.textContent || "").trim().toLowerCase();
      const automation = (btn.getAttribute("data-automation-id") || "").toLowerCase();
      if (!text && !automation) continue;
      const isAdd = /^add(\s+another)?$/.test(text) || /add-button|addbutton|^add$|add_another/.test(automation);
      if (!isAdd) continue;
      if (contextRe && (contextRe.test(automation) || contextRe.test(text))) return btn;
      if (!fallback) fallback = btn;
    }
    return fallback;
  },

  synthesizeValue(profile, fieldId, label) {
    const fid = (fieldId || "").toLowerCase();
    const lab = (label || "").toLowerCase();
    if ((fid.includes("legalname--firstname") || fid === "firstname") && profile.first_name) {
      return profile.first_name;
    }
    if ((fid.includes("legalname--lastname") || fid === "lastname") && profile.last_name) {
      return profile.last_name;
    }
    if (fid.includes("phone--number") && profile.phone_number) {
      return profile.phone_number;
    }
    if (fid.includes("addresssection--addressline1") && profile.address_line_1) {
      return profile.address_line_1;
    }
    if (fid.includes("addresssection--city") && profile.city) {
      return profile.city;
    }
    if (fid.includes("addresssection--postalcode") && profile.zip_postal) {
      return profile.zip_postal;
    }
    return undefined;
  }
};
