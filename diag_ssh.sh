#!/bin/bash
# Reset password to a known non-keyboard-layout-dependent string
echo "root:ZiyoAdmin123!" | chpasswd

# Dump logs to samba share so we can read why it failed
cp /var/log/auth.log /var/www/html/ziyo-web/auth_dump.txt
chmod 777 /var/www/html/ziyo-web/auth_dump.txt

echo "=========================================="
echo "PASSWORD RESET TO: ZiyoAdmin123!"
echo "LOGS COPIED TO auth_dump.txt"
echo "=========================================="
