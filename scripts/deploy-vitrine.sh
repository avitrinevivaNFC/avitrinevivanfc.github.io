#!/usr/bin/env bash
# Build and publish dist/ to the main branch of avitrinevivaNFC/avitrinevivanfc.github.io
# (served at https://avitrinevivanfc.github.io/). Adds a normal commit on top of
# the existing history — no force push.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO_URL="${VITRINE_REPO_URL:-https://github.com/avitrinevivanfc/avitrinevivanfc.github.io}"
npm run build
touch dist/.nojekyll
SRC=$(git rev-parse --short HEAD)
WORK=$(mktemp -d)
git clone --depth 1 "$REPO_URL" "$WORK"
# Replace everything except the git metadata with the fresh build.
find "$WORK" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r dist/. "$WORK"/
cd "$WORK"
git add -A
if git diff --cached --quiet; then
  echo "Nothing changed — site already up to date."
else
  git commit -q -m "Deploy ${SRC}"
  git push origin HEAD:main
fi
rm -rf "$WORK"
