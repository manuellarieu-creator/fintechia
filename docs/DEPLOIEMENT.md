# Guide de Déploiement — Fintechia

## Prérequis
- Un VPS (ex: Hostinger) sous Ubuntu 22.04
- Un nom de domaine pointant vers l'IP du VPS (ex: `votredomaine.com` et `www.votredomaine.com`)

## Déploiement Cloud Moderne (Vercel)

Si vous souhaitez déployer rapidement l'application sans configurer de VPS, vous pouvez utiliser Vercel.

**Attention** : Sur Vercel, l'application fonctionne en mode "Serverless". Les notifications en temps réel (Socket.io) seront désactivées. 
Il vous faudra également une base de données MySQL hébergée dans le cloud (ex: Aiven, TiDB).

1. Poussez votre code sur GitHub.
2. Créez un compte sur [Vercel.com](https://vercel.com).
3. Cliquez sur **Add New... > Project** et importez votre dépôt GitHub.
4. Dans les **Environment Variables**, ajoutez toutes les variables de votre `.env` (ex: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, etc.).
5. Cliquez sur **Deploy**.

Vercel détectera automatiquement le fichier `vercel.json` et déploiera le Frontend et le Backend API.

---

## Déploiement VPS Classique (Hostinger, OVH...)

## 1. Préparation du serveur VPS

Connectez-vous en SSH à votre VPS et exécutez :

```bash
sudo apt update && sudo apt upgrade -y

# Installation de Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de MySQL, Git et Nginx
sudo apt install -y mysql-server git nginx

# Installation de PM2 (gestionnaire de processus Node)
sudo npm install -g pm2

# Sécurisation de MySQL
sudo mysql_secure_installation
```

## 2. Configuration de la base de données

Connectez-vous à MySQL en tant que root :
```bash
sudo mysql
```

Dans la console MySQL, exécutez ces commandes :
```sql
CREATE DATABASE fintechia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fintechuser'@'localhost' IDENTIFIED BY 'VotreMotDePasseFort!';
GRANT ALL PRIVILEGES ON fintechia.* TO 'fintechuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 3. Déploiement de l'application

```bash
# Aller dans le dossier web
cd /var/www

# Cloner votre dépôt GitHub (assurez-vous d'avoir poussé votre code)
git clone https://github.com/VOTRE_USERNAME/fintechia.git
cd fintechia/backend

# Installer les dépendances
npm install --production

# Configurer l'environnement
cp .env.example .env
nano .env # (Renseignez vos vraies valeurs DB, JWT, SMTP)

# Importer la structure de la base de données
mysql -u fintechuser -p fintechia < ../docs/schema.sql

# Préparer le dossier d'uploads (KYC)
mkdir -p uploads
chmod 755 uploads
```

## 4. Lancement du Backend avec PM2

Toujours dans le dossier `backend` :
```bash
pm2 start server.js --name fintechia-api
pm2 startup
pm2 save
pm2 status
```

## 5. Configuration de Nginx

```bash
sudo nano /etc/nginx/sites-available/fintechia
```
Insérez la configuration suivante :
```nginx
server {
    listen 80;
    server_name votredomaine.com www.votredomaine.com;

    # Frontend - Landing page
    location / {
        root /var/www/fintechia/frontend/pages;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # Frontend - App et Admin
    location /app {
        alias /var/www/fintechia/frontend/pages;
        try_files $uri /app.html;
    }

    # Assets statiques (CSS, JS)
    location /assets/ {
        alias /var/www/fintechia/frontend/assets/;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Fichiers Uploadés (Protégés)
    location /uploads/ {
        internal;
        alias /var/www/fintechia/backend/uploads/;
    }
}
```
Activez le site et relancez Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/fintechia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Certificat SSL (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votredomaine.com -d www.votredomaine.com
```

## 7. Mise en place de la sauvegarde automatique

```bash
sudo cp /var/www/fintechia/docs/backup.sh /usr/local/bin/fintechia-backup.sh
sudo chmod +x /usr/local/bin/fintechia-backup.sh
sudo crontab -e
```
Ajoutez cette ligne (sauvegarde tous les jours à 2h du matin) :
```
0 2 * * * /usr/local/bin/fintechia-backup.sh
```

---
**Félicitations ! L'application Fintechia est maintenant en production.**
