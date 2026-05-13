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
    if (el.name === "email") return "Email";
    if (el.name === "phone") return "Phone";
    if (el.name === "org") return "Current Company";
    if (el.name === "location") return "Location";
    const urlMatch = el.name && el.name.match(/^urls\[(.+)\]$/);
    if (urlMatch) return `${urlMatch[1]} URL`;
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
    if (fieldId === "url_linkedin" && profile.linkedin_profile) return profile.linkedin_profile;
    if ((fieldId === "url_github" || fieldId === "url_githuburl") && profile.github_profile) return profile.github_profile;
    if ((fieldId === "url_portfolio" || fieldId === "url_website" || fieldId === "url_other") && profile.website) return profile.website;
    if ((fieldId === "url_twitter" || fieldId === "url_x") && profile.twitter_profile) return profile.twitter_profile;
    if (fieldId === "location" && (profile.city || profile.state_province)) {
      const parts = [profile.city, profile.state_province, profile.country].filter(Boolean);
      return parts.length ? parts.join(", ") : undefined;
    }
    return undefined;
  }
};
