#!/bin/sh
set -eu

cd "$(dirname "$0")"

./security-check.sh

out_dir="${1:-public-build}"
rm -rf "$out_dir"
mkdir -p "$out_dir"
mkdir -p "$out_dir/.well-known"

for file in \
  404.html \
  guide.html \
  _headers \
  app.js \
  index.html \
  privacy.css \
  privacy.html \
  security.html \
  robots.txt \
  sitemap.xml \
  styles.css; do
  cp "$file" "$out_dir/$file"
done

cp ".well-known/security.txt" "$out_dir/.well-known/security.txt"

echo "WrapDeck public deploy package ready: $out_dir"
