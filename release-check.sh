#!/bin/sh
set -eu

cd "$(dirname "$0")"

./security-check.sh
./prepare-deploy.sh
./verify-release-package.sh public-build

echo "WrapDeck release checks passed."
