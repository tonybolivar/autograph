var AG_EXCLUDED_INPUT_TYPES = new Set(["password", "file", "hidden", "image", "submit", "reset", "button"]);

var AG_TEXT_INPUT_TYPES = new Set(["text", "email", "tel", "url", "number", "search", "date", "range"]);

var AG_GENERIC_ID_RES = [
  /^(input|field|uid|el|wd|ember|react|ext)-?\d+$/i,
  /^[a-f0-9-]{20,}$/i,
  /^\d+$/
];

function agIsGenericIdToken(token) {
  if (!token) return true;
  for (const re of AG_GENERIC_ID_RES) {
    if (re.test(token)) return true;
  }
  if (/^[a-z]\w{2,5}\d+$/i.test(token) && token.length <= 8) return true;
  return false;
}

function agSlugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function agCleanLabel(text) {
  if (!text) return "";
  return String(text)
    .replace(/\s*\*+\s*/g, " ")
    .replace(/\s*\((?:required|optional)\)\s*/gi, " ")
    .replace(/\s+(?:required|optional)\s*\.?\s*$/gi, "")
    .replace(/^(?:required|optional)\s*\.\s*/gi, "")
    .replace(/\s+[0-9a-f]{6,}$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function agExtractLabel(el) {
  if (el.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lbl && lbl.textContent.trim()) return agCleanLabel(lbl.textContent);
  }
  const wrap = el.closest("label");
  if (wrap && wrap.textContent.trim()) return agCleanLabel(wrap.textContent);
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const ref = document.getElementById(labelledBy);
    if (ref && ref.textContent.trim()) return agCleanLabel(ref.textContent);
  }
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel && ariaLabel.trim()) return agCleanLabel(ariaLabel);
  if (el.type === "radio" || el.type === "checkbox") {
    const fs = el.closest("fieldset");
    if (fs) {
      const lg = fs.querySelector("legend");
      if (lg && lg.textContent.trim()) return agCleanLabel(lg.textContent);
    }
    const rg = el.closest("[role='radiogroup']");
    if (rg) {
      const rb = rg.getAttribute("aria-labelledby");
      if (rb) {
        const ref = document.getElementById(rb);
        if (ref && ref.textContent.trim()) return agCleanLabel(ref.textContent);
      }
    }
  }
  let cursor = el.previousElementSibling;
  let hops = 0;
  while (cursor && hops < 3) {
    if (cursor.tagName === "LABEL" && cursor.textContent.trim()) {
      return agCleanLabel(cursor.textContent);
    }
    if (cursor.querySelector && cursor.children.length <= 3) {
      const inner = cursor.querySelector("label");
      if (inner && inner.textContent.trim()) return agCleanLabel(inner.textContent);
    }
    cursor = cursor.previousElementSibling;
    hops++;
  }
  const placeholder = el.getAttribute("placeholder");
  if (placeholder && placeholder.trim()) return agCleanLabel(placeholder);
  return "";
}

function agExtractFieldId(el) {
  if (el.name && (el.type === "radio" || !agIsGenericIdToken(el.name))) return el.name;
  if (el.id && !agIsGenericIdToken(el.id)) return el.id;
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return agSlugify(ariaLabel);
  const label = agExtractLabel(el);
  if (label) return agSlugify(label);
  const placeholder = el.getAttribute("placeholder");
  if (placeholder) return agSlugify(placeholder);
  return null;
}

function agIsExcludedInput(el) {
  if (el.tagName.toLowerCase() !== "input") return false;
  const t = (el.type || "text").toLowerCase();
  if (AG_EXCLUDED_INPUT_TYPES.has(t)) return true;
  const style = window.getComputedStyle(el);
  if (style.webkitTextSecurity && style.webkitTextSecurity !== "none") return true;
  return false;
}

function agIsTextField(el) {
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea") return true;
  if (tag === "input") {
    const t = (el.type || "text").toLowerCase();
    return AG_TEXT_INPUT_TYPES.has(t);
  }
  return false;
}

