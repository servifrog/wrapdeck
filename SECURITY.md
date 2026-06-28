# WrapDeck Security

## Security Model

WrapDeck is a static, session-only browser tool. It has no backend, accounts,
analytics, AI calls, storage layer, service worker, Cache API usage, or runtime
network features. Templates, Quick Forms, Note Blocks, Scratchpad text, and call
notes exist only in the current tab's memory. The app writes to the clipboard
only after explicit user actions and never reads clipboard contents.

Setup strings (`WDSTRING_V1`) export reusable workbench state as plain text
after an explicit user action, including saved non-call reference text and any
Full Template the user explicitly saved from Build As You Go. They do not save
to the browser, disk, backend, or network. `WDSTRING_V1` setup strings must not
automatically include current-call note content, scratchpad text, transfer
destinations, or active Quick Form content.

This design reduces exposure, but it does not make WrapDeck suitable for
protected information. Do not enter real customer, account, government-benefit,
Social Security, financial, or other protected data into WrapDeck. Keep that
information in approved systems and approved workflows.

## Built-In Controls

- Strict Content Security Policy with no inline script or style execution
- Runtime connections, frames, forms, objects, media, images, fonts, manifests,
  and workers blocked by CSP
- Clickjacking protection through `frame-ancestors 'none'` and `X-Frame-Options`
- No-referrer, no-index, no-store, MIME-sniffing, cross-origin, and feature-policy
  response headers in `_headers`
- No cookies, storage APIs, service worker, analytics, third-party assets, or
  clipboard reads
- Bounded clipboard-write paths only: current call note, active Quick Form,
  setup string, Full Templates, Note Blocks, saved non-call reference text, and
  valid Full Template `Copy as is`
- Dock `Save Full Template` is an explicit in-session conversion to a
  reusable Full Template, not automatic note history
- Inline current-piece editing mutates only the current generated note pieces;
  it does not mutate templates, Quick Forms, reusable phrases, or setup strings
  unless the user later explicitly saves the whole built note as a Full Template
- User-controlled text is inserted with `textContent` or form values, not HTML
- Input and rendered-button limits reduce accidental browser lockups
- Destructive session clearing requires a second click
- Navigation warning when the current tab contains session data
- The pre-deployment check fails if local QA artifacts, logs, traces, `.env`
  files, or key/certificate-like files are present in the static deploy folder

## Deployment Requirements

1. Complete `docs/LAUNCH_CHECKLIST.md`.
2. Deploy only to a static HTTPS host that applies the included `_headers` file.
3. Verify the deployed response headers with browser developer tools or a trusted
   HTTP-header scanner. A local Python preview server does not apply `_headers`.
4. Do not add analytics, error reporting, remote fonts, CDNs, third-party scripts,
   forms, APIs, or storage without updating the security model and privacy policy.
5. Restrict access through an employer-approved method if the site is not meant
   for the public. `robots.txt` and `noindex` discourage indexing; they are not
   access control.
6. Confirm any public contact address is intentional and monitored. Confirm the
   static host logging wording still matches the selected host.
7. Run `./security-check.sh` before every deployment.

## Known Boundaries

- The static host can log normal page-request metadata.
- Employer-managed browsers, extensions, devices, networks, screenshots, and
  destination systems may observe entered or copied data.
- Clipboard writes can be blocked by browser policy.
- Browser memory can be inspected by software with access to the device.
- The app cannot enforce employer policy or replace a formal security review.
- The app must not be described as employer-approved, compliant, certified,
  secure for protected information, or suitable for protected data.

## Reporting

For privacy or security questions, email `privacy [at] wrapdeck.app`.
The public security contact file is available at
`https://wrapdeck.app/.well-known/security.txt` and points reviewers to the
plain-English security summary.
