var AG_ADAPTER_SMARTRECRUITERS = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  shouldFillResumeInput(el) {
    try {
      var host = window.location.hostname || "";
      if (host.includes("smartr.me")) return true;
    } catch (e) {}
    return undefined;
  },


  getJobId(url) {
    const m = url.match(/smartrecruiters\.com\/[^/]+\/(\d+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    const dn = el.getAttribute("data-name");
    if (dn) return dn.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (el.id) {
      const clean = el.id.replace(/^candidate-form-/, "");
      if (clean && !/^\d+$/.test(clean)) return clean;
    }
    if (el.name) return el.name;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest(".form-field, .form-group, [class*='formField']");
    if (wrap) {
      const lbl = wrap.querySelector("label, .form-label, [class*='label']");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  isDropdown(el) {
    if (el.tagName.toLowerCase() === "select") return false;
    return el.getAttribute("role") === "combobox" || !!el.closest(".sr-select, [class*='Dropdown']");
  },

  getDropdownValue(el) {
    const root = el.closest(".sr-select, [class*='Dropdown']") || el;
    const selected = root.querySelector(".sr-select__selected, [class*='value']");
    if (selected && selected.textContent.trim()) return selected.textContent.trim();
    return (root.textContent || "").trim();
  },

  emptyPlaceholderValues: ["", "Select", "Select an option", "Please select"],

  async fillDropdown(el, fieldId, candidates) {
    if (!candidates || candidates.length === 0) return false;
    const root = el.closest(".sr-select, [class*='Dropdown']") || el;
    root.click();
    await new Promise(r => setTimeout(r, 180));
    const options = Array.from(document.querySelectorAll(".sr-select__option, [role='option'], [class*='DropdownOption']"));
    if (options.length === 0) {
      document.body.click();
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
        await new Promise(r => setTimeout(r, 80));
        return true;
      }
    }
    document.body.click();
    return false;
  }
};
