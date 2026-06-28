# Deployment

WrapDeck is static HTML, CSS, and JavaScript. It does not require a build step,
server, database, environment variables, or API credentials.

## Local Preview

```bash
python3 -m http.server 8788
```

Open:

```text
http://127.0.0.1:8788/
```

## Preflight

Run:

```bash
./security-check.sh
./release-check.sh
```

Optional browser smoke:

```bash
npm install playwright
node scripts/wrapdeck_regression_smoke.js
```

## Static Package

Create the deployable package:

```bash
./prepare-deploy.sh
```

This creates `public-build/`.

The generated package should contain only runtime files:

- `index.html`
- `app.js`
- `styles.css`
- `privacy.html`
- `privacy.css`
- `security.html`
- `guide.html`
- `404.html`
- `_headers`
- `robots.txt`
- `sitemap.xml`
- `.well-known/security.txt`

## Host Requirements

Use a static HTTPS host that can serve equivalent headers to `_headers`.

Required posture:

- `Cache-Control: no-store, no-transform`
- strict CSP with `connect-src 'none'`
- no host-injected analytics, scripts, banners, or cookies
- no runtime backend or API routes
- no service worker

`robots.txt` and `noindex` reduce accidental discovery. They are not access
control.

## After Deploy

Verify headers against the deployed URL:

```bash
./verify-deploy.sh https://example.com
```

Do not claim workplace approval, compliance, protected-data suitability, or
enterprise readiness unless those claims are formally true for your deployment.

