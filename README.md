# Autograph

A free, open-source Chrome extension that autofills job applications across 21+ ATS platforms. No accounts. No paywalls. No tracking.

## Why

The job hunt is brutal enough without retyping your name, email, address, work authorization, and demographics into a hundred different applicant tracking systems. Existing autofill tools either charge a subscription, lock the good stuff behind a free-tier counter, or quietly phone home with everything you type.

Autograph is GPL-3.0 licensed, so it stays free forever. Fork it, ship your own changes, do whatever you want, but you can't take this and re-paywall it.

## Supported platforms

Workday, Greenhouse, Lever, Ashby, SmartRecruiters, Oracle HCM, iCIMS, SuccessFactors, Eightfold, BambooHR, BreezyHR, Bullhorn, Jobvite, Loxo, Paylocity, Recruitee, Rippling, TeamTailor, UKG, Gem, Phenom.

## Install (developer mode)

1. Clone or download this repo.
2. Visit `chrome://extensions` and turn on Developer mode (top right).
3. Click "Load unpacked" and select the `Autograph/` folder.
4. Click the Autograph toolbar icon, fill out your master profile in the options page.
5. Visit any supported job posting. Autograph fills the form, highlights what it touched, and remembers anything custom you type for next time.

## How it works

- **Master profile**: name, contact, work auth, demographics. Stored in `chrome.storage.sync` so it follows your Chrome profile across devices.
- **Per-site memory**: custom questions you answer (e.g. "Why this company?") are captured to `chrome.storage.local` keyed by ATS, recalled on your next visit.
- **Adapter pattern**: each ATS has a small adapter that teaches Autograph how to read its fields and fire its events. Adding a new platform is ~100 lines.

## Contributing

See `docs/ADAPTERS.md` for the adapter authoring guide. New adapters welcome.

## License

GPL-3.0. See `LICENSE`.
