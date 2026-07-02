# Fintechia - Récapitulatif du Projet

Ce document sert de suivi pour le projet **Fintechia**. Il liste toutes les fonctionnalités qui ont déjà été mises en place, ainsi que les tâches qu'il reste à accomplir.

---

## ✅ Ce qui a été fait

### 1. Environnement et Architecture
- **Déploiement Vercel :** Configuration du projet pour un hébergement serverless sur Vercel.
- **Stockage Fichiers (KYC) :** Intégration de Cloudinary pour la gestion des images/vidéos (pièces d'identité, selfies) car le système de fichiers Vercel est éphémère. Variables d'environnement configurées en production.
- **Single Page Application (SPA) :** Mise en place d'une interface frontend réactive basée sur `app.html` et gérée par Javascript (`app.js`, `budget.js`, `virement.js`, etc.) avec un système de vues dynamiques.

### 2. Interface Utilisateur (App)
- **Tableau de Bord :** Affichage du solde, des transactions récentes, et du profil utilisateur.
- **Gestion des Budgets (Page Budget) :** Remplacement des fausses données en dur par un chargement dynamique depuis la base de données. Affichage de la répartition, des enveloppes budgétaires, et de l'évolution des dépenses. (Correction de la syntaxe empêchant le chargement dynamique).
- **Virements (Tunnel) :** Tunnel de virement étape par étape avec gestion des bénéficiaires et saisie des montants.

### 3. Panel d'Administration et Modération
- **Validation des Comptes :** L'administrateur peut valider les nouveaux comptes utilisateurs. Lors de la validation, l'Admin doit manuellement assigner/remplir les informations bancaires (IBAN, Numéro de compte, BIC) pour chaque utilisateur, de manière individuelle.
- **Gestion des Virements :** 
  - Ajout d'une interface permettant à l'Admin d'approuver ou de rejeter les virements en attente initiés par les utilisateurs (boutons Valider / Rejeter).
- **Contrôle et Limites Individuelles :**
  - Possibilité de créditer un compte sans autoriser le transfert des fonds vers l'extérieur (blocage des virements sortants).
  - Possibilité de fixer une limite de montant maximum par virement propre à chaque client.
- **Moteur de Règles et Popups :** 
  - L'Admin peut créer des règles spécifiques (ex: *Si le solde est de > 12000€ et que le virement initié est > 12000€, alors bloquer et afficher une popup spécifique*).
  - La modale d'affichage de ces règles a été proprement stylisée et centrée sur l'interface utilisateur pour bloquer l'action avec une "Information importante".

---

## ⏳ Ce qu'il reste à faire (To-Do)

### 1. Fonctionnalités Attendues
- **Numéro Client Unique :** Attribuer et générer automatiquement un "Numéro Client" unique pour chaque utilisateur lors de la création de son compte (à afficher côté User et côté Admin).
- **Finaliser les notifications / alertes :** S'assurer que le workflow des bénéficiaires en attente est géré par l'Admin si ce n'est pas encore le cas.

### 2. Améliorations & Corrections Potentielles
- **Vérifications KYC avancées :** Assurer la fluidité de la vérification avec Cloudinary sur Vercel.
- **Responsive et UI :** Poursuivre le polissage de l'interface mobile/desktop s'il y a des décalages sur certains écrans.
- **Export de relevés :** Finaliser les fonctionnalités liées au téléchargement des relevés bancaires dynamiques en PDF (si prévu).

---
*Ce fichier sera mis à jour au fur et à mesure de l'avancée du projet.*
