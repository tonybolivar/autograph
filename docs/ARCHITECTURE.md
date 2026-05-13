# Architecture

A pass-by-pass walk through how Autograph fills a form.

## The four contexts

1. **Background service worker** (`src/background/background.js`): runs once per Chrome session. Handles the action click (opens side panel), the install hook (opens welcome page), and badge feedback.
2. **Content script, isolated world** (`src/content/content.js` plus everything in `src/lib/` and `src/adapters/`): runs on every supported ATS page. Sees the DOM but not the page's JavaScript globals.
3. **Content script, MAIN world** (`src/adapters/*-main.js`): runs in the page's own JS context for React-controlled inputs that ignore the prototype-level value setter. Talks to the isolated world via `window.postMessage`.
4. **Extension UI pages** (`src/ui/options`, `src/ui/sidepanel`, `src/ui/welcome`): regular HTML pages with full `chrome.*` API access; share the lib modules via `<script src>` tags.

## The fill pipeline

Every step lives in `content.js`. Numbers below correspond to functions you can grep for.

1. **Site match** (IIFE bottom): `agFindSiteForHost(hostname)` checks the URL against `AG_SUPPORTED_SITES`. No match means the script no-ops. The user can also disable a site in `chrome.storage.local.siteToggles`.
2. **Adapter selection** (`pickAdapter`): merge `AG_ADAPTER_DEFAULT` with `AG_ADAPTER_<ID>` so the adapter only defines what it overrides.
3. **Wait for ready** (`waitForVisibility`, `adapter.waitForReady`): some ATSes load fields asynchronously. Workday and Oracle gate on first visible field.
4. **Discover** (`runFillPass`): query `adapter.fieldSelector` across the document plus any declared shadow roots. Skip excluded inputs.
5. **Classify each field**: text / select / custom-dropdown / checkbox / radio / multiselect.
6. **Resolve a fill value** in priority order:
   - **Captured** (this site already saw this fieldId).
   - **Recalled** (`agRecallByLabelSiblings`): same label seen on a previous field on this page.
   - **Synthesized** (`adapter.synthesizeValue`): adapter composes from profile (e.g., Lever's combined Full Name).
   - **Profile match** (`agMatchToProfileField`): the label matches a known alias, profile has a value.
   - **Demographic decline default** (`agIsDemographicField` + `agFindDeclineOption` or `AG_DECLINE_OPTION_LABELS`): if the field is a demographic question and no value is set, select the "Decline to self-identify" option.
7. **Fill** (`fillElement`):
   - Text: prototype native setter, then `input` -> `change` -> `blur` event sequence so React's value tracker accepts the change.
   - Native select: try direct value, then text match, then decline option.
   - Custom dropdown: adapter-defined open/select/close dance.
   - Radio: click the option whose label starts with the value, or matches a "Decline" pattern for demographics.
   - Checkbox: toggle to match the desired state.
8. **Highlight** (`highlight`): mark with `data-ag-filled="true"` so `src/styles/content.css` paints the field yellow with a gold outline.
9. **Attach capture listeners** (`attachCapture` -> `captureValue`): when the user later edits a field, save to `chrome.storage.local.fieldData[siteId][fieldId]`. About-section fields also write back to the master profile via `agCaptureToProfile`.
10. **Observe** (`setupObserver`): a MutationObserver re-runs steps 4-9 on any added DOM. Multi-step apps (Workday, Oracle) work because the next page's fields trigger another pass.
11. **Toast** (`showFillToast`): once the run settles, show "Autograph filled N fields" in a shadow-DOM-scoped overlay.

## Storage

| Key | Scope | Purpose |
|-----|-------|---------|
| `chrome.storage.sync.masterProfile` | cross-device | The canonical user profile (name, email, demographics). |
| `chrome.storage.local.fieldData` | per-device | `{ siteId: { fieldId: value } }`. Per-site captured custom answers. |
| `chrome.storage.local.fieldLabels` | per-device | `{ siteId: { fieldId: humanLabel } }`. Used for sibling recall. |
| `chrome.storage.local.siteToggles` | per-device | `{ siteId: bool }`. User-controlled enable/disable per ATS. |

## What's not here

- **No telemetry.** No `fetch`, no analytics SDK, nothing that talks to a server. Search the codebase for `fetch(` to confirm.
- **No accounts.** No login, no remote profile sync beyond Chrome's native `storage.sync`.
- **No remote control.** The background worker doesn't open WebSockets; the content script only `postMessage`s within its own page.

## Multi-tenant siteIds

Some platforms (Workday, Oracle, SuccessFactors) deploy one ATS across many companies, where each tenant has its own subdomain or path. Cross-tenant field shapes diverge enough that capturing the user's "Why this company?" answer on tenant A and replaying it on tenant B is the wrong default. Adapters express this with:

- `getInstanceId(url)`: returns the tenant id from the URL.
- `instanceFields`: a list of fieldId patterns that are tenant-specific. The orchestrator stores those values under `siteId|instanceId` instead of `siteId`.

Standard fields (name, email) stay at `siteId` so they recall across tenants.

## Adding a feature: where it goes

| Change | File |
|--------|------|
| Support a new ATS | `src/adapters/<name>.js` + new entry in `src/lib/sites.js` + new entry in `manifest.json` `content_scripts` and `host_permissions` |
| New field in master profile | `src/lib/masterProfile.js` (`AG_PROFILE_FIELDS`) + new aliases in `src/lib/labelMatcher.js` + UI auto-renders from schema |
| New decline string | `src/lib/normalizers.js` (`AG_DECLINE_OPTION_LABELS` or `AG_DECLINE_REGEX`) |
| Tweak fill behavior across all sites | `src/lib/domUtils.js` |
| Change the toast or highlight style | `src/content/content.js` (toast lives in shadow DOM there) and `src/styles/content.css` |
