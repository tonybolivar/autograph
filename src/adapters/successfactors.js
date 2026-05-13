const AG_ADAPTER_SUCCESSFACTORS = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/[?&]jobId=(\d+)/i) ||
              url.match(/career\?[^#]*[?&]jobId=(\d+)/i) ||
              url.match(/\/job\/(\d+)/);
    return m ? m[1] : null;
  },

  getInstanceId(url) {
    try {
      const u = new URL(url);
      return u.hostname.split(".")[0];
    } catch (e) {
      return null;
    }
  },

  getFieldId(el) {
    if (el.name) return el.name.replace(/^sf_/, "");
    if (el.id) return el.id.replace(/^sf_/, "");
    return null;
  },

  getFieldLabel(el) {
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    const wrap = el.closest(".sapMInput, .sapUiFormElement, .form-group, fieldset");
    if (wrap) {
      const lbl = wrap.querySelector("label, legend, .sapMLabel");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const ref = document.getElementById(labelledBy);
      if (ref && ref.textContent.trim()) return ref.textContent.trim();
    }
    return null;
  },

  isDropdown(el) {
    if (el.tagName.toLowerCase() === "select") return false;
    return el.getAttribute("role") === "combobox" || !!el.closest(".sapMComboBox, .sapMSelect");
  },

  emptyPlaceholderValues: ["", "Select", "Please select"],

  async fillDropdown(el, fieldId, candidates) {
    if (!candidates || candidates.length === 0) return false;
    el.click();
    await new Promise(r => setTimeout(r, 200));
    const options = Array.from(document.querySelectorAll(".sapMSelectList li, .sapMComboBoxList li, [role='option']"));
    if (options.length === 0) return false;
    for (const cand of candidates) {
      const lower = String(cand).toLowerCase().trim();
      const m = options.find(o => o.textContent.trim().toLowerCase() === lower || o.textContent.trim().toLowerCase().startsWith(lower));
      if (m) {
        m.click();
        await new Promise(r => setTimeout(r, 100));
        return true;
      }
    }
    document.body.click();
    return false;
  },

  suppressRefillOnRerender: true
};
