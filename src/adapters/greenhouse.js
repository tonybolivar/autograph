const AG_ADAPTER_GREENHOUSE = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/\/jobs?\/(\d+)/);
    return m ? m[1] : null;
  },

  isExcluded(el) {
    if (el.name === "g-recaptcha-response") return true;
    if (el.classList && el.classList.contains("iti__search-input")) return true;
    if (el.id && /^iti-\d+__search-input$/.test(el.id)) return true;
    if (el.closest && el.closest(".iti, [class*='iti__'], [class*='iti--'], .phone-input__country")) return true;
    return false;
  },

  shouldFillResumeInput() {
    return false;
  },

  async waitForReady() {
    await new Promise(r => setTimeout(r, 800));
    const start = Date.now();
    while (Date.now() - start < 5000) {
      if (document.querySelector('input#first_name, input#email, input[id^="question_"]')) return;
      await new Promise(r => setTimeout(r, 200));
    }
  },

  getFieldId(el) {
    if (el.id && !/^react|^:r/.test(el.id)) return el.id;
    if (el.name) return el.name;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest("[class*='question'], [class*='field'], .application-question, fieldset");
    if (wrap) {
      const lbl = wrap.querySelector("label, legend");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\s*\*\s*$/, "").trim();
    }
    return null;
  },

  isDropdown(el) {
    if (el.tagName.toLowerCase() === "select") return false;
    return el.getAttribute("role") === "combobox" || !!el.closest(".select__control, [class*='select__control']");
  },

  getDropdownValue(el) {
    const root = el.closest(".select__control, [class*='select__control']") || el;
    const single = root.querySelector(".select__single-value, [class*='select__single-value']");
    if (single) return single.textContent.trim();
    return (root.textContent || "").trim();
  },

  emptyPlaceholderValues: ["Select...", "Select", "", "Choose an option"],

  async fillDropdown(el, fieldId, candidates) {
    if (!candidates || candidates.length === 0) return false;
    const control = el.closest(".select__control, [class*='select__control']") || el;
    const input = control.querySelector("input[role='combobox']") || el;
    input.focus();
    control.click();
    await new Promise(r => setTimeout(r, 200));
    let menu = document.querySelector(".select__menu, [class*='select__menu']");
    if (!menu) {
      control.click();
      await new Promise(r => setTimeout(r, 200));
      menu = document.querySelector(".select__menu, [class*='select__menu']");
    }
    if (!menu) return false;
    const options = Array.from(menu.querySelectorAll(".select__option, [class*='select__option'], [role='option']"));
    for (const cand of candidates) {
      const lower = String(cand).toLowerCase().trim();
      const match = options.find(o => {
        const t = o.textContent.trim().toLowerCase();
        return t === lower || t.startsWith(lower);
      });
      if (match) {
        match.click();
        await new Promise(r => setTimeout(r, 80));
        return true;
      }
    }
    document.body.click();
    return false;
  },

  attachDropdownListener(el, fieldId, onChange) {
    const root = el.closest(".select__control, [class*='select__control']") || el;
    const observer = new MutationObserver(() => onChange("greenhouse-dropdown"));
    observer.observe(root, { childList: true, subtree: true, characterData: true });
  }
};
