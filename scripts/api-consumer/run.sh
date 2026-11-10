#!/usr/bin/env bash
# Install sf-package-combiner into a fresh scratch project and check the programmatic
# API the way an external consumer would: types via `tsc`, runtime via node.
#
# Usage: scripts/api-consumer/run.sh <package-spec>
#   <package-spec> is anything `npm install` accepts, e.g.
#     ./sf-package-combiner-4.3.0.tgz        (pre-publish, from `npm pack`)
#     sf-package-combiner@4.3.0              (post-publish, from the registry)
set -euo pipefail

SPEC="${1:?usage: run.sh <package-spec>}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$REPO_ROOT/scripts/api-consumer"
SAMPLES="$REPO_ROOT/test/samples"

# Resolve a local tarball to an absolute path before leaving the repo.
if [[ -f "$SPEC" ]]; then
  SPEC="$(cd "$(dirname "$SPEC")" && pwd)/$(basename "$SPEC")"
fi

WORK="$(mktemp -d)"
trap 'rm -rf "${WORK:?}"' EXIT
echo "Consumer project: $WORK"
echo "Installing: $SPEC"

cd "$WORK"
echo '{ "name": "api-consumer", "private": true, "type": "module" }' >package.json
npm install --no-audit --no-fund --loglevel=error "$SPEC" typescript @types/node
cp "$HERE/check.mjs" "$HERE/types.ts" "$HERE/tsconfig.json" .
mkdir -p out

echo "Installed version: $(node -p "require('sf-package-combiner/package.json').version")"

echo "--- Type check"
npx --no-install tsc -p tsconfig.json
echo "ok - published types compile"

echo "--- Runtime check"
node check.mjs "$SAMPLES" "$WORK/out"
