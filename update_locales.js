const fs = require('fs');
const path = require('path');

// 1. Update transactions.js
let txFile = 'frontend/assets/js/transactions.js';
let txContent = fs.readFileSync(txFile, 'utf8');

txContent = txContent.replace(/const typeLabel = isCredit \? 'Crédit' : 'Débit';/g, "const typeLabel = isCredit ? 'Virement entrant' : 'Virement sortant';");
txContent = txContent.replace(/if\s*\(tx\.type === 'debit'\)\s*cat = 'Débit';/g, "if (tx.type === 'debit') cat = 'Virement sortant';");
txContent = txContent.replace(/\$\{tx\.categorie \|\| 'Divers'\}/g, "${tx.categorie || (isCredit ? 'Virement entrant' : 'Virement sortant')}");

fs.writeFileSync(txFile, txContent);

// 2. Update releves.js
let relFile = 'frontend/assets/js/releves.js';
let relContent = fs.readFileSync(relFile, 'utf8');
relContent = relContent.replace(/const typeLabel = isCredit \? 'Crédit' : 'Débit';/g, "const typeLabel = isCredit ? 'Virement entrant' : 'Virement sortant';");
fs.writeFileSync(relFile, relContent);

// 3. Update app.js date locale
let appFile = 'frontend/assets/js/app.js';
let appContent = fs.readFileSync(appFile, 'utf8');
appContent = appContent.replace(
  /<td>\$\{new Date\(c\.created_at\)\.toLocaleDateString\(\)\}<\/td>/g,
  "<td>${new Date(c.created_at).toLocaleDateString((typeof window.getCurrentLocale === 'function' ? window.getCurrentLocale() : 'fr-FR'))}</td>"
);
fs.writeFileSync(appFile, appContent);

// 4. Update locales
const translations = {
  "da": {
    "Dépôt": "Indbetaling",
    "Aucune alerte ce mois-ci.": "Ingen advarsler i denne måned.",
    "Aucune dépense.": "Ingen udgifter.",
    "Aucune enveloppe définie.": "Ingen konvolutter defineret.",
    "Aucun bénéficiaire enregistré.": "Ingen registreret modtager.",
    "Total": "Total",
    "Aucun budget défini. Cliquez sur Gérer pour commencer.": "Intet budget defineret. Klik på Administrer for at starte.",
    "Virement entrant": "Indgående overførsel",
    "Virement sortant": "Udgående overførsel"
  },
  "de": {
    "Dépôt": "Einzahlung",
    "Aucune alerte ce mois-ci.": "Keine Warnungen diesen Monat.",
    "Aucune dépense.": "Keine Ausgaben.",
    "Aucune enveloppe définie.": "Keine Umschläge definiert.",
    "Aucun bénéficiaire enregistré.": "Kein registrierter Begünstigter.",
    "Total": "Gesamt",
    "Aucun budget défini. Cliquez sur Gérer pour commencer.": "Kein Budget definiert. Klicken Sie auf Verwalten, um zu beginnen.",
    "Virement entrant": "Eingehende Überweisung",
    "Virement sortant": "Ausgehende Überweisung"
  },
  "en": {
    "Dépôt": "Deposit",
    "Aucune alerte ce mois-ci.": "No alerts this month.",
    "Aucune dépense.": "No expenses.",
    "Aucune enveloppe définie.": "No envelopes defined.",
    "Aucun bénéficiaire enregistré.": "No registered beneficiary.",
    "Total": "Total",
    "Aucun budget défini. Cliquez sur Gérer pour commencer.": "No budget defined. Click on Manage to start.",
    "Virement entrant": "Incoming transfer",
    "Virement sortant": "Outgoing transfer"
  },
  "es": {
    "Dépôt": "Depósito",
    "Aucune alerte ce mois-ci.": "No hay alertas este mes.",
    "Aucune dépense.": "Sin gastos.",
    "Aucune enveloppe définie.": "No hay sobres definidos.",
    "Aucun bénéficiaire enregistré.": "Ningún beneficiario registrado.",
    "Total": "Total",
    "Aucun budget défini. Cliquez sur Gérer pour commencer.": "Ningún presupuesto definido. Haga clic en Gestionar para empezar.",
    "Virement entrant": "Transferencia entrante",
    "Virement sortant": "Transferencia saliente"
  },
  "fr": {
    "Dépôt": "Dépôt",
    "Aucune alerte ce mois-ci.": "Aucune alerte ce mois-ci.",
    "Aucune dépense.": "Aucune dépense.",
    "Aucune enveloppe définie.": "Aucune enveloppe définie.",
    "Aucun bénéficiaire enregistré.": "Aucun bénéficiaire enregistré.",
    "Total": "Total",
    "Aucun budget défini. Cliquez sur Gérer pour commencer.": "Aucun budget défini. Cliquez sur Gérer pour commencer.",
    "Virement entrant": "Virement entrant",
    "Virement sortant": "Virement sortant"
  },
  "hr": {
    "Dépôt": "Polog",
    "Aucune alerte ce mois-ci.": "Nema upozorenja ovog mjeseca.",
    "Aucune dépense.": "Nema troškova.",
    "Aucune enveloppe définie.": "Nema definiranih omotnica.",
    "Aucun bénéficiaire enregistré.": "Nema registriranih korisnika.",
    "Total": "Ukupno",
    "Aucun budget défini. Cliquez sur Gérer pour commencer.": "Nema definiranog proračuna. Kliknite Upravljanje za početak.",
    "Virement entrant": "Dolazni prijenos",
    "Virement sortant": "Odlazni prijenos"
  },
  "hu": {
    "Dépôt": "Befizetés",
    "Aucune alerte ce mois-ci.": "Nincsenek riasztások ebben a hónapban.",
    "Aucune dépense.": "Nincsenek kiadások.",
    "Aucune enveloppe définie.": "Nincsenek borítékok meghatározva.",
    "Aucun bénéficiaire enregistré.": "Nincs regisztrált kedvezményezett.",
    "Total": "Összesen",
    "Aucun budget défini. Cliquez sur Gérer pour commencer.": "Nincs költségvetés meghatározva. Kattintson a Kezelés gombra a kezdéshez.",
    "Virement entrant": "Bejövő átutalás",
    "Virement sortant": "Kimenő átutalás"
  }
};

const localesDir = 'frontend/assets/locales';
fs.readdirSync(localesDir).forEach(file => {
  if (file.endsWith('.json')) {
    const langCode = path.basename(file, '.json');
    if (translations[langCode]) {
      const filePath = path.join(localesDir, file);
      let json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Inject translations
      Object.assign(json, translations[langCode]);
      
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
      console.log(`Updated ${file}`);
    }
  }
});
