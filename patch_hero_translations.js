const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend', 'assets', 'locales');
const langs = ['en', 'es', 'de', 'da', 'hu', 'hr'];

const newStrings = {
  "en": {
    "Demander un crédit": "Request a loan",
    "Validation du compte en 5 min.": "Account validation in 5 min.",
    "Crédit immobilier reçu": "Mortgage received",
    "Durée de remboursement : 25 ans": "Repayment period: 25 years",
    "Crédit accordé sous 72 h": "Loan granted within 72 h"
  },
  "es": {
    "Demander un crédit": "Solicitar un crédito",
    "Validation du compte en 5 min.": "Validación de cuenta en 5 min.",
    "Crédit immobilier reçu": "Préstamo hipotecario recibido",
    "Durée de remboursement : 25 ans": "Plazo de amortización: 25 años",
    "Crédit accordé sous 72 h": "Crédito concedido en 72 h"
  },
  "de": {
    "Demander un crédit": "Einen Kredit beantragen",
    "Validation du compte en 5 min.": "Kontovalidierung in 5 Min.",
    "Crédit immobilier reçu": "Immobilienkredit erhalten",
    "Durée de remboursement : 25 ans": "Rückzahlungsdauer: 25 Jahre",
    "Crédit accordé sous 72 h": "Kreditvergabe innerhalb von 72 Std."
  },
  "da": {
    "Demander un crédit": "Anmod om et lån",
    "Validation du compte en 5 min.": "Kontovalidering på 5 min.",
    "Crédit immobilier reçu": "Boliglån modtaget",
    "Durée de remboursement : 25 ans": "Tilbagebetalingsperiode: 25 år",
    "Crédit accordé sous 72 h": "Lån ydet inden for 72 timer"
  },
  "hu": {
    "Demander un crédit": "Hitel igénylése",
    "Validation du compte en 5 min.": "Fiók érvényesítése 5 perc alatt.",
    "Crédit immobilier reçu": "Lakáshitel megérkezett",
    "Durée de remboursement : 25 ans": "Törlesztési idő: 25 év",
    "Crédit accordé sous 72 h": "Hitel jóváhagyva 72 órán belül"
  },
  "hr": {
    "Demander un crédit": "Zatraži kredit",
    "Validation du compte en 5 min.": "Validacija računa u 5 min.",
    "Crédit immobilier reçu": "Stambeni kredit primljen",
    "Durée de remboursement : 25 ans": "Rok otplate: 25 godina",
    "Crédit accordé sous 72 h": "Kredit odobren u roku od 72 sata"
  }
};

langs.forEach(lang => {
    const file = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(file)) {
        const dict = JSON.parse(fs.readFileSync(file, 'utf8'));
        let updated = false;
        
        const toAdd = newStrings[lang];
        if (toAdd) {
            for (const [key, val] of Object.entries(toAdd)) {
                dict[key] = val;
                updated = true;
            }
        }

        if (updated) {
            fs.writeFileSync(file, JSON.stringify(dict, null, 2));
            console.log(`Updated ${lang}.json`);
        }
    }
});
