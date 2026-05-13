var AG_ADAPTER_PHENOM = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea',

  isExcluded(el) {
    if (!el) return false;
    var id = el.id || "";
    var name = el.name || "";
    if (/^ot-/.test(id) || /^ot-/.test(name)) return true;
    if (el.closest && el.closest("#onetrust-consent-sdk, #onetrust-banner-sdk, .ot-sdk-container, [id^=onetrust]")) return true;
    return false;
  },

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
