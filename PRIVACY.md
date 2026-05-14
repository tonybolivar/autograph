# Privacy Policy

Autograph does not collect, transmit, sell, or share any user data.

## What the extension stores

When you fill out the master profile (name, contact details, work authorization, demographics, etc.) and when Autograph captures custom answers you type into application forms, that information is written to Chrome's built-in storage on your own device:

- `chrome.storage.sync` for the master profile, so the same profile is available on any computer where you are signed into the same Chrome profile. Syncing is handled by Google's Chrome Sync, not by Autograph.
- `chrome.storage.local` for per-site custom answers and adapter state. This data never leaves your device.

## What the extension does not do

- No analytics, telemetry, or usage tracking of any kind.
- No remote servers, no API calls, no third-party services.
- Application form values are read from and written to the page you are currently on. They are not transmitted anywhere by Autograph.
- The author has no way to see, retrieve, or recover anything you store in Autograph.

## Permissions

- `storage`: required to save your master profile and per-site answers on your device.
- `tabs`: required to detect which applicant tracking system you are currently viewing so the right adapter runs.
- `scripting` and `sidePanel`: required to inject the autofill helper and show the side panel UI.
- Host permissions for specific ATS domains: required so the content script can run on those job application pages. The `<all_urls>` optional permission is only requested if you choose to add a custom company career domain that wraps one of the supported ATSes.

## Removing your data

Uninstalling the extension via `chrome://extensions` deletes all locally stored Autograph data. You can also clear individual fields from the options page.

## Contact

Issues and questions: open a ticket at https://github.com/tonybolivar/autograph/issues.

## Changes

If this policy ever changes, the new version will be committed to the repository alongside a release note.
