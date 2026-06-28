# Privacy And Security Copy Boundaries

This file keeps WrapDeck's public wording aligned with what the app actually
does. It is not legal advice.

Official references checked while drafting:

- FTC privacy/security business guidance:
  https://www.ftc.gov/business-guidance/privacy-security
- California DOJ privacy-policy overview:
  https://oag.ca.gov/node/36676
- California DOJ CCPA overview:
  https://oag.ca.gov/privacy/ccpa

## Principle

Only promise what the current code, host configuration, and operating process can
actually honor. Privacy/security copy creates operational promises.

## Accurate Short Description

WrapDeck is a session-only static browser utility that helps assemble call-note
text from operator-provided templates intended for approved phrases before
pasting it into an official work system.

## Accurate Privacy Summary

WrapDeck processes templates, Quick Forms, Note Blocks, Scratchpad text, setup
strings, and notes only in the current browser tab. The app does not upload note
contents, store session data, use accounts, use analytics, read the clipboard,
or make runtime network requests after the static files load. The static host
may log ordinary page-request metadata, and managed devices, browsers, networks,
extensions, screenshots, or destination systems may still observe activity.

## Accurate Security Summary

WrapDeck is designed as a static first-party site with a restrictive Content
Security Policy, no backend, no accounts, no runtime network features, no
storage APIs, no third-party assets, no clipboard reads, and deployment headers
that reduce common browser exposure. Clipboard writes happen only after explicit
user actions. This architecture reduces exposure but does not replace any
required policy or review process.

## Safe Footer Notice

```text
Session-only workspace. WrapDeck does not save or upload what you type, and New Call clears the working note. Managed browsers, device monitoring, and applicable policies still apply.
```

## Safe Privacy Policy Phrases

- "Processes in the current browser tab's temporary memory."
- "Does not upload templates, note contents, Quick Forms, Note Blocks, Scratchpad text, setup strings, or dock edits."
- "Does not use accounts, analytics, cookies, localStorage, sessionStorage, IndexedDB, or service workers."
- "Does not read the clipboard."
- "Writes to the clipboard only after explicit user actions. Each copy action has a bounded target, such as the current call note, an active Quick Form, a setup string, Full Templates, or Note Blocks."
- "Setup strings (WDSTRING_V1) export reusable workbench state as plain text after an explicit user action. They do not save to the browser, disk, backend, or network."
- "WDSTRING_V1 setup strings must not include current-call note content, scratchpad text, transfer destinations, or active Quick Form content."
- "The static host may receive ordinary request metadata."
- "Managed devices and systems may still observe activity."
- "Do not enter customer, account, or protected information into WrapDeck."
- "Keep protected information in approved systems and approved workflows."
- "Because the app does not use tracking, targeted advertising, analytics, cookies, or sale/sharing, browser privacy signals do not change app behavior."
- "WrapDeck is a temporary sidecar for assembling plain-text notes. It is not a system of record and does not store, upload, sync, or remember typed content."

## Phrases To Avoid

- "No data is collected."
  - Better: "The app does not collect note contents; the static host may log request metadata."
- "Completely private."
  - Better: "Session-only and browser-local by design, subject to host logs and employer/device monitoring."
- "Secure."
  - Better: "Designed with a restrictive static-site security model."
- "Compliant."
  - Better: "Do not enter customer, account, or protected information into WrapDeck."
- "Anonymous."
  - Better: "No accounts are used; the static host may still receive IP/request metadata."
- "Cannot be monitored."
  - Better: "Cannot prevent managed browser/device/network monitoring."
- "Approved for [data type]."
  - Only say this if the relevant authority has approved it in writing.
- "Approved templates."
  - Better: "operator-provided templates intended for approved phrases."
- "Secure for protected information."
  - Better: "Do not enter protected information into WrapDeck; keep it in approved systems and workflows."

## Public Contacts

The public privacy policy uses these details:

```text
Privacy/security contact: privacy [at] wrapdeck.app
Feedback contact: feedback [at] wrapdeck.app
Hosting provider: Cloudflare Pages
Host log note: Cloudflare may process ordinary request metadata under its own privacy and retention practices.
```

Do not publish home address, personal phone number, private registration details,
or a contact address that is not monitored. In runtime HTML, write email
addresses as `privacy [at] wrapdeck.app` and `feedback [at] wrapdeck.app` rather
than literal mail links so the static host does not inject email-obfuscation
scripts.

## Do Not Add Without Rewriting Privacy/Security Docs

- Analytics
- Error reporting
- Contact forms
- Feedback forms
- Remote fonts
- Remote images
- CDN scripts
- Accounts
- Login
- Cloud sync
- Saved templates
- Service worker
- Clipboard reading
- Browser extension behavior
- CRM automation
- AI rewriting

## Browser Privacy Signals

If the app stays as currently designed, it is accurate to say it does not use
cross-site tracking, targeted advertising, analytics, cookies, or sale/sharing of
personal information. Do not add a Global Privacy Control, Do Not Track, opt-out,
or data-request workflow unless the app or operator actually collects data that
requires one and the workflow can be honored.
