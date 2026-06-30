# Documentation API Fintechia

Toutes les routes de l'API sont préfixées par `/api`.
L'authentification s'effectue via le header `Authorization: Bearer <TOKEN>`.

## Authentification (`/api/auth`)

### POST `/register`
- **Description** : Création d'un nouveau compte client.
- **Body** : `{ prenom, nom, email, telephone, password, type_compte }`
- **Réponse (200)** : `{ token, user, account }`

### POST `/login`
- **Description** : Connexion client ou admin.
- **Body** : `{ email, password }`
- **Réponse (200)** : `{ token, user, account }`

### GET `/me`
- **Description** : Récupérer le profil de l'utilisateur connecté.
- **Header** : `Authorization: Bearer <TOKEN>`
- **Réponse (200)** : `{ user, account, kyc_statut }`

### PATCH `/password`
- **Description** : Changer de mot de passe.
- **Header** : `Authorization: Bearer <TOKEN>`
- **Body** : `{ current_password, new_password }`

### POST `/reset-demande`
- **Description** : Demander la réinitialisation du mot de passe (envoie un email).
- **Body** : `{ email }`

### POST `/reset-valider`
- **Description** : Valider le nouveau mot de passe après reset.
- **Body** : `{ token, new_password }`

---

## KYC (`/api/kyc`)

### POST `/submit`
- **Description** : Soumettre les documents d'identité.
- **Format** : `multipart/form-data`
- **Header** : `Authorization: Bearer <TOKEN>`
- **Body** : `type_document` (texte) + fichiers `document` et `selfie`.

### GET `/status`
- **Description** : Obtenir le statut KYC de l'utilisateur.
- **Header** : `Authorization: Bearer <TOKEN>`

---

## Transactions (`/api/transactions`)

### GET `/`
- **Description** : Historique des transactions du compte. Paginations et filtres.
- **Header** : `Authorization: Bearer <TOKEN>`
- **Query** : `limit`, `offset`, `type`, `date_debut`, `date_fin`.

### POST `/virement`
- **Description** : Initier un virement vers un bénéficiaire.
- **Header** : `Authorization: Bearer <TOKEN>`
- **Body** : `{ iban_dest, bic_dest, nom_dest, nom_banque_dest, montant, motif }`

### GET `/beneficiaires`
- **Description** : Lister ses bénéficiaires enregistrés.
- **Header** : `Authorization: Bearer <TOKEN>`

### POST `/beneficiaires`
- **Description** : Ajouter un bénéficiaire.
- **Body** : `{ nom, iban, bic, nom_banque }`

---

## Administration (`/api/admin`) - Nécessite un rôle 'admin'

### GET `/dashboard`
- **Description** : Statistiques globales.

### GET `/comptes`
- **Description** : Liste de tous les comptes clients. Filtre optionnel `?statut=`.

### PATCH `/comptes/:id/statut`
- **Description** : Changer le statut d'un compte.
- **Body** : `{ statut }`

### PATCH `/comptes/:id/activer`
- **Description** : Activer un compte en lui attribuant un IBAN.
- **Body** : `{ iban }`

### GET `/virements`
- **Description** : Liste des virements à valider.

### PATCH `/virements/:id`
- **Description** : Accepter ou rejeter un virement.
- **Body** : `{ decision: 'valide' | 'rejete', commentaire: '...' }`

### GET `/audit`
- **Description** : Accéder au journal de traçabilité des logs système.
- **Query** : `categorie`, `action`, `acteur_id`, `statut`, `limit`, `offset`.
