#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: ./verify-deploy.sh https://example.com"
  exit 2
fi

base_url="${1%/}"

case "$base_url" in
  https://*) ;;
  *)
    echo "Deployment check failed: URL must start with https://"
    exit 1
    ;;
esac

check_headers() {
  path="$1"
  url="$base_url$path"
  tmp="$(mktemp)"

  if ! curl -fsSIL "$url" > "$tmp"; then
    rm -f "$tmp"
    echo "Deployment check failed: could not fetch headers for $url"
    exit 1
  fi

  for required in \
    "cache-control: no-store" \
    "no-transform" \
    "content-security-policy:" \
    "default-src 'none'" \
    "script-src 'self'" \
    "style-src 'self'" \
    "connect-src 'none'" \
    "frame-ancestors 'none'" \
    "cross-origin-embedder-policy: require-corp" \
    "cross-origin-opener-policy: same-origin" \
    "cross-origin-resource-policy: same-origin" \
    "permissions-policy:" \
    "referrer-policy: no-referrer" \
    "x-content-type-options: nosniff" \
    "x-frame-options: DENY" \
    "x-robots-tag: noindex"; do
    if ! grep -Fqi "$required" "$tmp"; then
      echo "Deployment check failed: missing '$required' on $url"
      echo "Observed headers:"
      sed 's/\r$//' "$tmp"
      rm -f "$tmp"
      exit 1
    fi
  done

  if grep -Eiq "unsafe-inline|unsafe-eval|data:|blob:" "$tmp"; then
    echo "Deployment check failed: unsafe CSP source found on $url"
    sed 's/\r$//' "$tmp"
    rm -f "$tmp"
    exit 1
  fi

  rm -f "$tmp"
  echo "Headers OK: $url"
}

check_headers "/"
check_headers "/index.html"
check_headers "/app.js"
check_headers "/styles.css"
check_headers "/guide.html"
check_headers "/privacy.html"
check_headers "/privacy.css"
check_headers "/security.html"
check_headers "/404.html"
check_headers "/robots.txt"
check_headers "/sitemap.xml"
check_headers "/.well-known/security.txt"

echo "WrapDeck deployed header checks passed."
