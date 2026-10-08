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

# Fixed-string match: pgrep would read the parentheses in the name as regex.
if ps -axo command= | grep -qF "$app_name/Contents/MacOS/"; then
  echo "Quit Lumin Hub first, then run this again." >&2
  exit 1
fi

cd "$repo_root"
git switch main
git pull --ff-only
vp i
vp run dist:desktop:dmg:arm64

dmg="$(ls -t release/*-arm64.dmg | head -n 1)"
mount_dir="$(mktemp -d)"
hdiutil attach -nobrowse -quiet -mountpoint "$mount_dir" "$dmg"
trap 'hdiutil detach -quiet "$mount_dir" 2>/dev/null || true; rmdir "$mount_dir" 2>/dev/null || true' EXIT

mkdir -p "$apps_dir"
ditto "$mount_dir/$app_name" "$apps_dir/$app_name.new"
if [ -d "$apps_dir/$app_name" ]; then
  mv "$apps_dir/$app_name" "$HOME/.Trash/Lumin Hub (Alpha) $(date +%Y%m%d-%H%M%S).app"
fi
mv "$apps_dir/$app_name.new" "$apps_dir/$app_name"

echo "Installed $(basename "$dmg") to $apps_dir/$app_name"
