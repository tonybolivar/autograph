var AG_ADAPTER_LOXO = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea',

  getJobId(url) {
    const m = url.match(/loxo\.co\/(?:jobs?|job)\/([A-Za-z0-9-]+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.name) return el.name.replace(/^job_application\[|\]$/g, "");
    if (el.id) return el.id.replace(/^job_application_/, "");
    return null;
  },

  getFieldLabel(el) {
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    const wrap = el.closest(".form-group, .field, fieldset");
    if (wrap) {
      const lbl = wrap.querySelector("label, legend");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  }
};
