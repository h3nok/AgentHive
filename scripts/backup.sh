#!/bin/bash
set -e

# Create backup directory with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/mongodb_${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

# Create MongoDB dump
echo "Creating MongoDB backup..."
mongodump --uri="${MONGODB_URI}" --out="${BACKUP_DIR}"

# Compress the backup
echo "Compressing backup..."
tar -czf "${BACKUP_DIR}.tar.gz" -C "${BACKUP_DIR}" .

# If S3 bucket is configured, upload the backup
if [ -n "${S3_BUCKET}" ]; then
    echo "Uploading backup to S3..."
    aws s3 cp "${BACKUP_DIR}.tar.gz" "s3://${S3_BUCKET}/mongodb_backup_${TIMESTAMP}.tar.gz"
    
    # Remove the local backup after successful upload
    rm -rf "${BACKUP_DIR}" "${BACKUP_DIR}.tar.gz"
    echo "Backup uploaded to S3 and local copy removed."
else
    echo "S3 bucket not configured. Backup saved locally at ${BACKUP_DIR}.tar.gz"
fi

# Clean up old backups (keep last 7 days)
if [ -n "${S3_BUCKET}" ]; then
    # For S3, use lifecycle rules instead
    echo "Configure S3 lifecycle rules to manage backup retention."
else
    echo "Cleaning up old backups..."
    find "/backup" -name "mongodb_*.tar.gz" -type f -mtime +7 -delete
fi

echo "Backup completed successfully!"
