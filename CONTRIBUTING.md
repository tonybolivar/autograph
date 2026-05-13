# Contributing to Autograph

Autograph is GPL-3.0 and made for everyone. Contributions welcome.

## What needs doing

### Easy

- Pick an ATS adapter that's still a thin stub (or feels weak on a posting you know) and harden it. See `docs/ADAPTERS.md` for the contract.
- Add more aliases to `src/lib/labelMatcher.js`. Real ATSes use surprisingly varied labels for the same field.
- Improve the welcome flow copy.

### Medium

- Build a Phenom adapter. Phenom doesn't have a fixed host pattern; we'd need a detection step that looks for telltale DOM signatures and activates dynamically.
- Add live Playwright runbooks for adapters that don't have them yet. Use `tests/adapters/lever.test.md` as the template.
- Replace the placeholder icons in `icons/` with a real design.

### Hard

- Custom domain support. Many companies wrap an ATS at `careers.example.com`. ApplyTalon detects this by inspecting the page; we deliberately deferred this to keep v0 simple, but it would expand coverage a lot.
- Resume / cover letter handling. File inputs are out of scope today.
- A real packaging story (Chrome Web Store listing). We aren't on the store yet; users load unpacked.

## Workflow

1. Fork the repo.
2. Make changes on a branch.
3. Reload the unpacked extension in `chrome://extensions` and exercise the changed flow against a real posting.
4. Open a PR with a short description of what you changed and which posting you tested against. URLs rot, so include the company name and ATS so a reviewer can find a current equivalent.

## Code style

- No build step. Plain JS, plain HTML, plain CSS. Don't add bundlers or frameworks; the extension should be hackable for anyone who can read the source.
- Single quotes or double quotes are fine; match what's already in the file.
- Don't add comments that just describe what the code does. Save them for surprising behavior or known gotchas.
- Don't add em dashes in any user-facing copy. Use commas, periods, or colons instead.

## License

By contributing you agree your changes are licensed under GPL-3.0.
