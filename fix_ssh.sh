#!/bin/bash
# 1. Fix root directory permissions (StrictModes requires this)
chmod 700 /root
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
chown -R root:root /root/.ssh

# 2. Allow Root to login with password just in case keys fail again
sed -i 's/^#PermitRootLogin.*/PermitRootLogin yes/g' /etc/ssh/sshd_config
sed -i 's/^PermitRootLogin prohibit-password/PermitRootLogin yes/g' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication yes/g' /etc/ssh/sshd_config
sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config

# 3. Enable Pubkey in case it was disabled
sed -i 's/^#PubkeyAuthentication.*/PubkeyAuthentication yes/g' /etc/ssh/sshd_config

# 4. Restart SSH service
systemctl restart ssh || true
systemctl restart sshd || true

echo "=========================================="
echo "SSH HAS BEEN FIXED AND PASSWORD LOGIN IS ENABLED!"
echo "=========================================="
