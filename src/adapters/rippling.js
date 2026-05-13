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
