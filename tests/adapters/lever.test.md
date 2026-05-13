# Lever adapter runbook

A prose-form test the agent (or a developer) can execute via the Playwright MCP. The Playwright MCP cannot load a Chrome extension with custom flags, so the verification splits into two parts:

1. **DOM discovery** (Playwright): confirm the live posting's form structure matches what `src/adapters/lever.js` expects.
2. **End-to-end fill** (manual Chrome): load Autograph unpacked, visit the URL, observe the fill.

## Setup

1. Pick a live Lever posting from `docs/TEST_URLS.md`.
2. In Chrome with Autograph loaded unpacked, fill out the master profile in the options page (at minimum: first_name, last_name, email, phone_number, linkedin_profile).

## Part 1: DOM discovery via Playwright MCP

```
browser_navigate(<lever-apply-url>)
browser_wait_for({ text: "Submit application" })
browser_evaluate("""
  const fields = Array.from(document.querySelectorAll(
    'input:not([type=hidden]):not([type=file]):not([type=submit]), select, textarea'
  ));
  return fields.map(f => ({
    name: f.name,
    id: f.id,
    type: f.type || f.tagName.toLowerCase(),
    label: (f.closest('.application-question, .application-field')
      ?.querySelector('.application-label, label')?.textContent || '').trim()
  }));
""")
```

**Pass condition**: returned list includes at least one of each:
- `{ name: "name", ... }` (full name)
- `{ name: "email", ... }`
- `{ name: "phone", ... }`
- A `urls[LinkedIn]` or similar urls[*] field
- A custom `cards[...][...]` question

If selectors miss, update `src/adapters/lever.js`.

## Part 2: End-to-end fill (manual)

1. In Chrome: `chrome://extensions` -> Reload Autograph -> visit the Lever apply URL.
2. Within ~1 second, expect the Autograph toast to say "Autograph filled N fields".
3. Open DevTools, check:
   - Name field is `${first_name} ${last_name}`
   - Email matches profile
   - Phone matches profile
   - LinkedIn matches profile
   - Filled fields have `data-ag-filled="true"` attribute and yellow highlight
4. Manually type a value into one of the custom `cards[...]` questions, click outside to blur, navigate away and back.
5. On return, expect that custom value to pre-fill (recall via `chrome.storage.local.fieldData`).

## Pass / fail

- Pass: all 4 standard fields filled, custom field captured and recalled on return.
- Fail: any standard field skipped. Open DevTools, run:
  ```js
  const el = document.querySelector('input[name="name"]');
  console.log({ id: el.id, name: el.name, label: el.closest('.application-question')?.textContent });
  ```
  Update `src/adapters/lever.js` to handle the variant.

## Known issues

- Lever's "Full name" -> first+last split: handled via `synthesizeValue("full_name")` in the adapter, which composes from the profile.
- Captcha / reCAPTCHA on apply submit is out of scope.
