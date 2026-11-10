#!/usr/bin/env bash
# Install sf-package-combiner (the CLI plugin package) or sf-package-combiner-core (the
# dependency-free API package) into a fresh scratch project and check the programmatic API
# the way an external consumer would: types via `tsc`, runtime via node.
#
# Usage: scripts/api-consumer/run.sh <package-spec>
#   <package-spec> is a local tarball or a registry spec, e.g.
#     ./sf-package-combiner-4.3.0.tgz          (pre-publish, from `npm pack`)
#     sf-package-combiner@4.3.0                (post-publish, from the registry)
#     sf-package-combiner-core@4.3.0
#
# Either package is installed under the name "sf-package-combiner" (an npm alias), so
# check.mjs and types.ts import the same name for both.
set -euo pipefail

SPEC="${1:?usage: run.sh <package-spec>}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$REPO_ROOT/scripts/api-consumer"
SAMPLES="$REPO_ROOT/test/samples"
ALIAS="sf-package-combiner"

if [[ -f "$SPEC" ]]; then
  # Resolve a local tarball to an absolute path before leaving the repo. On Windows (Git Bash),
  # `pwd -W` gives a native path; Git Bash doesn't translate a POSIX path inside "name@file:...".
  TARBALL_DIR="$(cd "$(dirname "$SPEC")" && (pwd -W 2>/dev/null || pwd))"
  SPEC="$ALIAS@file:$TARBALL_DIR/$(basename "$SPEC")"
elif [[ "${SPEC%@*}" != "$ALIAS" ]]; then
  SPEC="$ALIAS@npm:$SPEC"
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

INSTALLED_NAME="$(node -p "require('$ALIAS/package.json').name")"
echo "Installed: $INSTALLED_NAME@$(node -p "require('$ALIAS/package.json').version")"

if [[ "$INSTALLED_NAME" == "$ALIAS-core" ]]; then
  echo "--- Dependency check"
  DEPENDENCIES="$(node -p "Object.keys(require('$ALIAS/package.json').dependencies ?? {}).join(', ')")"
  if [[ -n "$DEPENDENCIES" ]]; then
    echo "$INSTALLED_NAME must have no runtime dependencies, found: $DEPENDENCIES"
    exit 1
  fi
  echo "ok - no runtime dependencies"
fi

echo "--- Type check"
npx --no-install tsc -p tsconfig.json
echo "ok - published types compile"

echo "--- Runtime check"
node check.mjs "$SAMPLES" "$WORK/out"
