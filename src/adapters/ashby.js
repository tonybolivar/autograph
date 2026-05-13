const AG_ADAPTER_ASHBY = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]), select, textarea, [role="combobox"], [data-testid^="_systemfield_"], [data-testid^="_customfield_"]',

  getJobId(url) {
    const m = url.match(/jobs\.ashbyhq\.com\/([^/]+)\/([0-9a-f-]{8,})/);
    return m ? `${m[1]}/${m[2]}` : null;
  },

  getFieldId(el) {
    const testid = el.getAttribute("data-testid") || el.closest("[data-testid]")?.getAttribute("data-testid");
    if (testid) {
      const sys = testid.match(/^_(?:system|custom)field_(.+)$/);
      if (sys) return sys[1].toLowerCase();
      if (testid.startsWith("input-")) return testid.slice(6);
    }
    if (el.name) {
      const sys = el.name.match(/^_(?:system|custom)field_(.+)$/);
      if (sys) return sys[1].toLowerCase();
      return el.name;
    }
    if (el.id) {
      const sys = el.id.match(/^_(?:system|custom)field_(.+)$/);
      if (sys) return sys[1].toLowerCase();
      if (!/^:r/.test(el.id)) return el.id;
    }
    return null;
  },

  getFieldLabel(el) {
    const field = el.closest("[data-testid^='_systemfield_'], [data-testid^='_customfield_'], .ashby-application-form-field-entry, fieldset");
    if (field) {
      const lbl = field.querySelector("label, legend, [class*='Label']");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  isDropdown(el) {
    if (el.tagName.toLowerCase() === "select") return false;
    if (el.getAttribute("role") === "combobox") return true;
    if (el.getAttribute("aria-haspopup") === "listbox") return true;
    return false;
  },

  getDropdownValue(el) {
    const display = el.querySelector("[class*='SelectedOption'], [class*='single-value']");
    if (display && display.textContent.trim()) return display.textContent.trim();
    const aria = el.getAttribute("aria-activedescendant");
    if (aria) {
      const ref = document.getElementById(aria);
      if (ref) return ref.textContent.trim();
    }
    return (el.textContent || "").trim();
  },

  async fillDropdown(el, fieldId, candidates) {
    if (!candidates || candidates.length === 0) return false;
    el.focus();
    el.click();
    await new Promise(r => setTimeout(r, 150));
    const listboxId = el.getAttribute("aria-controls");
    let options = [];
    if (listboxId) {
      const lb = document.getElementById(listboxId);
      if (lb) options = Array.from(lb.querySelectorAll('[role="option"], [class*="Option"]'));
    }
    if (options.length === 0) {
      options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [class*="MenuList"] [role="option"]'));
    }
    if (options.length === 0) {
      el.blur();
      return false;
    }
    for (const cand of candidates) {
      const lower = String(cand).toLowerCase();
      const match = options.find(o => {
        const t = o.textContent.trim().toLowerCase();
        return t === lower || t.startsWith(lower);
      });
      if (match) {
        match.click();
        await new Promise(r => setTimeout(r, 80));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("blur", { bubbles: true }));
        return true;
      }
    }
    document.body.click();
    return false;
  },

  attachDropdownListener(el, fieldId, onChange) {
    const observer = new MutationObserver(() => onChange("ashby-dropdown"));
    observer.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-activedescendant"] });
  },

  synthesizeValue(profile, fieldId, label) {
    const fid = (fieldId || "").toLowerCase();
    const lab = (label || "").toLowerCase();
    if ((fid === "name" || fid === "fullname" || fid === "full_name") && (profile.first_name || profile.last_name)) {
      const f = (profile.first_name || "").trim();
      const l = (profile.last_name || "").trim();
      return `${f} ${l}`.trim() || undefined;
    }
    if (/where\s+are\s+you\s+currently\s+located|current\s+location/.test(lab)) {
      const parts = [profile.city, profile.state_province, profile.country].filter(Boolean);
      return parts.length ? parts.join(", ") : undefined;
    }
    return undefined;
  }
};
