var AG_ADAPTER_ICIMS = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea',

  getJobId(url) {
    const m = url.match(/icims\.com\/jobs?\/(\d+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.name) return el.name.replace(/^icims_field_/, "").replace(/^iCIMS_/, "");
    if (el.id) return el.id.replace(/^icims_field_/, "").replace(/^iCIMS_/, "");
    return null;
  },

  getFieldLabel(el) {
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    const wrap = el.closest("tr, .iCIMS_FormFieldGroup, .row, fieldset");
    if (wrap) {
      const lbl = wrap.querySelector("label, legend, .iCIMS_TableLabel");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  isExcluded(el) {
    if (el.closest(".iCIMS_ReadOnly")) return true;
    return false;
  }
};
