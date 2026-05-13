var AG_ADAPTER_JOBVITE = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea',

  getJobId(url) {
    const m = url.match(/jobvite\.com\/[^/]+\/job\/([A-Za-z0-9]+)/) ||
              url.match(/jobvite\.com\/job\/([A-Za-z0-9]+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.name) return el.name.replace(/^jv-|^jobvite-/, "");
    if (el.id) return el.id;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest("dl, .jv-question, .form-group, .field, fieldset");
    if (wrap) {
      const lbl = wrap.querySelector("dt, label, legend, .jv-question-label");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  synthesizeValue(profile, fieldId) {
    const fid = (fieldId || "").toLowerCase();
    if (fid === "name" || fid === "fullname" || fid === "full_name") {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined;
    }
    return undefined;
  }
};
