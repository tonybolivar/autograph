var AG_ADAPTER_BREEZYHR = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/breezy\.hr\/p\/([0-9a-f-]+)/);
    return m ? m[1] : null;
  },

  isExcluded(el) {
    if (el.name && /^hp_/.test(el.name)) return true;
    if (el.id && /^hp_/.test(el.id)) return true;
    return false;
  },

  getFieldId(el) {
    if (el.name && /^c[A-Z]/.test(el.name)) {
      return el.name.slice(1).replace(/([A-Z])/g, (m, c, i) => (i === 0 ? c : "_" + c)).toLowerCase();
    }
    if (el.name && /^section_\d+_question_\d+$/.test(el.name)) return el.name;
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

  synthesizeValue(profile, fieldId, label) {
    const fid = (fieldId || "").toLowerCase();
    const lab = (label || "").toLowerCase();
    if ((fid === "name" || fid === "full_name") && (profile.first_name || profile.last_name)) {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined;
    }
    if (fid === "address" && profile.address_line_1) {
      const parts = [profile.address_line_1, profile.city, profile.state_province, profile.zip_postal].filter(Boolean);
      return parts.join(", ");
    }
    if (/current\s+city,?\s+state,?\s+zip/i.test(lab) || /city,?\s+state\s+(and\s+)?zip/i.test(lab)) {
      const parts = [profile.city, profile.state_province, profile.zip_postal].filter(Boolean);
      return parts.length ? parts.join(", ") : undefined;
    }
    return undefined;
  }
};
