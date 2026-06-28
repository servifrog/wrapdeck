#!/bin/sh
set -eu

cd "$(dirname "$0")"

node --check app.js

html_files="$(find . -maxdepth 1 -name "*.html" -type f | sort)"
css_files="$(find . -maxdepth 1 -name "*.css" -type f | sort)"

if find . -maxdepth 2 \( \
  -name ".DS_Store" -o \
  -name ".env" -o \
  -name ".env.*" -o \
  -name ".playwright-cli" -o \
  -name ".wrangler" -o \
  -name "output" -o \
  -name "*.crt" -o \
  -name "*.key" -o \
  -name "*.log" -o \
  -name "*.pem" -o \
  -name "*.trace" -o \
  -name "*.zip" \
\) | grep -q .; then
  echo "Security check failed: local artifacts or secret-like files found in deploy directory."
  exit 1
fi

if rg -n '<script(?! src=)|<style>|\son[a-z]+=' $html_files --pcre2; then
  echo "Security check failed: inline executable content found."
  exit 1
fi

if rg -n 'fetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|serviceWorker|clipboard\.read|innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function|postMessage|BroadcastChannel|SharedWorker|Worker\(' app.js; then
  echo "Security check failed: forbidden network, storage, or clipboard-read API found."
  exit 1
fi

if rg -n 'https?://|//[a-z0-9.-]+\.[a-z]{2,}' $html_files $css_files --ignore-case \
  | rg -v 'https://wrapdeck\.app(/|")'; then
  echo "Security check failed: unexpected remote asset or URL found in runtime files."
  exit 1
fi

if rg -n "unsafe-inline|unsafe-eval|data:|blob:" $html_files _headers; then
  echo "Security check failed: CSP contains an unsafe source."
  exit 1
fi

for required in \
  "default-src 'none'" \
  "script-src 'self'" \
  "style-src 'self'" \
  "connect-src 'none'" \
  "frame-ancestors 'none'" \
  "Cache-Control: no-store" \
  "no-transform" \
  "Cross-Origin-Embedder-Policy: require-corp" \
  "X-Content-Type-Options: nosniff" \
  "X-Frame-Options: DENY" \
  "Referrer-Policy: no-referrer" \
  "Permissions-Policy:" \
  "X-Robots-Tag: noindex"; do
  if ! grep -Fq "$required" _headers; then
    echo "Security check failed: missing header: $required"
    exit 1
  fi
done

if [ ! -f ".well-known/security.txt" ]; then
  echo "Security check failed: missing .well-known/security.txt"
  exit 1
fi

for required_security_txt in \
  "Contact: https://wrapdeck.app/security.html" \
  "Policy: https://wrapdeck.app/security.html" \
  "Canonical: https://wrapdeck.app/.well-known/security.txt"; do
  if ! grep -Fq "$required_security_txt" .well-known/security.txt; then
    echo "Security check failed: missing security.txt field: $required_security_txt"
    exit 1
  fi
done

echo "WrapDeck security checks passed."
