const AG_ADAPTER_TEAMTAILOR = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea',

  getJobId(url) {
    const m = url.match(/teamtailor\.com\/jobs\/([^/?#]+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.id) return el.id.replace(/^candidate_|^job_application_/, "");
    if (el.name) return el.name.replace(/^candidate\[|\]$/g, "");
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
  },

  synthesizeValue(profile, fieldId) {
    const fid = (fieldId || "").toLowerCase();
    if (fid === "name" || fid === "full_name") {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined;
    }
    return undefined;
  }
};
