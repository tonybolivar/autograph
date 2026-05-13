const AG_ADAPTER_BULLHORN = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/(?:bullhornstaffing|bhstaffing)\.com\/[^/]+\/(?:job|jobs)\/(\d+)/i);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.name) return el.name;
    if (el.id) return el.id.replace(/^bh-/, "");
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest(".form-group, .field-wrap, fieldset");
    if (wrap) {
      const lbl = wrap.querySelector("label, legend");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  }
};
