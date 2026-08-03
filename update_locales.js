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
  ,
    "Sélectionnez...": "Vælg...",
    "Code...": "Kode...",
    "Europe": "Europa",
    "Amérique du Sud": "Sydamerika",
    "🇫🇷 Française": "🇫🇷 Fransk",
    "🇧🇪 Belge": "🇧🇪 Belgisk",
    "🇨🇭 Suisse": "🇨🇭 Schweizisk",
    "🇪🇸 Espagnole": "🇪🇸 Spansk",
    "🇮🇹 Italienne": "🇮🇹 Italiensk",
    "🇩🇪 Allemande": "🇩🇪 Tysk",
    "🇵🇹 Portugaise": "🇵🇹 Portugisisk",
    "🇬🇧 Britannique": "🇬🇧 Britisk",
    "🇧🇷 Brésilienne": "🇧🇷 Brasiliansk",
    "🇦🇷 Argentine": "🇦🇷 Argentinsk",
    "🇨🇴 Colombienne": "🇨🇴 Colombiansk",
    "🇨🇱 Chilienne": "🇨🇱 Chilensk",
    "🇵🇪 Péruvienne": "🇵🇪 Peruviansk",
    "🇻🇪 Vénézuélienne": "🇻🇪 Venezuelansk",
    "🇪🇨 Équatorienne": "🇪🇨 Ecuadoriansk",
    "🇧🇴 Bolivienne": "🇧🇴 Boliviansk",
    "🇵🇾 Paraguayenne": "🇵🇾 Paraguayansk",
    "🇺🇾 Uruguayenne": "🇺🇾 Uruguayansk",
    "Notification": "Notification",
    "Session expirée pour inactivité.": "Session udløbet på grund af inaktivitet.",
    "Compris": "Forstået",
    "Code envoyé au": "Kode sendt til",
    "Code envoyé à": "Kode sendt til"},
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
  ,
    "Sélectionnez...": "Wählen...",
    "Code...": "Code...",
    "Europe": "Europa",
    "Amérique du Sud": "Südamerika",
    "🇫🇷 Française": "🇫🇷 Französisch",
    "🇧🇪 Belge": "🇧🇪 Belgisch",
    "🇨🇭 Suisse": "🇨🇭 Schweizerisch",
    "🇪🇸 Espagnole": "🇪🇸 Spanisch",
    "🇮🇹 Italienne": "🇮🇹 Italienisch",
    "🇩🇪 Allemande": "🇩🇪 Deutsch",
    "🇵🇹 Portugaise": "🇵🇹 Portugiesisch",
    "🇬🇧 Britannique": "🇬🇧 Britisch",
    "🇧🇷 Brésilienne": "🇧🇷 Brasilianisch",
    "🇦🇷 Argentine": "🇦🇷 Argentinisch",
    "🇨🇴 Colombienne": "🇨🇴 Kolumbianisch",
    "🇨🇱 Chilienne": "🇨🇱 Chilenisch",
    "🇵🇪 Péruvienne": "🇵🇪 Peruanisch",
    "🇻🇪 Vénézuélienne": "🇻🇪 Venezolanisch",
    "🇪🇨 Équatorienne": "🇪🇨 Ecuadorianisch",
    "🇧🇴 Bolivienne": "🇧🇴 Bolivianisch",
    "🇵🇾 Paraguayenne": "🇵🇾 Paraguayisch",
    "🇺🇾 Uruguayenne": "🇺🇾 Uruguayisch",
    "Notification": "Benachrichtigung",
    "Session expirée pour inactivité.": "Sitzung wegen Inaktivität abgelaufen.",
    "Compris": "Verstanden",
    "Code envoyé au": "Code gesendet an",
    "Code envoyé à": "Code gesendet an"},
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
  ,
    "Sélectionnez...": "Select...",
    "Code...": "Code...",
    "Europe": "Europe",
    "Amérique du Sud": "South America",
    "🇫🇷 Française": "🇫🇷 French",
    "🇧🇪 Belge": "🇧🇪 Belgian",
    "🇨🇭 Suisse": "🇨🇭 Swiss",
    "🇪🇸 Espagnole": "🇪🇸 Spanish",
    "🇮🇹 Italienne": "🇮🇹 Italian",
    "🇩🇪 Allemande": "🇩🇪 German",
    "🇵🇹 Portugaise": "🇵🇹 Portuguese",
    "🇬🇧 Britannique": "🇬🇧 British",
    "🇧🇷 Brésilienne": "🇧🇷 Brazilian",
    "🇦🇷 Argentine": "🇦🇷 Argentine",
    "🇨🇴 Colombienne": "🇨🇴 Colombian",
    "🇨🇱 Chilienne": "🇨🇱 Chilean",
    "🇵🇪 Péruvienne": "🇵🇪 Peruvian",
    "🇻🇪 Vénézuélienne": "🇻🇪 Venezuelan",
    "🇪🇨 Équatorienne": "🇪🇨 Ecuadorian",
    "🇧🇴 Bolivienne": "🇧🇴 Bolivian",
    "🇵🇾 Paraguayenne": "🇵🇾 Paraguayan",
    "🇺🇾 Uruguayenne": "🇺🇾 Uruguayan",
    "Notification": "Notification",
    "Session expirée pour inactivité.": "Session expired due to inactivity.",
    "Compris": "Got it",
    "Code envoyé au": "Code sent to",
    "Code envoyé à": "Code sent to"},
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
  ,
    "Sélectionnez...": "Seleccione...",
    "Code...": "Código...",
    "Europe": "Europa",
    "Amérique du Sud": "América del Sur",
    "🇫🇷 Française": "🇫🇷 Francesa",
    "🇧🇪 Belge": "🇧🇪 Belga",
    "🇨🇭 Suisse": "🇨🇭 Suiza",
    "🇪🇸 Espagnole": "🇪🇸 Española",
    "🇮🇹 Italienne": "🇮🇹 Italiana",
    "🇩🇪 Allemande": "🇩🇪 Alemana",
    "🇵🇹 Portugaise": "🇵🇹 Portuguesa",
    "🇬🇧 Britannique": "🇬🇧 Británica",
    "🇧🇷 Brésilienne": "🇧🇷 Brasileña",
    "🇦🇷 Argentine": "🇦🇷 Argentina",
    "🇨🇴 Colombienne": "🇨🇴 Colombiana",
    "🇨🇱 Chilienne": "🇨🇱 Chilena",
    "🇵🇪 Péruvienne": "🇵🇪 Peruana",
    "🇻🇪 Vénézuélienne": "🇻🇪 Venezolana",
    "🇪🇨 Équatorienne": "🇪🇨 Ecuatoriana",
    "🇧🇴 Bolivienne": "🇧🇴 Boliviana",
    "🇵🇾 Paraguayenne": "🇵🇾 Paraguaya",
    "🇺🇾 Uruguayenne": "🇺🇾 Uruguaya",
    "Notification": "Notificación",
    "Session expirée pour inactivité.": "Sesión caducada por inactividad.",
    "Compris": "Entendido",
    "Code envoyé au": "Código enviado al",
    "Code envoyé à": "Código enviado a"},
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
  ,
    "Sélectionnez...": "Sélectionnez...",
    "Code...": "Code...",
    "Europe": "Europe",
    "Amérique du Sud": "Amérique du Sud",
    "🇫🇷 Française": "🇫🇷 Française",
    "🇧🇪 Belge": "🇧🇪 Belge",
    "🇨🇭 Suisse": "🇨🇭 Suisse",
    "🇪🇸 Espagnole": "🇪🇸 Espagnole",
    "🇮🇹 Italienne": "🇮🇹 Italienne",
    "🇩🇪 Allemande": "🇩🇪 Allemande",
    "🇵🇹 Portugaise": "🇵🇹 Portugaise",
    "🇬🇧 Britannique": "🇬🇧 Britannique",
    "🇧🇷 Brésilienne": "🇧🇷 Brésilienne",
    "🇦🇷 Argentine": "🇦🇷 Argentine",
    "🇨🇴 Colombienne": "🇨🇴 Colombienne",
    "🇨🇱 Chilienne": "🇨🇱 Chilienne",
    "🇵🇪 Péruvienne": "🇵🇪 Péruvienne",
    "🇻🇪 Vénézuélienne": "🇻🇪 Vénézuélienne",
    "🇪🇨 Équatorienne": "🇪🇨 Équatorienne",
    "🇧🇴 Bolivienne": "🇧🇴 Bolivienne",
    "🇵🇾 Paraguayenne": "🇵🇾 Paraguayenne",
    "🇺🇾 Uruguayenne": "🇺🇾 Uruguayenne",
    "Notification": "Notification",
    "Session expirée pour inactivité.": "Session expirée pour inactivité.",
    "Compris": "Compris",
    "Code envoyé au": "Code envoyé au",
    "Code envoyé à": "Code envoyé à"},
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
  ,
    "Sélectionnez...": "Odaberite...",
    "Code...": "Kod...",
    "Europe": "Europa",
    "Amérique du Sud": "Južna Amerika",
    "🇫🇷 Française": "🇫🇷 Francusko",
    "🇧🇪 Belge": "🇧🇪 Belgijsko",
    "🇨🇭 Suisse": "🇨🇭 Švicarsko",
    "🇪🇸 Espagnole": "🇪🇸 Španjolsko",
    "🇮🇹 Italienne": "🇮🇹 Talijansko",
    "🇩🇪 Allemande": "🇩🇪 Njemačko",
    "🇵🇹 Portugaise": "🇵🇹 Portugalsko",
    "🇬🇧 Britannique": "🇬🇧 Britansko",
    "🇧🇷 Brésilienne": "🇧🇷 Brazilsko",
    "🇦🇷 Argentine": "🇦🇷 Argentinsko",
    "🇨🇴 Colombienne": "🇨🇴 Kolumbijsko",
    "🇨🇱 Chilienne": "🇨🇱 Čileansko",
    "🇵🇪 Péruvienne": "🇵🇪 Peruansko",
    "🇻🇪 Vénézuélienne": "🇻🇪 Venezuelsko",
    "🇪🇨 Équatorienne": "🇪🇨 Ekvadorsko",
    "🇧🇴 Bolivienne": "🇧🇴 Bolivijsko",
    "🇵🇾 Paraguayenne": "🇵🇾 Paragvajsko",
    "🇺🇾 Uruguayenne": "🇺🇾 Urugvajsko",
    "Notification": "Obavijest",
    "Session expirée pour inactivité.": "Sesija je istekla zbog neaktivnosti.",
    "Compris": "Razumijem",
    "Code envoyé au": "Kod poslan na",
    "Code envoyé à": "Kod poslan na"},
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
  ,
    "Sélectionnez...": "Válasszon...",
    "Code...": "Kód...",
    "Europe": "Európa",
    "Amérique du Sud": "Dél-Amerika",
    "🇫🇷 Française": "🇫🇷 Francia",
    "🇧🇪 Belge": "🇧🇪 Belga",
    "🇨🇭 Suisse": "🇨🇭 Svájci",
    "🇪🇸 Espagnole": "🇪🇸 Spanyol",
    "🇮🇹 Italienne": "🇮🇹 Olasz",
    "🇩🇪 Allemande": "🇩🇪 Német",
    "🇵🇹 Portugaise": "🇵🇹 Portugál",
    "🇬🇧 Britannique": "🇬🇧 Brit",
    "🇧🇷 Brésilienne": "🇧🇷 Brazil",
    "🇦🇷 Argentine": "🇦🇷 Argentin",
    "🇨🇴 Colombienne": "🇨🇴 Kolumbiai",
    "🇨🇱 Chilienne": "🇨🇱 Chilei",
    "🇵🇪 Péruvienne": "🇵🇪 Perui",
    "🇻🇪 Vénézuélienne": "🇻🇪 Venezuelai",
    "🇪🇨 Équatorienne": "🇪🇨 Ecuadori",
    "🇧🇴 Bolivienne": "🇧🇴 Bolíviai",
    "🇵🇾 Paraguayenne": "🇵🇾 Paraguayi",
    "🇺🇾 Uruguayenne": "🇺🇾 Uruguayi",
    "Notification": "Értesítés",
    "Session expirée pour inactivité.": "A munkamenet inaktivitás miatt lejárt.",
    "Compris": "Értem",
    "Code envoyé au": "Kód elküldve:",
    "Code envoyé à": "Kód elküldve:"}
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
