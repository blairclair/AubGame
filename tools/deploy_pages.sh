#!/bin/sh
# Build the game and publish dist/site to the gh-pages branch (GitHub Pages serves it).
#   sh tools/deploy_pages.sh
set -e
cd "$(dirname "$0")/.."
python3 tools/build_dist.py
SRC=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
cp -R dist/site/. "$TMP"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name)" -c user.email="$(git -C "$OLDPWD" config user.email)" \
  commit -q -m "Site built from $SRC"
cd "$OLDPWD"
# one fresh commit each time, so old builds (7 MB each) don't pile up in the repo's history
T=$(gh auth token --user blairclair)
B=$(printf 'x-access-token:%s' "$T" | base64)
git -C "$TMP" -c http.https://github.com/.extraheader="Authorization: Basic $B" \
  push -q -f https://github.com/blairclair/AubGame.git gh-pages:gh-pages
rm -rf "$TMP"
echo "published: https://blairclair.github.io/AubGame/"
