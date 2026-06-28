# Launch Checklist

Use this before publishing or deploying a WrapDeck fork.

## Source

- Runtime files contain no real customer, account, protected, employer-private,
  or regulated information.
- Examples are fake and generic.
- No `.env`, key, cert, token, log, trace, HAR, cache, or local machine residue
  is present.
- No private handoff logs, owner operations reports, or generated deploy output
  are present.

## Privacy

- No backend.
- No accounts.
- No analytics.
- No cookies.
- No Web Storage, IndexedDB, Cache API, or service worker.
- No runtime network calls.
- No remote fonts, scripts, images, CDNs, or APIs.
- No clipboard reads.
- Clipboard writes happen only after explicit user actions.

## Copy

- Do not describe WrapDeck as approved, compliant, certified, enterprise-ready,
  secure for protected information, or suitable for protected data.
- Disclose that static hosts may log ordinary page-request metadata.
- Disclose that employer-managed browsers, devices, networks, screenshots, and
  policies remain outside WrapDeck's control.
- State that forks may change the privacy model.

## Deploy

- Run `./security-check.sh`.
- Run `./release-check.sh`.
- Deploy only the generated `public-build/` package.
- Verify deployed headers with `./verify-deploy.sh <url>`.

