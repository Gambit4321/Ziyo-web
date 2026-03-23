#!/bin/bash
NAS_IP="192.168.200.12"
NAS_SHARE="//192.168.200.12/Arxiv"
MOUNT_POINT="/var/www/html/ziyo-web/public/uploads/nas"
CREDENTIALS="/root/.nas-credentials"
mkdir -p "$MOUNT_POINT"
mount -t cifs "$NAS_SHARE" "$MOUNT_POINT" -o credentials="$CREDENTIALS",iocharset=utf8,vers=3.0,sec=ntlmssp,uid=33,gid=33
if mountpoint -q "$MOUNT_POINT"; then
    echo "NAS successfully mounted"
else
    echo "Failed to mount NAS"
    exit 1
fi
