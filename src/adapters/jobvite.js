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
  },

  async prefillPass() {
    const headers = document.querySelectorAll("h3.jv-step-header");
    for (const h of headers) {
      if (!/Add Resume|Resume\s*\*|Add CV/i.test(h.textContent || "")) continue;
      let cursor = h.parentElement;
      let depth = 0;
      let btn = null;
      while (cursor && depth < 5 && !btn) {
        btn = Array.from(cursor.querySelectorAll("button.jv-button, button")).find(b => /^Select$/i.test((b.textContent || "").trim()));
        cursor = cursor.parentElement;
        depth++;
      }
      if (btn) {
        try { btn.click(); } catch (e) {}
        await new Promise(r => setTimeout(r, 400));
      }
    }
  },

  shouldFillResumeInput(el) {
    const attachment = el.closest(".jv-add-attachment, .jv-add-attachment-item");
    if (!attachment) return undefined;
    let cur = attachment;
    for (let i = 0; i < 6 && cur; i++) {
      const h3 = cur.parentElement?.querySelector(":scope > h3, :scope > div > h3");
      if (h3 && /resume|cv/i.test(h3.textContent || "")) return true;
      if (h3 && /cover/i.test(h3.textContent || "")) return false;
      cur = cur.parentElement;
    }
    return undefined;
  }
};
