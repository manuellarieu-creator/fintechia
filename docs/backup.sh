#!/bin/bash
DB_USER="fintechuser"
DB_PASSWORD="VotreMotDePasseMySQL"
DB_NAME="fintechia"
BACKUP_DIR="/var/backups/fintechia"
DATE=$(date +"%Y-%m-%d_%H-%M")
BACKUP_FILE="$BACKUP_DIR/fintechia_$DATE.sql.gz"
LOG_FILE="/var/log/fintechia_backup.log"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

mysqldump \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  --add-drop-table \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  echo "[$(date)] Sauvegarde réussie → $BACKUP_FILE ($SIZE)" >> "$LOG_FILE"
else
  echo "[$(date)] ERREUR — La sauvegarde a échoué !" >> "$LOG_FILE"
  exit 1
fi

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Nettoyage terminé" >> "$LOG_FILE"
