var AG_ADAPTER_BAMBOOHR = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/bamboohr\.com\/(?:careers|jobs)\/(\d+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.id && !/^ember\d+$/.test(el.id)) return el.id;
    if (el.name) return el.name;
    const lbl = el.closest(".fab-Form")?.querySelector(`label[for="${CSS.escape(el.id || "")}"]`);
    if (lbl) return agSlugify(lbl.textContent);
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest(".fab-FormField, [class*='FormField'], fieldset");
    if (wrap) {
      const lbl = wrap.querySelector("label, legend, .fab-FormField__label");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  isDropdown(el) {
    if (el.tagName.toLowerCase() === "select") return false;
    return el.matches("[role='combobox'], .fab-Select__trigger, [class*='Select__trigger']");
  },

  getDropdownValue(el) {
    const display = el.querySelector(".fab-Select__value, [class*='Select__value']");
    if (display && display.textContent.trim()) return display.textContent.trim();
    return (el.textContent || "").trim();
  },

  emptyPlaceholderValues: ["", "Select", "Choose...", "Please select"],

  async fillDropdown(el, fieldId, candidates) {
    if (!candidates || candidates.length === 0) return false;
    el.click();
    await new Promise(r => setTimeout(r, 180));
    const options = Array.from(document.querySelectorAll(".fab-Select__option, [class*='Select__option'], [role='option']"));
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
