#!/bin/sh
# ──────────────────────────────────────────────────────────────────────
# Off-site backup upload to S3-compatible storage
# Works with: Hetzner Object Storage, Backblaze B2, AWS S3, MinIO
#
# Usage:  sh backup-upload.sh /path/to/backup.sql.gz
#
# Required env vars (no-op when missing):
#   BACKUP_S3_ENDPOINT   — e.g. https://fsn1.your-objectstorage.com
#   BACKUP_S3_BUCKET     — e.g. nanachimi-backups
#   BACKUP_S3_ACCESS_KEY
#   BACKUP_S3_SECRET_KEY
# ──────────────────────────────────────────────────────────────────────
set -e

BACKUP_FILE="$1"

# Graceful skip when S3 is not configured
if [ -z "$BACKUP_S3_ENDPOINT" ] || [ -z "$BACKUP_S3_BUCKET" ] || \
   [ -z "$BACKUP_S3_ACCESS_KEY" ] || [ -z "$BACKUP_S3_SECRET_KEY" ]; then
  echo "ℹ Off-site backup skipped (S3 not configured)"
  exit 0
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "⚠ Backup file not found: $BACKUP_FILE"
  exit 1
fi

FILENAME=$(basename "$BACKUP_FILE")

# Configure AWS CLI for S3-compatible endpoint
export AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY"
export AWS_DEFAULT_REGION="eu-central-1"

aws s3 cp "$BACKUP_FILE" \
  "s3://${BACKUP_S3_BUCKET}/nanachimi-digital/backups/${FILENAME}" \
  --endpoint-url "$BACKUP_S3_ENDPOINT" \
  --no-progress

echo "✓ Backup uploaded to s3://${BACKUP_S3_BUCKET}/nanachimi-digital/backups/${FILENAME}"
