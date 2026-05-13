var AG_ADAPTER_RECRUITEE = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/recruitee\.com\/o\/([^/]+)/) || url.match(/careers\.tellent\.com\/[^/]+\/([^/]+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.name) {
      const m = el.name.match(/^candidate\.openQuestionAnswers\.(\d+)\.(.+)$/);
      if (m) return `oqa_${m[1]}_${m[2]}`;
      const direct = el.name.match(/^candidate\.(.+)$/);
      if (direct) return direct[1].toLowerCase();
      return el.name;
    }
    if (el.id) {
      const m = el.id.match(/^input-candidate\.([^.\-]+)/);
      if (m) return m[1].toLowerCase();
      if (!/^[a-f0-9-]{20,}$/.test(el.id)) return el.id;
    }
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest(".c-form-field, .form-group, [class*='FormField'], [class*='c-form']");
    if (wrap) {
      const directLbl = wrap.querySelector(":scope > label, :scope > legend, :scope > [class*='abel']");
      if (directLbl && directLbl.textContent.trim()) return directLbl.textContent.replace(/\*$/, "").trim();
      const lbl = wrap.querySelector("label, legend, [class*='abel']");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  isCheckbox(el) {
    if (el.tagName.toLowerCase() !== "input") return false;
    var t = (el.type || "").toLowerCase();
    return t === "radio" || t === "checkbox";
  },

  fillCheckbox(el, target) {
    if (el.checked === target) return false;
    var labelEl = null;
    if (el.id) labelEl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (!labelEl) {
      var sib = el.nextElementSibling;
      while (sib) {
        if (sib.tagName === "LABEL") { labelEl = sib; break; }
        sib = sib.nextElementSibling;
      }
    }
    if (!labelEl) labelEl = el.parentElement && el.parentElement.querySelector("label");
    var clickTarget = labelEl || el;
    if (target) {
      try {
        clickTarget.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
        clickTarget.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
        clickTarget.click();
      } catch (e) {}
    }
    if (el.checked !== target) {
      var proto = window.HTMLInputElement.prototype;
      var setter = Object.getOwnPropertyDescriptor(proto, "checked")?.set;
      if (setter) setter.call(el, target); else el.checked = target;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return el.checked === target;
  },

  getCheckboxChecked(el) {
    return el.checked;
  },

  synthesizeValue(profile, fieldId, label) {
    const fid = (fieldId || "").toLowerCase();
    const lab = (label || "").toLowerCase();
    if (fid === "name" || fid === "full_name") {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined;
    }
    if (/what\s+city\s+are\s+you\s+currently\s+based/i.test(lab) || /current\s+city/i.test(lab)) {
      return profile.city || undefined;
    }
    if (/state\s+(do\s+you\s+live|are\s+you\s+located|of\s+residence)/i.test(lab) || /which\s+state/i.test(lab)) {
      return profile.state_province || undefined;
    }
    if (/desired.*salary|salary.*expectation/i.test(lab)) {
      return profile.desired_salary || undefined;
    }
    return undefined;
  }
};
