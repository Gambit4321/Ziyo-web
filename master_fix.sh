#!/bin/bash
echo "1. Clearing all Firewalls and stopping Fail2Ban..."
iptables -P INPUT ACCEPT
iptables -F
systemctl stop fail2ban || true

echo "2. Enforcing SSH access explicitly via config override..."
mkdir -p /etc/ssh/sshd_config.d/
echo "PermitRootLogin yes" > /etc/ssh/sshd_config.d/99-override.conf
echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config.d/99-override.conf
echo "PubkeyAuthentication yes" >> /etc/ssh/sshd_config.d/99-override.conf
echo "PubkeyAcceptedAlgorithms +ssh-rsa" >> /etc/ssh/sshd_config.d/99-override.conf
echo "PubkeyAcceptedKeyTypes +ssh-rsa" >> /etc/ssh/sshd_config.d/99-override.conf

echo "3. Changing root password to simple numbers to avoid keyboard layout errors..."
echo "root:12345" | chpasswd

echo "4. Restarting SSH..."
systemctl restart ssh
systemctl restart sshd

echo "================================================="
echo "COMPLETE UNLOCK SUCCESSFUL!"
echo "Server Password is now simply: 12345"
echo "================================================="
