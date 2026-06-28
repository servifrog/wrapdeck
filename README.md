# WrapDeck

WrapDeck is a static browser sidecar for assembling structured work notes from
reusable templates, current-note pieces, and quick forms. It is designed for
fast template recall and bounded plain-text output under time pressure.

WrapDeck is intentionally small:

- no backend
- no accounts or login
- no analytics
- no cookies
- no `localStorage`, `sessionStorage`, IndexedDB, Cache API, or service worker
- no remote fonts, scripts, images, CDNs, or runtime network calls
- no clipboard reads
- clipboard writes only after explicit user actions

Templates and notes live in the current browser tab's memory. Refreshing or
closing the tab clears the session.

## What It Does

- Full Templates: search and copy complete reusable note templates.
- Build As You Go: type, reorder, edit, and copy current-note pieces.
- Quick Forms: keep reusable form text separate from call-note output.
- Scratchpad: keep temporary text excluded from note output and setup strings.
- Setup strings: manually copy/paste reusable board state for the current tab.
- Fixed dock: preview, validate, edit, copy, save reusable patterns, and start a
  new call.

Example template text in public docs uses generic wording:

```text
CALL START// verified greeting// explained options// CALL END
Transfer example: CALL START// verified greeting// explained transfer// TRANSFER TO support
```

The app lets users change the start, ended, and transfer phrases for the current
browser session.

## Run Locally

No build step is required.

```bash
python3 -m http.server 8788
```

Then open:

```text
http://127.0.0.1:8788/
```

You can also use:

```bash
./preview.sh
```

## Checks

With npm installed:

```bash
npm install
npm run check
```

Static/runtime guard:

```bash
./security-check.sh
```

Release package check:

```bash
./release-check.sh
```

Regression smoke requires Playwright:

```bash
npm install playwright
npm run smoke
```

If Chrome is not in the default macOS path, set:

```bash
CHROME_EXECUTABLE_PATH=/path/to/chrome node scripts/wrapdeck_regression_smoke.js
```

## Deploy

WrapDeck can be deployed to any static HTTPS host that serves the included
`_headers` file or equivalent response headers. Cloudflare Pages and Netlify are
typical fits.

For a deployable static package:

```bash
./prepare-deploy.sh
```

This creates `public-build/`, which is generated output and is ignored by Git.

## Safety Notes

Use fake or non-sensitive examples unless your employer/security team approves
use in your workplace. Do not enter customer, account, protected, confidential,
regulated, or employer-sensitive information into WrapDeck.

WrapDeck is not a CRM, compliance system, official system of record, or
workplace-approved tool by default. Employer-managed browsers, extensions,
devices, networks, screenshots, destination systems, and policy may still apply
outside WrapDeck's control.

WrapDeck is independent and is not affiliated with any employer, call-center
vendor, card program, bank, government agency, or platform provider.

Forks may change the privacy model. Review any fork's code before use.

## License

Code is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

The WrapDeck name, logo, and product identity are not granted for misleading
redistribution or unrelated products. See [BRAND.md](BRAND.md).

Created by David Ruiz.
