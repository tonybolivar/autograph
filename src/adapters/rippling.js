var AG_ADAPTER_RIPPLING = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/rippling(?:-ats)?\.com\/[^/]+\/jobs?\/([A-Za-z0-9-]+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.name) return el.name;
    if (el.id && !/^:r/.test(el.id)) return el.id;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest("[class*='Field'], [class*='form-field'], fieldset");
    if (wrap) {
      const lbl = wrap.querySelector("label, legend");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  isDropdown(el) {
    if (el.tagName.toLowerCase() === "select") return false;
    return el.getAttribute("role") === "combobox";
  },

  emptyPlaceholderValues: ["Select...", "Select", "", "Choose...", "Search"],

  synthesizeValue(profile, fieldId, label) {
    var lab = (label || "").toLowerCase().trim();
    if (lab === "location" || lab === "location*") {
      var parts = [profile.city, profile.state_province, profile.country].filter(Boolean);
      return parts.length ? parts.join(", ") : undefined;
    }
    return undefined;
  },

  async prefillPass() {
    await this._maybeAttachResume();
  },

  async _maybeAttachResume() {
    if (typeof agSynthesizeResumeFile !== "function") return;
    var key = location.pathname + location.search;
    if (window.__autograph_rip_resume_attached === key) return;
    var fileInput = Array.from(document.querySelectorAll('input[type="file"]'))
      .find(el => (typeof agIsResumeFileInput === "function" ? agIsResumeFileInput(el) : false));
    if (!fileInput) return;
    if (fileInput.files && fileInput.files.length > 0) {
      window.__autograph_rip_resume_attached = key;
      return;
    }
    var file = await agSynthesizeResumeFile();
    if (!file) return;
    if (typeof agFillFileInput !== "function") return;
    if (!agFillFileInput(fileInput, file)) return;
    window.__autograph_rip_resume_attached = key;
    await this._waitForParseSettle();
  },

  async _waitForParseSettle() {
    var start = Date.now();
    var lastSig = null;
    var stableHits = 0;
    while (Date.now() - start < 6000) {
      await new Promise(r => setTimeout(r, 400));
      var sig = "";
      var inputs = document.querySelectorAll('input[name="first_name"], input[name="last_name"], input[name="email"], input[id*="first"], input[id*="email"]');
      for (var inp of inputs) sig += (inp.value || "") + "|";
      if (sig === lastSig) {
        stableHits++;
        if (stableHits >= 2) return;
      } else {
        stableHits = 0;
        lastSig = sig;
      }
    }
  },

  async fillDropdown(el, fieldId, candidates) {
    if (!candidates || candidates.length === 0) return false;
    el.click();
    await new Promise(r => setTimeout(r, 180));
    const options = Array.from(document.querySelectorAll("[role='option']"));
    if (options.length === 0) return false;
    for (const cand of candidates) {
      const lower = String(cand).toLowerCase().trim();
      const m = options.find(o => o.textContent.trim().toLowerCase() === lower || o.textContent.trim().toLowerCase().startsWith(lower));
      if (m) {
        m.click();
        await new Promise(r => setTimeout(r, 80));
        return true;
      }
    }
    document.body.click();
    return false;
  }
};
