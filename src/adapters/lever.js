const AG_ADAPTER_LEVER = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea',

  getJobId(url) {
    const m = url.match(/jobs\.lever\.co\/([^/]+)\/([^/?#]+)/);
    return m ? `${m[1]}/${m[2]}` : null;
  },

  getFieldId(el) {
    if (!el.name) return null;
    if (el.name === "name") return "full_name";
    if (el.name === "email") return "email";
    if (el.name === "phone") return "phone_number";
    if (el.name === "org") return "current_company";
    if (el.name === "location") return "location";
    const urlMatch = el.name.match(/^urls\[(.+)\]$/);
    if (urlMatch) {
      const site = urlMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, "_");
      return `url_${site}`;
    }
    const cardMatch = el.name.match(/^cards\[([^\]]+)\]\[([^\]]+)\]$/);
    if (cardMatch) {
      const card = cardMatch[1].replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 24);
      const field = cardMatch[2].replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 24);
      return `card_${card}_${field}`;
    }
    return null;
  },

  getFieldLabel(el) {
    if (el.name === "name") return "Full name";
    const question = el.closest(".application-question, .application-field, .application-additional");
    if (question) {
      const labelEl = question.querySelector(".application-label, .text, label, .question");
      if (labelEl && labelEl.textContent.trim()) {
        return labelEl.textContent.replace(/\*$/, "").trim();
      }
    }
    return null;
  },

  synthesizeValue(profile, fieldId) {
    if (fieldId === "full_name") {
      const f = (profile.first_name || "").trim();
      const l = (profile.last_name || "").trim();
      const combined = `${f} ${l}`.trim();
      return combined || undefined;
    }
    if (fieldId === "url_linkedin" && profile.linkedin_profile) {
      return profile.linkedin_profile;
    }
    return undefined;
  }
};
