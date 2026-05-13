var AG_ADAPTER_GREENHOUSE = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/\/jobs?\/(\d+)/);
    return m ? m[1] : null;
  },

  isExcluded(el) {
    if (el.name === "g-recaptcha-response") return true;
    if (el.classList && el.classList.contains("iti__search-input")) return true;
    if (el.id && /^iti-\d+__search-input$/.test(el.id)) return true;
    if (el.classList && el.classList.contains("iti__tel-input")) return false;
    if (el.closest && el.closest(".phone-input__country")) return true;
    if (el.closest && el.closest(".iti__dropdown-content, .iti__country-list, .iti__flag-container")) return true;
    if (el.id === "country" && el.getAttribute("role") === "combobox") {
      var phoneWrap = el.closest("[class*='intl-tel'], [class*='phone'], .iti");
      if (phoneWrap) return true;
    }
    return false;
  },

  getFieldId(el) {
    if (el.id && !/^react|^:r/.test(el.id)) return el.id;
    if (el.name) return el.name;
    return null;
  },

  shouldFillResumeInput() {
    return false;
  },

  async waitForReady() {
    await new Promise(r => setTimeout(r, 1200));
    const start = Date.now();
    while (Date.now() - start < 8000) {
      var basic = document.querySelector('input#first_name, input#email');
      var eeoc = document.querySelectorAll('[class*="select__control"]').length >= 4;
      if (basic && eeoc) return;
      await new Promise(r => setTimeout(r, 200));
    }
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

  async fillDropdown(el, fieldId, candidates, ctx) {
    if (!candidates || candidates.length === 0) return false;
    var control = el.closest(".select__control, [class*='select__control']") || el;
    var input = control.querySelector("input[role='combobox']") || el;
    if (el.id === "candidate-location" || (el.getAttribute && el.getAttribute("aria-autocomplete") === "list" && fieldId === "city")) {
      var profile = ctx && ctx.masterProfile ? ctx.masterProfile : {};
      var typed = profile.city ? profile.city : String(candidates[0]);
      var proto = window.HTMLInputElement.prototype;
      var setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      input.focus();
      if (setter) setter.call(input, ""); else input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      if (setter) setter.call(input, typed); else input.value = typed;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      var pick = null;
      var locOptions = [];
      for (var waitStep = 0; waitStep < 8; waitStep++) {
        await new Promise(r => setTimeout(r, 300));
        var locMenu = control.parentElement?.querySelector(".select__menu, [class*='select__menu']") || document.querySelector(".select__menu, [class*='select__menu']");
        if (!locMenu) continue;
        locOptions = Array.from(locMenu.querySelectorAll(".select__option, [class*='select__option'], [role='option']"));
        if (locOptions.length === 0) continue;
        var loadingOnly = locOptions.length === 1 && /loading|searching/i.test(locOptions[0].textContent);
        if (loadingOnly) continue;
        break;
      }
      if (locOptions.length === 0) return false;
      var stateLower = (profile.state_province || "").toLowerCase().trim();
      var countryLower = (profile.country || "").toLowerCase().trim();
      if (stateLower) pick = locOptions.find(o => o.textContent.toLowerCase().includes(stateLower));
      if (!pick && countryLower) pick = locOptions.find(o => o.textContent.toLowerCase().includes(countryLower));
      if (!pick) pick = locOptions[0];
      pick.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
      pick.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
      pick.click();
      await new Promise(r => setTimeout(r, 150));
      return true;
    }
    var findMenu = () => {
      var local = control.parentElement?.querySelector(".select__menu, [class*='select__menu']");
      if (local) return local;
      return document.querySelector(".select__menu, [class*='select__menu']");
    };
    var openAttempts = [
      async () => {
        input.focus();
        control.click();
      },
      async () => {
        input.focus();
        control.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
        control.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
        control.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
      },
      async () => {
        input.focus();
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      }
    ];
    var menu = null;
    for (var attempt of openAttempts) {
      await attempt();
      await new Promise(r => setTimeout(r, 220));
      menu = findMenu();
      if (menu) break;
    }
    if (!menu) return false;
    var options = Array.from(menu.querySelectorAll(".select__option, [class*='select__option'], [role='option']"));
    for (var cand of candidates) {
      var lower = String(cand).toLowerCase().trim();
      var match = options.find(o => {
        var t = o.textContent.trim().toLowerCase();
        return t === lower || t.startsWith(lower);
      });
      if (match) {
        match.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
        match.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
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
