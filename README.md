# Autograph

I wrote this extension because I saw a similar extension being advertised to me on Reddit, and I am NOT paying for a glorified autocomplete. Has support for the following ATSes:

Workday, Greenhouse, Lever, Ashby, SmartRecruiters, Oracle HCM, iCIMS, SuccessFactors, Eightfold, BambooHR, BreezyHR, Bullhorn, Jobvite, Loxo, Paylocity, Recruitee, Rippling, TeamTailor, UKG, Gem, Phenom.

It's GPL-3.0, which means anyone is free to fork it but nobody can take it closed-source and put it behind a subscription.

## Install (developer mode)

1. Clone or download this repo.
2. Visit `chrome://extensions` and turn on Developer mode.
3. Click "Load unpacked" and select the `Autograph/` folder.
4. Click the toolbar icon and fill out your master profile.
5. Visit any supported job posting. Autograph fills the form, highlights what it touched, and remembers custom answers for next time.

## How it works

- **Master profile**: name, contact, work auth, demographics. Stored in `chrome.storage.sync` so it follows your Chrome profile across devices.
- **Per-site memory**: custom questions (e.g. "Why this company?") are saved to `chrome.storage.local` keyed by ATS and recalled on your next visit.
- **Adapter pattern**: each ATS has a small adapter that teaches Autograph how to read its fields and fire its events. Adding a new platform is around 100 lines. See `docs/ADAPTERS.md`.

## Contributing

See `CONTRIBUTING.md` and `docs/ADAPTERS.md`. New adapters welcome.

## License

GPL-3.0. See `LICENSE`.
