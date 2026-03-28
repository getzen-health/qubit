#!/bin/bash
# Usage: ./scripts/generate-icons.sh path/to/icon-1024.png
# Generates all required iOS app icon sizes

MASTER="${1:-ios/KQuarks/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png}"
OUT_DIR="ios/KQuarks/Assets.xcassets/AppIcon.appiconset"

sizes=(20 29 40 58 60 76 80 87 120 152 167 180 1024)
for size in "${sizes[@]}"; do
  sips -z $size $size "$MASTER" --out "$OUT_DIR/AppIcon-${size}.png" 2>/dev/null
  echo "Generated ${size}x${size}"
done
echo "Done. Update Contents.json to reference these files."
