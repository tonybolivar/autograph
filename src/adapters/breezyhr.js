var AG_ADAPTER_BREEZYHR = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  getJobId(url) {
    const m = url.match(/breezy\.hr\/p\/([0-9a-f-]+)/);
    return m ? m[1] : null;
  },

  isExcluded(el) {
    if (el.name && /^hp_/.test(el.name)) return true;
    if (el.id && /^hp_/.test(el.id)) return true;
    return false;
  },

  getFieldId(el) {
    if (el.name && /^c[A-Z]/.test(el.name)) {
      return el.name.slice(1).replace(/([A-Z])/g, (m, c, i) => (i === 0 ? c : "_" + c)).toLowerCase();
    }
    if (el.name && /^section_\d+_question_\d+$/.test(el.name)) return el.name;
    if (el.id && !/^ng-/.test(el.id)) return el.id;
    if (el.name) return el.name;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest(".question, .form-group, .form-row, [class*='Question']");
    if (wrap) {
      const lbl = wrap.querySelector("label, .label, .question-text");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  async prefillPass({ workHistory }) {
    if (!workHistory || workHistory.length === 0) return;
    await this._fillWorkExperienceRows(workHistory);
  },

  async _fillWorkExperienceRows(workHistory) {
    const addLink = Array.from(document.querySelectorAll("a, button")).find(b => /^Add Position$/i.test((b.textContent || "").trim()));
    if (!addLink) return;
    const max = Math.min(workHistory.length, 5);
    let existing = document.querySelectorAll("li.experience").length;
    let safety = 8;
    while (existing < max && safety-- > 0) {
      addLink.click();
      await new Promise(r => setTimeout(r, 400));
      existing = document.querySelectorAll("li.experience").length;
    }
    const rows = document.querySelectorAll("li.experience");
    for (let i = 0; i < Math.min(rows.length, workHistory.length); i++) {
      const row = rows[i];
      const entry = workHistory[i];
      if (!entry) continue;
      const companyInput = row.querySelector('input[placeholder="Company"]:not([type="date"])');
      const titleInput = row.querySelector('input[placeholder="Title"]');
      const summaryEl = row.querySelector('textarea[placeholder="Summary"]');
      const dateInputs = row.querySelectorAll('input[type="date"]');
      if (companyInput && entry.company && !companyInput.value) {
        this._setText(companyInput, entry.company);
      }
      if (titleInput && entry.title && !titleInput.value) {
        this._setText(titleInput, entry.title);
      }
      if (summaryEl && entry.description && !summaryEl.value) {
        this._setText(summaryEl, entry.description);
      }
      if (dateInputs[0] && entry.start_year && !dateInputs[0].value) {
        const sm = String(this._monthNum(entry.start_month) || "01").padStart(2, "0");
        this._setText(dateInputs[0], `${entry.start_year}-${sm}-01`);
      }
      if (dateInputs[1] && entry.end_year && !dateInputs[1].value) {
        const em = String(this._monthNum(entry.end_month) || "12").padStart(2, "0");
        this._setText(dateInputs[1], `${entry.end_year}-${em}-01`);
      }
    }
  },

  _setText(el, value) {
    el.focus();
    const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  },

  _monthNum(name) {
    const map = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
    return map[name] || null;
  },

  synthesizeValue(profile, fieldId, label) {
    const fid = (fieldId || "").toLowerCase();
    const lab = (label || "").toLowerCase();
    if ((fid === "name" || fid === "full_name") && (profile.first_name || profile.last_name)) {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined;
    }
    if (fid === "address" && profile.address_line_1) {
      const parts = [profile.address_line_1, profile.city, profile.state_province, profile.zip_postal].filter(Boolean);
      return parts.join(", ");
    }
    if (/current\s+city,?\s+state,?\s+zip/i.test(lab) || /city,?\s+state\s+(and\s+)?zip/i.test(lab)) {
      const parts = [profile.city, profile.state_province, profile.zip_postal].filter(Boolean);
      return parts.length ? parts.join(", ") : undefined;
    }
    return undefined;
  }
};
