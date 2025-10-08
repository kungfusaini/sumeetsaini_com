#!/bin/bash
set -e
REMOTE_HOST=aether
REMOTE_PATH=/var/www/sumeetsaini_com

rsync -avz --delete \
      --exclude='.git/' \
      --exclude='deploy.sh' \
      --exclude='.gitignore' \
      --exclude='README.md' \
      ./ \
      "$REMOTE_HOST:$REMOTE_PATH/"

echo "Site synced."
