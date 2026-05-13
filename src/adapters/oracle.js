const AG_ADAPTER_ORACLE = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, oj-select-single, oj-select-multiple, oj-combobox-one',

  getJobId(url) {
    const m = url.match(/[?&]job=(\d+)/) ||
              url.match(/CandidateExperience\/[^/]+\/job\/(\d+)/) ||
              url.match(/jobNumber=(\d+)/i);
    return m ? m[1] : null;
  },

  getInstanceId(url) {
    try {
      const u = new URL(url);
      return u.hostname.split(".")[0];
    } catch (e) {
      return null;
    }
  },

  getFieldId(el) {
    const host = el.closest("oj-input-text, oj-input-email, oj-text-area, oj-select-single, oj-select-multiple, oj-combobox-one, oj-radioset, oj-checkboxset") || el;
    if (host.id) return host.id;
    if (el.name) return el.name;
    return null;
  },

  getFieldLabel(el) {
    const host = el.closest("oj-input-text, oj-input-email, oj-text-area, oj-select-single, oj-select-multiple, oj-combobox-one, oj-radioset, oj-checkboxset") || el;
    const hint = host.getAttribute && host.getAttribute("label-hint");
    if (hint) return hint;
    const labelledBy = host.getAttribute && host.getAttribute("aria-labelledby");
    if (labelledBy) {
      const ref = document.getElementById(labelledBy);
      if (ref && ref.textContent.trim()) return ref.textContent.trim();
    }
    const wrap = el.closest(".oj-form-control, .oj-flex-item");
    if (wrap) {
      const lbl = wrap.querySelector(".oj-label, label, legend");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  isDropdown(el) {
    const tag = el.tagName.toLowerCase();
    return tag === "oj-select-single" || tag === "oj-select-multiple" || tag === "oj-combobox-one";
  },

  getDropdownValue(el) {
    const value = el.getAttribute("value");
    if (value) return value;
    const display = el.querySelector(".oj-select-choice");
    return display ? display.textContent.trim() : "";
  },

  emptyPlaceholderValues: ["", "Select a value", "Select"],

  async fillDropdown(el, fieldId, candidates) {
    if (!candidates || candidates.length === 0) return false;
    el.click();
    await new Promise(r => setTimeout(r, 250));
    const dropdown = document.querySelector(".oj-listbox-drop:not(.oj-listbox-hidden), .oj-select-results-active");
    if (!dropdown) return false;
    const options = Array.from(dropdown.querySelectorAll(".oj-listbox-result-label, [role='option']"));
    if (options.length === 0) return false;
    for (const cand of candidates) {
      const lower = String(cand).toLowerCase().trim();
      const m = options.find(o => o.textContent.trim().toLowerCase() === lower || o.textContent.trim().toLowerCase().startsWith(lower));
      if (m) {
        m.click();
        await new Promise(r => setTimeout(r, 100));
        return true;
      }
    }
    document.body.click();
    return false;
  },

  suppressRefillOnRerender: true
};
