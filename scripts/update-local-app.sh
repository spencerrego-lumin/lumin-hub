#!/bin/sh
# Rebuilds Lumin Hub from the latest main and installs it into ~/Applications,
# which needs no admin rights. macOS on Apple Silicon only.
#
#   vp run update:local
#
# The previous app goes to the Trash so it can be restored.
set -eu

app_name="Lumin Hub (Alpha).app"
apps_dir="$HOME/Applications"
repo_root="$(cd "$(dirname "$0")/.." && pwd)"

# pgrep never matches itself (a `ps | grep` would). The pattern is a regex,
# so the parentheses and dot in the app name are escaped.
if pgrep -f 'Lumin Hub \(Alpha\)\.app/Contents/MacOS/' >/dev/null; then
  echo "Quit Lumin Hub first, then run this again." >&2
  exit 1
fi

ca_file=""
mount_dir=""
cleanup() {
  if [ -n "$mount_dir" ]; then
    hdiutil detach -quiet "$mount_dir" 2>/dev/null || true
    rmdir "$mount_dir" 2>/dev/null || true
  fi
  if [ -n "$ca_file" ]; then rm -f "$ca_file"; fi
}
trap cleanup EXIT

# Corporate TLS inspection (Zscaler) re-signs HTTPS with a root CA that macOS
# trusts but Node does not, which breaks downloads during packaging. Give Node
# the system's trusted certificates as well.
if [ -z "${NODE_EXTRA_CA_CERTS:-}" ]; then
  ca_file="$(mktemp)"
  security find-certificate -a -p /Library/Keychains/System.keychain \
    /System/Library/Keychains/SystemRootCertificates.keychain >"$ca_file"
  export NODE_EXTRA_CA_CERTS="$ca_file"
fi

cd "$repo_root"
git switch main
git pull --ff-only
vp i
vp run dist:desktop:dmg:arm64

dmg="$(ls -t release/*-arm64.dmg | head -n 1)"
mount_dir="$(mktemp -d)"
hdiutil attach -nobrowse -quiet -mountpoint "$mount_dir" "$dmg"

mkdir -p "$apps_dir"
ditto "$mount_dir/$app_name" "$apps_dir/$app_name.new"
if [ -d "$apps_dir/$app_name" ]; then
  mv "$apps_dir/$app_name" "$HOME/.Trash/Lumin Hub (Alpha) $(date +%Y%m%d-%H%M%S).app"
fi
mv "$apps_dir/$app_name.new" "$apps_dir/$app_name"

echo "Installed $(basename "$dmg") to $apps_dir/$app_name"
