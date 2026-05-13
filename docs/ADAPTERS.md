# Writing an adapter

An "adapter" teaches Autograph how to read and fill a specific ATS. The contract lives in `src/adapters/_default.js`. Each ATS has its own file under `src/adapters/<name>.js` that exports a global `AG_ADAPTER_<NAME>` object overriding the hooks it cares about.

## The minimum viable adapter

```js
const AG_ADAPTER_EXAMPLE = {
  getJobId(url) {
    const m = url.match(/example\.com\/jobs?\/(\d+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.name) return el.name;
    if (el.id) return el.id;
    return null;
  },

  getFieldLabel(el) {
    const wrap = el.closest(".form-field, .form-group");
    if (wrap) {
      const lbl = wrap.querySelector("label");
      if (lbl) return lbl.textContent.trim();
    }
    return null;
  }
};
```

That's it. The default adapter handles native inputs, selects, checkboxes, and radios with a sensible event sequence. You only override when the site does something unusual.

## When you need more

### Custom dropdowns

If the site uses a custom widget instead of a native `<select>`:

```js
isDropdown(el) {
  return el.getAttribute("role") === "combobox";
},

getDropdownValue(el) {
  return el.querySelector(".selected-text")?.textContent.trim() || "";
},

async fillDropdown(el, fieldId, candidates) {
  el.click();
  await new Promise(r => setTimeout(r, 150));
  const options = Array.from(document.querySelectorAll("[role='option']"));
  for (const cand of candidates) {
    const m = options.find(o => o.textContent.trim().toLowerCase() === cand.toLowerCase());
    if (m) { m.click(); return true; }
  }
  return false;
}
```

### React-controlled inputs

Standard inputs fire `input` events that React listens to. If React reverts the value on next render, the issue is that `el.value = x` doesn't trip React's value tracker. The default `agFillTextField` uses the prototype-level native setter which usually works.

If it still doesn't, the site needs a MAIN-world helper. Add `src/adapters/<name>-main.js` and register it in `manifest.json` with `"world": "MAIN"`. The MAIN-world script can access page-level objects (including React fibers) that the isolated content script cannot. See `greenhouse-main.js` for the pattern.

### Composite fields (e.g. "Full name")

Use `synthesizeValue` to compose a value from the master profile before the standard label matcher runs:

```js
synthesizeValue(profile, fieldId, label) {
  if (fieldId === "full_name") {
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined;
  }
}
```

### Multi-instance sites (Workday, Oracle)

Some platforms run one extension across many tenants where the URL or hostname identifies the tenant. Use `getInstanceId(url)` plus `instanceFields: [/^job-specific-/, ...]` to keep tenant-specific field data separate from cross-tenant data.

## Hooks reference

See `_default.js` for the full surface. Common ones:

- `fieldSelector` (string): override the global query used to find fillable elements.
- `isExcluded(el)` (boolean): true if Autograph should skip this element entirely.
- `getFieldId(el)`, `getFieldLabel(el)`: extract a stable id and human label.
- `isTextField`, `isDropdown`, `isCheckbox`, `isMultiselect`: classify a non-obvious element.
- `fillTextField`, `fillDropdown`, `fillSelect`, `fillCheckbox`: site-specific fill behavior.
- `getDropdownValue`, `getCheckboxChecked`, `getRadioValue`: read the current value back.
- `attachDropdownListener`, `attachCheckboxListener`, `attachTextCaptureListener`: how to know when the user manually edits a field, so we can capture it.
- `emptyPlaceholderValues`: strings like "Select..." that should count as "not filled".
- `waitForReady()`: return a promise that resolves once the form is rendered (for SPAs).
- `gateFillOnVisibility`: if true, wait until at least one matching element is in the viewport before the first fill pass.
- `suppressRefillOnRerender`: if true, once a field is filled, don't refill it even if the framework re-renders the DOM (avoids fighting React).
- `getHighlightSelector(fieldId, el)`: for shadow DOM or weird hosts, return a CSS selector to apply the highlight style to instead of using a `data-ag-filled` attribute.

## Testing

1. Write a runbook at `tests/adapters/<name>.test.md` following the Lever template.
2. Confirm in a real Chrome with Autograph unpacked-loaded that the adapter fills the basic fields and captures custom ones.
3. Open a PR.
