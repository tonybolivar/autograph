var AG_ADAPTER_BREEZYHR = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/breezy\.hr\/p\/([0-9a-f-]+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.id && !/^ng-/.test(el.id)) return el.id;
    if (el.name) return el.name;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest(".question, .form-group, .form-row, [class*='Question']");
    if (wrap) {
      const lbl = wrap.querySelector("label, .label, .question-text");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  synthesizeValue(profile, fieldId) {
    const fid = (fieldId || "").toLowerCase();
    if ((fid === "name" || fid === "full_name") && (profile.first_name || profile.last_name)) {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined;
    }
    return undefined;
  }
};
