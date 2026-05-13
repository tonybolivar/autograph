# Test URLs for Autograph adapters

Live ATS posting URLs we use to validate each adapter. These rot fast (jobs close, companies leave the platform), so refresh this list whenever something 404s.

The pattern: pick a public posting on each ATS that has at least the basic name / email / phone / LinkedIn / a Yes-No question / a demographic dropdown so we exercise the full pipeline.

| Adapter | Platform | Sample posting URL | Notes |
|---------|----------|--------------------|-------|
| lever | jobs.lever.co | `https://jobs.lever.co/getmason/` (browse, pick any open posting and click Apply) | Standard inputs, single "Full name" field |
| ashby | jobs.ashbyhq.com | `https://jobs.ashbyhq.com/openai/` (browse) | Custom React dropdowns |
| greenhouse | boards.greenhouse.io | `https://boards.greenhouse.io/airbnb` (browse) | Multiple form variants; check both old and new |
| greenhouse | job-boards.greenhouse.io | `https://job-boards.greenhouse.io/` (newer hosting) | React-controlled; needs MAIN-world helper |
| smartrecruiters | smartrecruiters.com | `https://careers.smartrecruiters.com/` (browse) | Mixed native and custom widgets |
| bamboohr | bamboohr.com | `https://*.bamboohr.com/careers` (company-specific) | Modal application form |
| breezyhr | breezy.hr | `https://*.breezy.hr/p/<id>/apply` (company-specific) | Standard HTML, simple |
| recruitee | recruitee.com | `https://*.recruitee.com/o/<id>` (company-specific) | Standard HTML |
| teamtailor | teamtailor.com | `https://*.teamtailor.com/jobs/<id>` | Standard HTML |
| gem | jobs.gem.com | `https://jobs.gem.com/<company>/<id>` | Newer React app |
| phenom | (various) | Detect via page structure, no fixed host pattern | Skip until Phase 5 |
| jobvite | jobvite.com | `https://jobs.jobvite.com/<company>/job/<id>` | Phase 3 |
| loxo | loxo.co | `https://app.loxo.co/jobs/<id>` | Phase 3 |
| paylocity | paylocity.com | `https://recruiting.paylocity.com/recruiting/jobs/Details/<id>` | Phase 3, needs MAIN |
| rippling | rippling.com | `https://*.rippling-ats.com/jobs/<id>` | Phase 3 |
| bullhorn | bullhornstaffing.com | `https://*.bullhornstaffing.com/jobs/<id>` | Phase 3 |
| ukg | recruiting.ultipro.com | `https://recruiting.ultipro.com/<company>/JobBoard/<...>/OpportunityDetail` | Phase 3 |
| eightfold | eightfold.ai | `https://*.eightfold.ai/careers/job/<id>` | Phase 3 |
| icims | icims.com | `https://*.icims.com/jobs/<id>/apply` | Phase 4, all_frames |
| oracle | oraclecloud.com | `https://*.oraclecloud.com/hcmUI/CandidateExperience/<...>` | Phase 4 |
| successfactors | successfactors.com | `https://*.successfactors.com/career?...jobId=<id>` | Phase 4 |
| workday | myworkdayjobs.com | `https://*.wd5.myworkdayjobs.com/<...>/details/<...>` | Phase 5, the hard one |

## How to find a live posting

1. Pick a tech company that uses the ATS (e.g. Spotify or Brex for Lever, Anthropic for Greenhouse, OpenAI for Ashby).
2. Visit `<company>.<atsHost>` or their careers page; click any open role.
3. Click Apply. The /apply URL is your test URL.
4. Sanity-check that you can see name / email / phone fields before opening Autograph against it.

## Forms behind sign-in (manual testing only)

Some ATSes gate their application form behind an account or sign-in step, so the Playwright runbook pattern (open URL, snapshot, assert) only goes as far as the gating page. For these we need a real user with an account to actually load the extension in regular Chrome, sign in, and verify the fill:

- **Workday** (myworkdayjobs.com): every tenant requires account creation before the form is shown. The form structure across tenants is consistent (data-automation-id, work experience repeater, etc.) so the adapter is selectors-only; only live user testing can confirm.
- **iCIMS** (icims.com): the apply flow is iframed and usually requires account creation.
- **Oracle HCM** (oraclecloud.com): account creation required for most tenants.
- **SuccessFactors** (successfactors.com): account creation required.
- **Some Bullhorn / Jobvite tenants**: vary by deployment.
- **SmartRecruiters** (smartrecruiters.com): some tenants redirect the apply button to `smartr.me` (their separate apply hosting). Coverage on smartr.me requires extending manifest host_permissions and content_scripts. Inline-form tenants (where `/job/<id>` shows fields directly) are covered.

When testing one of these, document in `tests/adapters/<name>.test.md` what DID and DIDN'T fill correctly. The adapter source is the place to add tenant-specific tweaks.
