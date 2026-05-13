# Master profile schema

The single source of truth for what Autograph knows about the user. Defined in `src/lib/masterProfile.js`. Stored in `chrome.storage.sync.masterProfile`.

## Sections

### About You

The basics every job application asks for.

| fieldId | Label | Type | Notes |
|---------|-------|------|-------|
| `first_name` | First Name | text | Captured-overridable: typing a new value into a labeled first-name field on any ATS updates the profile. |
| `last_name` | Last Name | text | Captured-overridable. |
| `email` | Email | email | Captured-overridable. |
| `phone_type` | Phone Type | text | "Mobile" / "Cell" / "Home". When unset, denormalizer falls back to a typical list of options for select widgets. |
| `phone_number` | Phone Number | tel | |
| `address_line_1` | Address Line 1 | text | |
| `city` | City | text | |
| `state_province` | State / Province | text | US state names denormalize to two-letter abbreviations and vice versa via `AG_US_STATES` in `normalizers.js`. |
| `zip_postal` | Zip / Postal | text | |
| `country` | Country | text | |
| `linkedin_profile` | LinkedIn Profile | url | Validates against `AG_LINKEDIN_RE`. Captured from any LinkedIn-looking URL field. |

### Employment Questions

Yes / No questions that come up constantly.

| fieldId | Label | Type | Notes |
|---------|-------|------|-------|
| `work_authorization` | Authorized to work? | select | Yes / No |
| `need_sponsorship` | Need sponsorship? | select | Yes / No |
| `willing_to_relocate` | Willing to relocate? | select | Yes / No |
| `bound_by_noncompete` | Bound by non-compete? | select | Denormalizer expands "Yes" / "No" into the full ATS option strings. |

### Demographic Questions

Optional. Defaults to "Prefer Not To Answer" everywhere if unset.

| fieldId | Label | Type | Notes |
|---------|-------|------|-------|
| `is_veteran` | Veteran status | select | Yes / No / Prefer Not To Answer. Denormalizer expands into ATS option strings like "I identify as one or more of the classifications of protected veterans". |
| `have_disability` | Disability status | select | Yes / No / Prefer Not To Answer. Denormalizer expands into ATS option strings like "Yes, I have a disability, or have had one in the past". |

Other demographic dimensions Autograph recognizes for *decline* purposes (no canonical fill yet, can be added later):
- gender / gender identity
- race / ethnicity / hispanic_ethnicity
- military spouse
- national guard

These tokens live in `AG_DEMOGRAPHIC_TOKENS` in `labelMatcher.js`. When the matcher tags a field as demographic, the fill loop selects a "decline" option by default.

## Storage shape

```json
{
  "masterProfile": {
    "first_name": "Alex",
    "last_name": "Rivera",
    "email": "alex@example.com",
    "phone_number": "555-123-4567",
    "address_line_1": "123 Main St",
    "city": "Portland",
    "state_province": "OR",
    "zip_postal": "97201",
    "country": "United States",
    "linkedin_profile": "https://linkedin.com/in/alexrivera",
    "work_authorization": "Yes",
    "need_sponsorship": "No",
    "willing_to_relocate": "Yes",
    "bound_by_noncompete": "No",
    "is_veteran": "No",
    "have_disability": "Prefer Not To Answer"
  }
}
```

## Adding a new field

1. Append an entry to `AG_PROFILE_FIELDS` in `src/lib/masterProfile.js`.
2. Add aliases to `AG_LABEL_ALIASES` in `src/lib/labelMatcher.js` so the matcher can find the field on real forms.
3. Add a denormalizer entry in `src/lib/normalizers.js` if the canonical value needs to expand into specific ATS option strings.
4. The options page renders fields automatically from the schema. The welcome wizard hardcodes its set; update `src/ui/welcome/welcome.html` if the new field is important enough to surface on first run.

## What's not stored

- Resumes / cover letters (file uploads are out of scope).
- Education history, work history, skills (would belong in a future "Resume" section if added).
- Credentials, passwords, payment info.
