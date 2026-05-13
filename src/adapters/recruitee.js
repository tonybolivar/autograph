var AG_ADAPTER_RECRUITEE = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/recruitee\.com\/o\/([^/]+)/) || url.match(/careers\.tellent\.com\/[^/]+\/([^/]+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.id && !/^[a-f0-9-]{20,}$/.test(el.id)) return el.id;
    if (el.name) return el.name;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest(".c-form-field, .form-group, [class*='FormField']");
    if (wrap) {
      const lbl = wrap.querySelector("label, .c-form-field__label");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  synthesizeValue(profile, fieldId) {
    const fid = (fieldId || "").toLowerCase();
    if (fid === "name" || fid === "full_name") {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined;
    }
    return undefined;
  }
};
