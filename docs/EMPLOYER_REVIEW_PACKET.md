# Employer Review Packet

Use this only when ready to ask for security/compliance review. It is deliberately
plain and narrow.

## One-Sentence Description

WrapDeck is a session-only static browser utility that helps assemble call-note
text from operator-provided templates intended for approved phrases before
pasting the result into the official work system.

## What It Does

- Loads operator-provided templates pasted by the user.
- Offers Full Templates as complete note templates with `Copy as is` and `Edit
  in dock` actions.
- Lets the user type, order, remove, and edit current-call note pieces in Build
  As You Go.
- Keeps reusable phrase buttons, historically called Note Blocks, as an
  optional fallback for manual assembly.
- Supports separate Quick Forms that copy outside the primary call-note
  pipeline.
- Provides a temporary Scratchpad that can be snapped into Build As You Go
  without being copied or restored by setup strings.
- Supports saved non-call reference text as reusable workbench state.
- Assembles one plain-text note that starts with the configured session start
  phrase. The default is `CALL START//`.
- Requires a valid configured ending. The defaults are `// CALL END` and
  `// TRANSFER TO <destination>`.
- Writes plain text to the clipboard only after explicit user actions. Bounded
  targets include:
  - `Copy Valid Note`, which copies only the current call note.
  - `Copy Quick Form`, which copies only the active Quick Form.
  - `Copy setup string`, which copies reusable workbench state as
    `WDSTRING_V1` plain text.
  - `Copy full templates`, which copies loaded Full Template source text.
  - `Copy Note Blocks`, which copies reusable phrase buttons as setup text.
  - `Copy`, inside saved non-call reference, which copies that reference text.
  - `Copy as is`, which copies a valid parsed Full Template.
- Never reads from the system clipboard.
- Clears the current note and active Quick Form content between calls while
  keeping reusable workbench templates for the current tab session.
- Destroys session data on refresh or tab close.

## What It Does Not Do

- No backend.
- No database.
- No accounts.
- No analytics.
- No cookies.
- No localStorage, sessionStorage, or IndexedDB.
- No service worker.
- No remote fonts, images, or third-party scripts.
- No clipboard reading.
- No AI.
- No transcription.
- No CRM/API integration.
- No browser automation.
- No saved templates or note history.
- No employer network integration.
- No system-of-record behavior.

## Privacy/Security Model

The app processes note text in browser memory only. Setup strings
(`WDSTRING_V1`) export reusable workbench state as plain text after an explicit
user action, including saved non-call reference text when present. They do not
save to the browser, disk, backend, or network and must not include current-call
note content, scratchpad text, transfer destinations, or active Quick Form
content.

App code does not send note contents to a server or third party. The static host
may log ordinary page-request metadata, and employer-managed browsers,
extensions, devices, networks, screenshot tools, or destination systems may
still observe activity.

## Files For Review

- `index.html`
- `app.js`
- `styles.css`
- `privacy.html`
- `privacy.css`
- `_headers`
- `robots.txt`
- `SECURITY.md`
- `README.md`
- `docs/LAUNCH_CHECKLIST.md`
- `docs/DEPLOYMENT.md`
- `docs/PRIVACY_AND_SECURITY_COPY.md`

## Validation Available

Run:

```bash
./security-check.sh
```

The check looks for parsing errors, inline executable content, forbidden browser
APIs, remote runtime assets, unsafe CSP sources, missing security headers, and
local artifacts or secret-like files in the deploy directory.

## Review Questions To Ask

- Is external browser-local drafting allowed for this workflow?
- Are these note-format rules complete and correct?
- Is public static hosting acceptable, or must access be restricted?
- Is the selected static host acceptable?
- Are host request logs acceptable under the workflow?
- Should the site be employer-hosted or internally distributed instead?
- Is clipboard clearing allowed/desired?
- Is the privacy policy wording acceptable?
- Are any additional disclaimers required?

## Approval Boundary

Approval should be for the exact reviewed version, host/access model, and workflow.
Any later addition of storage, analytics, AI, backend code, remote assets, accounts,
clipboard reads, CRM automation, or saved history should trigger a fresh review.
Do not describe WrapDeck as employer-approved, compliant, certified, secure for
protected information, or suitable for protected data unless a formal review has
approved those exact claims in writing.
