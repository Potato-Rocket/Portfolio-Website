#!/usr/bin/env bash
set -euo pipefail

THUMBNAILS="$(dirname "$0")/../public/thumbnails"

find "$THUMBNAILS" -iname "*.heic" | while read -r src; do
  dst="${src%.*}.png"
  echo "Converting $src -> $dst"
  convert "$src" -resize 1200x1200\> -quality 90 "$dst"
done