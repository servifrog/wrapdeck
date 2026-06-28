#!/bin/sh
set -eu

cd "$(dirname "$0")"

package_dir="${1:-public-build}"

if [ ! -d "$package_dir" ]; then
  echo "Release package check failed: package directory not found: $package_dir"
  echo "Run ./prepare-deploy.sh first, or pass an existing package directory."
  exit 1
fi

expected_files="
404.html
guide.html
_headers
app.js
index.html
privacy.css
privacy.html
security.html
robots.txt
sitemap.xml
styles.css
.well-known/security.txt
"

actual_files="$(find "$package_dir" -type f | sed "s|^$package_dir/||" | sort)"
expected_sorted="$(printf "%s" "$expected_files" | sed '/^$/d' | sort)"

if [ "$actual_files" != "$expected_sorted" ]; then
  echo "Release package check failed: public package file list is unexpected."
  echo "Expected:"
  printf "%s\n" "$expected_sorted"
  echo "Actual:"
  printf "%s\n" "$actual_files"
  exit 1
fi

if find "$package_dir" -maxdepth 2 \( \
  -name "*.md" -o \
  -name ".DS_Store" -o \
  -name ".env" -o \
  -name ".env.*" -o \
  -name ".playwright-cli" -o \
  -name "output" -o \
  -name "*.crt" -o \
  -name "*.key" -o \
  -name "*.log" -o \
  -name "*.pem" -o \
  -name "*.trace" -o \
  -name "*.zip" \
\) | grep -q .; then
  echo "Release package check failed: public package contains docs, artifacts, or secret-like files."
  exit 1
fi

if rg -n "Before public deployment|local prototype|no public privacy-contact|operator must add" privacy.html "$package_dir/privacy.html"; then
  echo "Release package check failed: privacy.html still contains launch placeholders."
  exit 1
fi

if [ -n "${WRAPDECK_PRIVATE_DENYLIST_REGEX:-}" ]; then
  if rg -n "$WRAPDECK_PRIVATE_DENYLIST_REGEX" . "$package_dir" -g "!release-check.sh" -g "!verify-release-package.sh"; then
    echo "Release package check failed: private denylist pattern found in project or package."
    exit 1
  fi
fi

echo "WrapDeck release package checks passed: $package_dir"
