#!/bin/sh
# Rebuilds the home-screen icons in images/app/ from tools/app-icon.svg.
# macOS only (uses Quick Look to rasterize the SVG and sips to resize).
set -e
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"
qlmanage -t -s 1024 -o "$tmp" tools/app-icon.svg >/dev/null
src="$tmp/app-icon.svg.png"
mkdir -p images/app
for size in 512 192; do
  sips -s format png -z $size $size "$src" --out "images/app/icon-$size.png" >/dev/null
done
sips -s format png -z 180 180 "$src" --out images/app/apple-touch-icon.png >/dev/null
rm -rf "$tmp"
ls -l images/app
