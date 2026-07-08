#!/bin/bash
# ============================================
# MySQL Backup to Backblaze B2 (free up to 10GB)
# ============================================
# Setup:
#   1. Create free account at backblaze.com
#   2. Create a bucket: crm-backups
#   3. Generate Application Key with read/write to that bucket
#   4. Install rclone: curl https://rclone.org/install.sh | sudo bash
#   5. Configure: rclone config  (name it "b2")
#   6. Save this file as /usr/local/bin/backup-db.sh
#   7. chmod +x /usr/local/bin/backup-db.sh
#   8. Add to crontab: 0 3 * * * /usr/local/bin/backup-db.sh
#
# Restore: rclone copy b2:crm-backups/2026-07-07_030000.sql.gz /tmp/ && gunzip /tmp/2026-07-07_030000.sql.gz && mysql -u root -p laravel_db < /tmp/2026-07-07_030000.sql

set -e

# ---- Config (set these) ----
DB_HOST="${DB_HOST:-db}"
DB_USER="${DB_USER:-laravel_user}"
DB_PASS="${DB_PASSWORD:-laravel_password}"
DB_NAME="${DB_NAME:-laravel_db}"
B2_REMOTE="b2:crm-backups"   # rclone remote name : bucket
KEEP_LOCAL_DAYS=7            # keep local copies for 1 week

# ---- Timestamp ----
TS=$(date +"%Y-%m-%d_%H%M%S")
FILENAME="${DB_NAME}_${TS}.sql.gz"
TMP_FILE="/tmp/${FILENAME}"

echo "[$(date)] Starting backup of ${DB_NAME}..."

# ---- Dump + compress ----
mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASS}" \
    --single-transaction --routines --triggers --events \
    --quick --lock-tables=false \
    "${DB_NAME}" | gzip > "${TMP_FILE}"

# ---- Verify backup is not empty ----
SIZE=$(stat -c%s "${TMP_FILE}")
if [ "${SIZE}" -lt 1024 ]; then
    echo "ERROR: Backup too small (${SIZE} bytes), something is wrong"
    rm -f "${TMP_FILE}"
    exit 1
fi

echo "[$(date)] Local dump: ${FILENAME} (${SIZE} bytes)"

# ---- Upload to B2 ----
rclone copy "${TMP_FILE}" "${B2_REMOTE}/daily/" --progress

# ---- Cleanup old local files ----
find /tmp -name "${DB_NAME}_*.sql.gz" -mtime +${KEEP_LOCAL_DAYS} -delete

# ---- Cleanup remote backups older than 90 days (uncomment if you want) ----
# rclone delete "${B2_REMOTE}/daily/" --min-age 90d

echo "[$(date)] Backup completed: ${FILENAME}"
