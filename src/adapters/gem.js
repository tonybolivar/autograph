var AG_ADAPTER_GEM = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/jobs\.gem\.com\/[^/]+\/([0-9a-f-]{8,})/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.id && !/^:r/.test(el.id)) return el.id;
    if (el.name) return el.name;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest("[class*='FormField'], [class*='form-field'], fieldset, label");
    if (wrap) {
      const lbl = wrap.tagName.toLowerCase() === "label"
        ? wrap
        : wrap.querySelector("label, legend, [class*='label']");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  isDropdown(el) {
    if (el.tagName.toLowerCase() === "select") return false;
    return el.getAttribute("role") === "combobox";
  },

  async fillDropdown(el, fieldId, candidates) {
    if (!candidates || candidates.length === 0) return false;
    el.click();
    await new Promise(r => setTimeout(r, 180));
    const listboxId = el.getAttribute("aria-controls");
    const options = listboxId
      ? Array.from(document.getElementById(listboxId)?.querySelectorAll("[role='option']") || [])
      : Array.from(document.querySelectorAll("[role='listbox'] [role='option']"));
    if (options.length === 0) {
      el.blur();
      return false;
    }
    for (const cand of candidates) {
      const lower = String(cand).toLowerCase().trim();
      const m = options.find(o => o.textContent.trim().toLowerCase() === lower || o.textContent.trim().toLowerCase().startsWith(lower));
      if (m) {
        m.click();
        await new Promise(r => setTimeout(r, 80));
        return true;
      }
    }
    document.body.click();
    return false;
  },

  synthesizeValue(profile, fieldId) {
    const fid = (fieldId || "").toLowerCase();
    if (fid === "name" || fid === "full_name") {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined;
    }
    return undefined;
  }
};
