# Fintechia (ex NovaBanque)

Application bancaire fullstack moderne et sécurisée.

## Fonctionnalités principales
- Inscription et connexion sécurisée (JWT, bcrypt)
- Tableau de bord client avec solde et historique
- Virements internes et externes avec détection automatique de BIC
- Système KYC avec upload de documents et selfie
- Interface d'administration pour la gestion des comptes, validations KYC, et transactions
- Notifications en temps réel (Socket.io)
- Journal d'audit complet

## Installation locale (via GitHub Codespaces ou localement)

1. Clonez le dépôt et installez les dépendances :
   ```bash
   cd backend
   npm install
   ```
2. Configurez la base de données :
   - Importez `docs/schema.sql` dans votre serveur MySQL
   - Copiez `backend/.env.example` vers `backend/.env` et ajustez les valeurs (DB, SMTP, etc.)
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## Déploiement

Voir `docs/DEPLOIEMENT.md` pour les instructions complètes de déploiement sur VPS (Hostinger, Ubuntu 22.04) avec Nginx, PM2, et Certbot.
