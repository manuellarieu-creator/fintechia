const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend', 'assets', 'locales');
const enDict = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

const htmlFiles = [
    'admin-dashboard.html',
    'admin.html',
    'app.html',
    'cartes.html',
    'cgu.html',
    'confidentialite.html',
    'contact.html',
    'index.html',
    'virement.html'
].map(f => path.join(__dirname, 'frontend', 'pages', f));

const jsFiles = fs.readdirSync(path.join(__dirname, 'frontend', 'assets', 'js')).filter(f => f.endsWith('.js')).map(f => path.join(__dirname, 'frontend', 'assets', 'js', f));
const allFiles = [...htmlFiles, ...jsFiles];

let allStrings = new Set();

allFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    
    // 1. Text between HTML tags
    const textRegex = />([^<]+)</g;
    let match;
    while ((match = textRegex.exec(content)) !== null) {
        const text = match[1].replace(/\s+/g, ' ').trim();
        if (text.length > 1 && !/^[\d\s€$.,;:+\*/=()!%_\-]+$/.test(text) && !text.includes('{')) {
            allStrings.add(text);
        }
    }

    // 2. Placeholders
    const placeholderRegex = /placeholder="([^"]+)"/g;
    while ((match = placeholderRegex.exec(content)) !== null) {
        const text = match[1].replace(/\s+/g, ' ').trim();
        allStrings.add(text);
    }

    // 3. Button values
    const valueRegex = /value="([^"]+)"[^>]*type="(?:button|submit)"/g;
    while ((match = valueRegex.exec(content)) !== null) {
         const text = match[1].replace(/\s+/g, ' ').trim();
         allStrings.add(text);
    }
    
    // 4. Strings in JS (crude extraction of single/double quoted strings that might be text, focusing on UI text)
    // It's safer to just extract common words or just rely on what the user provided plus what we find dynamically.
});

// Also manually inject the specific texts the user reported that might be built dynamically:
[
  "Bonjour, ",
  "Date du jour",
  "Page 1",
  "← Précédent",
  "Suivant →",
  "Création de carte en cours",
  "Notre équipe finalise la configuration de votre nouvelle carte de paiement Fintechia. Vous y aurez accès dès sa validation.",
  "Aucune dépense récente.",
  "Nom",
  "IBAN",
  "Action",
  "mois d'historique",
  "FORMAT",
  "ENVOI EMAIL",
  "Relevé — ",
  "En cours",
  "Date",
  "Motif",
  "Montant",
  "Aucune demande de crédit pour le moment.",
  "REVENUS MOIS",
  "DÉPENSES MOIS",
  "ÉPARGNE DU MOIS",
  "vs préc.",
  "Obj.",
  "Budget envelopes",
  "Mois",
  "Accueil",
  "Virements",
  "Cartes",
  "Crédits",
  "Budget",
  "Bénéficiaires",
  "Relevés",
  "Aide & Support"
].forEach(s => allStrings.add(s));

const missingKeys = [];
for (const str of allStrings) {
    if (typeof enDict[str] === 'undefined' && str.length > 1 && !/^[\d\s€$.,;:+\*/=()!%_\-]+$/.test(str)) {
        missingKeys.push(str);
    }
}

console.log("Missing keys found: " + missingKeys.length);
fs.writeFileSync('missing_keys.json', JSON.stringify(missingKeys, null, 2));