function agIsSelectField(el) {
  return el.tagName.toLowerCase() === "select";
}

function agIsCheckRadio(el) {
  if (el.tagName.toLowerCase() !== "input") return false;
  const t = (el.type || "").toLowerCase();
  return t === "checkbox" || t === "radio";
}

function agFireFieldEvents(el) {
  el.focus();
  el.dispatchEvent(new Event("focusin", { bubbles: true }));
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("focusout", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

function agSetCheckedSafe(el, target) {
  el.focus();
  el.dispatchEvent(new Event("focusin", { bubbles: true }));
  const proto = window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "checked")?.set;

  if (el.type === "radio" && target && el.name) {
    const peers = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`);
    for (const peer of peers) {
      if (peer === el || !peer.checked) continue;
      if (setter) setter.call(peer, false);
      else peer.checked = false;
      peer.dispatchEvent(new Event("input", { bubbles: true }));
      peer.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  if (target && el.type === "radio") {
    if (setter) setter.call(el, true);
    else el.checked = true;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    if (!el.checked) {
      try { el.click(); } catch (e) {}
    }
  } else if (el.type === "checkbox") {
    if (el.checked !== target) {
      try { el.click(); } catch (e) {}
    }
    if (el.checked !== target) {
      if (setter) setter.call(el, target);
      else el.checked = target;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  } else {
    if (setter) setter.call(el, target);
    else el.checked = target;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  el.dispatchEvent(new Event("blur", { bubbles: true }));
  return el.checked === target;
}

function agNativeSetValue(el, value) {
  const tag = el.tagName.toLowerCase();
  if (tag !== "input" && tag !== "textarea") {
    el.value = value;
    return;
  }
  const proto = tag === "textarea" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.setAttribute("value", value);
}

function agFillTextField(el, value) {
  if (window.getComputedStyle(el).display === "none") return false;
  const current = el.value;
  const placeholder = el.placeholder;
  const isEmpty = !current
    || current.trim() === ""
    || (placeholder && current === placeholder)
    || (el.type === "range" && current === (el.getAttribute("min") || "0"));
  if (!isEmpty) return false;
  el.focus();
  el.dispatchEvent(new Event("focusin", { bubbles: true }));
  agNativeSetValue(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("focusout", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
  return true;
}

function agFillSelect(el, candidates) {
  const options = Array.from(el.options);
  for (const cand of candidates) {
    const lower = cand.toLowerCase();
    const opt = options.find(o =>
      o.value === cand ||
      o.textContent.trim() === cand ||
      o.value.toLowerCase() === lower ||
      o.textContent.trim().toLowerCase() === lower
    );
    if (opt) {
      el.value = opt.value;
      agFireFieldEvents(el);
      return true;
    }
  }
  return false;
}

function agClickRadioByLabel(el, value) {
  const groupName = el.name;
  if (!groupName) return false;
  const radios = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(groupName)}"]`);
  const valLower = String(value).toLowerCase();
  for (const r of radios) {
    const label = agExtractLabel(r).toLowerCase();
    if (label.startsWith(valLower) || r.value.toLowerCase() === valLower) {
      r.click();
      return true;
    }
  }
  return false;
}

function agFindDeclineOption(options) {
  if (typeof AG_DECLINE_REGEX === "undefined") return null;
  for (const o of options) {
    const text = (o.textContent || "").trim();
    const val = o.value || "";
    if (AG_DECLINE_REGEX.test(text) || AG_DECLINE_REGEX.test(val)) return o;
  }
  return null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    agSlugify,
    agCleanLabel,
    agExtractLabel,
    agExtractFieldId,
    agIsExcludedInput,
    agIsTextField,
    agIsSelectField,
    agIsCheckRadio,
    agFireFieldEvents,
    agNativeSetValue,
    agFillTextField,
    agFillSelect,
    agClickRadioByLabel,
    agFindDeclineOption
  };
}
