#!/usr/bin/env bash
set -euo pipefail

# Pinned vendor assets for BeeLab.
BOOTSTRAP_VERSION=5.3.0
BOOTSTRAP_ICONS_VERSION=1.11.3
CHARTJS_VERSION=4.4.1

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$ROOT_DIR/static/vendor"

mkdir -p \
  "$VENDOR_DIR/bootstrap/$BOOTSTRAP_VERSION/css" \
  "$VENDOR_DIR/bootstrap/$BOOTSTRAP_VERSION/js" \
  "$VENDOR_DIR/bootstrap-icons/$BOOTSTRAP_ICONS_VERSION/css" \
  "$VENDOR_DIR/bootstrap-icons/$BOOTSTRAP_ICONS_VERSION/fonts" \
  "$VENDOR_DIR/chart.js/$CHARTJS_VERSION"

BASE=https://cdn.jsdelivr.net/npm
curl -fsSL -o "$VENDOR_DIR/bootstrap/$BOOTSTRAP_VERSION/css/bootstrap.min.css" \
  "$BASE/bootstrap@$BOOTSTRAP_VERSION/dist/css/bootstrap.min.css"
curl -fsSL -o "$VENDOR_DIR/bootstrap/$BOOTSTRAP_VERSION/js/bootstrap.bundle.min.js" \
  "$BASE/bootstrap@$BOOTSTRAP_VERSION/dist/js/bootstrap.bundle.min.js"

curl -fsSL -o "$VENDOR_DIR/bootstrap-icons/$BOOTSTRAP_ICONS_VERSION/css/bootstrap-icons.min.css" \
  "$BASE/bootstrap-icons@$BOOTSTRAP_ICONS_VERSION/font/bootstrap-icons.min.css"
curl -fsSL -o "$VENDOR_DIR/bootstrap-icons/$BOOTSTRAP_ICONS_VERSION/fonts/bootstrap-icons.woff2" \
  "$BASE/bootstrap-icons@$BOOTSTRAP_ICONS_VERSION/font/fonts/bootstrap-icons.woff2"
curl -fsSL -o "$VENDOR_DIR/bootstrap-icons/$BOOTSTRAP_ICONS_VERSION/fonts/bootstrap-icons.woff" \
  "$BASE/bootstrap-icons@$BOOTSTRAP_ICONS_VERSION/font/fonts/bootstrap-icons.woff"

curl -fsSL -o "$VENDOR_DIR/chart.js/$CHARTJS_VERSION/chart.umd.min.js" \
  "$BASE/chart.js@$CHARTJS_VERSION/dist/chart.umd.min.js"

echo "Vendor assets fetched."
