var AG_ADAPTER_PHENOM = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea',

  getFieldId(el) {
    if (el.id) return el.id;
    if (el.name) return el.name;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest(".form-group, .field, fieldset, [class*='formField']");
    if (wrap) {
      const lbl = wrap.querySelector("label, legend");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  }
};
