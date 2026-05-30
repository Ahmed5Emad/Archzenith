#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "============================================="
echo "       ALSA Hardware Microphone Fix"
echo "============================================="

# 1. Ensure alsa-utils is installed (needed for amixer)
if [ -f /etc/arch-release ]; then
    if ! command -v amixer &> /dev/null; then
        echo "Installing alsa-utils..."
        sudo pacman -S --needed --noconfirm alsa-utils
    fi
fi

# 2. Find the active physical analog sound card
echo "Detecting physical sound card..."
CARD_ID=$(aplay -l 2>/dev/null | grep -i "analog" | head -n 1 | cut -d' ' -f2 | tr -d ':')

if [ -z "$CARD_ID" ]; then
    CARD_ID=$(amixer cards 2>/dev/null | grep -vi "loopback" | grep -vi "hdmi" | head -n 1 | awk '{print $1}')
fi

if [ -z "$CARD_ID" ]; then
    CARD_ID="0"
fi

echo "Using ALSA Sound Card ID: $CARD_ID"

# 3. Reset Boost to 0dB and Capture volume to 50% to prevent static/clipping
echo "Applying mixer thresholds..."
amixer -c "$CARD_ID" sset 'Mic Boost' 0 2>/dev/null || amixer sset 'Mic Boost' 0 2>/dev/null || true
amixer -c "$CARD_ID" sset 'Capture' 50% 2>/dev/null || amixer sset 'Capture' 50% 2>/dev/null || true

# 4. Make it persistent at the system level
echo "Saving hardware states to system profile..."
sudo alsactl store

# Check if the systemd restore service is enabled
if systemctl is-enabled alsa-restore.service &>/dev/null; then
    echo "alsa-restore.service is already enabled."
else
    echo "Enabling alsa-restore.service to load these states on boot..."
    sudo systemctl enable alsa-restore.service
fi

echo "============================================="
echo "🎉 ALSA settings applied and saved successfully!"
echo "============================================="
