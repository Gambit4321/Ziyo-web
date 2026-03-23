## 🏗 Infrastructure Architecture

This project is deployed using a **Monolithic Native Stack** approach within a **Proxmox LXC (Linux Container)** environment, bypassing the complexity of Docker for simplified stateful management and direct I/O performance.

### ⚙️ System Specs & Stack
* **Virtualization:** LXC (OS-level virtualization). Acts as a lightweight persistent VPS.
* **OS:** Ubuntu 22.04 LTS (Jammy Jellyfish).
* **Web Server:** Nginx (Reverse Proxy & Static Serve).
* **Runtime:** Node.js 20+ (Next.js) running via PM2 or as a systemd service.
* **Database:** MariaDB (MySQL compatible) managed via Prisma ORM.
* **Filesystem & Dev Access:** * Direct block storage mapping (no overlayFS overhead).
    * Hot-reload development via **SMB/CIFS (Samba)** directly mounted to `/var/www/html`.

### 🚀 Why this over Docker?
1.  **Performance:** Native execution speed without Docker's NAT/Bridge networking overhead.
2.  **Persistence:** The container is stateful. Logs, database data, and uploads persist naturally without configuring complex Docker Volumes.
3.  **Simplicity:** Services are managed via standard Linux or PM2 commands (`pm2 restart ziyo-web`), making debugging easier with direct SSH access.

### 🔑 Security & Access (Super Key)
*   **SSH Access:** Serverga parolsiz kirish uchun **SSH Key (Super Key)** o'rnatilgan. 
*   **Foydalanish:** Terminal orqali `ssh root@192.168.200.205` buyrug'i yozilganda, kalit avtomatik tanilib, parol so'ralmasdan kiriladi.
*   **Loyiha:** Bu kalit loyihaning kodiga ta'sir qilmaydi, lekin bizga (agent va dev) serverda tezkor ishlash imkonini beradi.

### 🛠 Setup & Deployment (Manual)
Agar server yangitdan o'rnatilsa yoki Node.js bo'lmasa, quyidagi buyruqlar orqali ishga tushiriladi:

**1. Node.js (v20) o'rnatish:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**2. Loyihani build qilish va PM2 bilan yoqish:**
```bash
cd /var/www/html/ziyo-web
npm install
npm run build
sudo npm install -g pm2
pm2 start npm --name "ziyo-web" -- start
pm2 save
pm2 startup
```

---

### 🌐 Agent Preferences (Ko'rsatmalar)
- **Til (Language):** Foydalanuvchi bilan har doim **O'zbek tilida** muloqot qiling.
```