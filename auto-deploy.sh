#!/bin/bash
set -e
cd /home/zuran/vetpro
LOG=/home/zuran/vetpro/deploy.log

echo "===== $(date) =====" >> "$LOG"

BEFORE=$(git rev-parse HEAD)
git fetch origin >> "$LOG" 2>&1
git pull origin "$(git rev-parse --abbrev-ref HEAD)" >> "$LOG" 2>&1
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" != "$AFTER" ]; then
  echo "New commits found, rebuilding..." >> "$LOG"
  docker compose up -d --build >> "$LOG" 2>&1
  echo "Deploy done." >> "$LOG"
else
  echo "No changes." >> "$LOG"
fi
