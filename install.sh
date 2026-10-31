#!/bin/sh
# Installs the applet for the current user by symlinking it into Cinnamon's applet folder.
set -e
UUID=kbd-backlight@thehilltanners
SRC="$(cd "$(dirname "$0")" && pwd)/$UUID"
DEST="$HOME/.local/share/cinnamon/applets/$UUID"
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
ln -s "$SRC" "$DEST"
echo "Installed. Right-click the panel -> Applets, and add \"Keyboard Backlight\"."
