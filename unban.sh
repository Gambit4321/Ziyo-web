#!/bin/bash
# 1. Unban IP from iptables and fail2ban (since too many failed attempts blocked you)
echo "Clearing Firewall..."
iptables -F || true
fail2ban-client unban --all || true

# 2. Allow legacy ssh-rsa key (Ubuntu 22.04 rejects old Windows SSH RSA keys by default)
echo "Enabling ssh-rsa algorithm..."
grep -q "PubkeyAcceptedKeyTypes" /etc/ssh/sshd_config || echo "PubkeyAcceptedKeyTypes +ssh-rsa" >> /etc/ssh/sshd_config
grep -q "PubkeyAcceptedAlgorithms" /etc/ssh/sshd_config || echo "PubkeyAcceptedAlgorithms +ssh-rsa" >> /etc/ssh/sshd_config

# 3. Ensure permissions are perfectly correct for authorized_keys
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
chown -R root:root /root/.ssh

# 4. Restart SSH
echo "Restarting SSH Service..."
systemctl restart ssh || true
systemctl restart sshd || true

echo "=========================================="
echo "BLOCK REMOVED AND RSA KEYS ENABLED!"
echo "=========================================="
