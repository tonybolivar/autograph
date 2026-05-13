var AG_ADAPTER_EIGHTFOLD = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]',

  isExcluded(el) {
    if (!el) return false;
    if (el.closest(".ant-modal, [role='dialog'], [role='alertdialog'], [class*='Modal'], [class*='Dialog'], [class*='Drawer']")) return true;
    var pieces = [];
    if (el.id) {
      var lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) pieces.push(lbl.textContent);
    }
    var wrapLabel = el.closest("label");
    if (wrapLabel) pieces.push(wrapLabel.textContent);
    var nearby = el.closest("[class*=field], [class*=Field], [class*=form-group], .ef-form-field");
    if (nearby) {
      var nLbl = nearby.querySelector("label, legend, [class*=label]");
      if (nLbl) pieces.push(nLbl.textContent);
    }
    pieces.push(el.getAttribute("aria-label") || "");
    pieces.push(el.getAttribute("name") || "");
    pieces.push(el.id || "");
    var label = pieces.join(" ").toLowerCase();
    if (/save.*answers.*future|save my answers|save.*application.*future/.test(label)) return true;
    if (el.type === "checkbox" && /consent|i agree|privacy|data protection|terms.*conditions|opt.in.*marketing|marketing.*opt.in|email.*updates|i have read|acknowledge/.test(label)) return true;
    return false;
  },

  suppressRefillOnRerender: true,
  gateFillOnVisibility: true,

  async waitForReady() {
    await new Promise(r => setTimeout(r, 1500));
    var start = Date.now();
    while (Date.now() - start < 6000) {
      var modal = document.querySelector(".ant-modal-open, [role='dialog']:not([aria-hidden='true']), .ant-modal-wrap:not([style*='display: none'])");
      var hasForm = document.querySelector("input[id^='Contact_Information_'], input[name^='Contact_Information']");
      if (hasForm && !modal) return;
      await new Promise(r => setTimeout(r, 200));
    }
  },


  getJobId(url) {
    const m = url.match(/eightfold\.ai\/[^/]+\/(?:job|position)\/([A-Za-z0-9-]+)/) ||
              url.match(/eightfold\.ai\/careers\/job\/([A-Za-z0-9-]+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.name) return el.name;
    if (el.id && !/^:r/.test(el.id)) return el.id;
    const testid = el.getAttribute("data-test-id") || el.getAttribute("data-testid");
    if (testid) return testid;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest(".form-group, .ef-form-field, [class*='FormField'], fieldset");
    if (wrap) {
      const lbl = wrap.querySelector("label, legend, [class*='label']");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  isDropdown(el) {
    if (el.tagName.toLowerCase() === "select") return false;
    return el.getAttribute("role") === "combobox" || !!el.closest(".ant-select, [class*='ant-select']");
  },

  getDropdownValue(el) {
    const root = el.closest(".ant-select, [class*='ant-select']") || el;
    const selected = root.querySelector(".ant-select-selection-item, [class*='selection-item']");
    if (selected && selected.textContent.trim()) return selected.textContent.trim();
    return (root.textContent || "").trim();
  },

  emptyPlaceholderValues: ["", "Please select", "Select"],

  async fillDropdown(el, fieldId, candidates) {
    if (!candidates || candidates.length === 0) return false;
    const root = el.closest(".ant-select, [class*='ant-select']") || el;
    root.click();
    await new Promise(r => setTimeout(r, 180));
    const options = Array.from(document.querySelectorAll(".ant-select-item, [class*='ant-select-item'], [role='option']"));
    if (options.length === 0) return false;
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
  }
};
