const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend', 'assets', 'locales');
const langs = ['en', 'es', 'de', 'da', 'hu', 'hr'];

const translations = {
  "en": {
    "Bonjour,": "Hello,",
    "Date du jour": "Today's date",
    "Page 1": "Page 1",
    "← Précédent": "← Previous",
    "Suivant →": "Next →",
    "Création de carte en cours": "Card creation in progress",
    "Notre équipe finalise la configuration de votre nouvelle carte de paiement Fintechia. Vous y aurez accès dès sa validation.": "Our team is finalizing the configuration of your new Fintechia payment card. You will have access to it as soon as it is validated.",
    "Aucune dépense récente.": "No recent expenses.",
    "Nom": "Name",
    "IBAN": "IBAN",
    "Action": "Action",
    "mois d'historique": "months of history",
    "FORMAT": "FORMAT",
    "ENVOI EMAIL": "SEND EMAIL",
    "Relevé —": "Statement —",
    "En cours": "In progress",
    "Date": "Date",
    "Motif": "Reason",
    "Montant": "Amount",
    "Aucune demande de crédit pour le moment.": "No credit request at the moment.",
    "REVENUS MOIS": "MONTHLY INCOME",
    "DÉPENSES MOIS": "MONTHLY EXPENSES",
    "ÉPARGNE DU MOIS": "MONTHLY SAVINGS",
    "vs préc.": "vs prev.",
    "Obj.": "Goal",
    "Budget envelopes": "Budget envelopes",
    "Mois": "Month",
    "Accueil": "Home",
    "Virements": "Transfers",
    "Cartes": "Cards",
    "Crédits": "Credits",
    "Budget": "Budget",
    "Bénéficiaires": "Beneficiaries",
    "Relevés": "Statements",
    "Aide & Support": "Help & Support",
    "Aucun virement trouvé.": "No transfers found.",
    "Aucun bénéficiaire enregistré.": "No saved beneficiaries.",
    "Aucune dépense.": "No expenses.",
    "Aucune transaction récente.": "No recent transactions.",
    "Tout marquer lu": "Mark all as read",
    "Aucune notification": "No notifications",
    "Détails de l'alerte": "Alert details",
    "Gérer (Détails)": "Manage (Details)",
    "Contacter": "Contact",
    "Rejeté": "Rejected",
    "Validé": "Validated",
    "Incomplet": "Incomplete",
    "Dossier soumis": "File submitted"
  },
  "es": {
    "Bonjour,": "Hola,",
    "Date du jour": "Fecha de hoy",
    "Page 1": "Página 1",
    "← Précédent": "← Anterior",
    "Suivant →": "Siguiente →",
    "Création de carte en cours": "Creación de tarjeta en curso",
    "Notre équipe finalise la configuration de votre nouvelle carte de paiement Fintechia. Vous y aurez accès dès sa validation.": "Nuestro equipo está finalizando la configuración de su nueva tarjeta. Tendrá acceso en cuanto sea validada.",
    "Aucune dépense récente.": "Sin gastos recientes.",
    "Nom": "Nombre",
    "IBAN": "IBAN",
    "Action": "Acción",
    "mois d'historique": "meses de historial",
    "FORMAT": "FORMATO",
    "ENVOI EMAIL": "ENVIAR EMAIL",
    "Relevé —": "Extracto —",
    "En cours": "En curso",
    "Date": "Fecha",
    "Motif": "Motivo",
    "Montant": "Monto",
    "Aucune demande de crédit pour le moment.": "No hay solicitudes de crédito por el momento.",
    "REVENUS MOIS": "INGRESOS DEL MES",
    "DÉPENSES MOIS": "GASTOS DEL MES",
    "ÉPARGNE DU MOIS": "AHORRO DEL MES",
    "vs préc.": "vs ant.",
    "Obj.": "Obj.",
    "Budget envelopes": "Sobres de presupuesto",
    "Mois": "Mes",
    "Accueil": "Inicio",
    "Virements": "Transferencias",
    "Cartes": "Tarjetas",
    "Crédits": "Créditos",
    "Budget": "Presupuesto",
    "Bénéficiaires": "Beneficiarios",
    "Relevés": "Extractos",
    "Aide & Support": "Ayuda y Soporte"
  },
  "de": {
    "Bonjour,": "Hallo,",
    "Date du jour": "Heutiges Datum",
    "Page 1": "Seite 1",
    "← Précédent": "← Zurück",
    "Suivant →": "Weiter →",
    "Création de carte en cours": "Kartenerstellung läuft",
    "Notre équipe finalise la configuration de votre nouvelle carte de paiement Fintechia. Vous y aurez accès dès sa validation.": "Unser Team schließt die Konfiguration Ihrer neuen Karte ab. Sie haben Zugriff darauf, sobald sie validiert ist.",
    "Aucune dépense récente.": "Keine kürzlichen Ausgaben.",
    "Nom": "Name",
    "IBAN": "IBAN",
    "Action": "Aktion",
    "mois d'historique": "Monate Verlauf",
    "FORMAT": "FORMAT",
    "ENVOI EMAIL": "EMAIL SENDEN",
    "Relevé —": "Auszug —",
    "En cours": "In Bearbeitung",
    "Date": "Datum",
    "Motif": "Grund",
    "Montant": "Betrag",
    "Aucune demande de crédit pour le moment.": "Zurzeit keine Kreditanfragen.",
    "REVENUS MOIS": "MONATSEINKOMMEN",
    "DÉPENSES MOIS": "MONATSAUSGABEN",
    "ÉPARGNE DU MOIS": "MONATLICHE ERSPARNISSE",
    "vs préc.": "vs vorh.",
    "Obj.": "Ziel",
    "Budget envelopes": "Budgetumschläge",
    "Mois": "Monat",
    "Accueil": "Startseite",
    "Virements": "Überweisungen",
    "Cartes": "Karten",
    "Crédits": "Kredite",
    "Budget": "Budget",
    "Bénéficiaires": "Begünstigte",
    "Relevés": "Auszüge",
    "Aide & Support": "Hilfe & Support"
  }
};

// Fallback for remaining languages using English if not explicitly set
const translatedDA = {};
const translatedHU = {};
const translatedHR = {};

for (const [fr, en] of Object.entries(translations.en)) {
    translatedDA[fr] = en;
    translatedHU[fr] = en;
    translatedHR[fr] = en;
}

translations.da = translatedDA;
translations.hu = translatedHU;
translations.hr = translatedHR;

langs.forEach(lang => {
    const file = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(file)) {
        const dict = JSON.parse(fs.readFileSync(file, 'utf8'));
        let updated = false;
        
        Object.keys(translations.en).forEach(key => {
            if (!dict[key]) {
                dict[key] = translations[lang] && translations[lang][key] ? translations[lang][key] : translations.en[key];
                updated = true;
            }
        });

        if (updated) {
            fs.writeFileSync(file, JSON.stringify(dict, null, 2));
            console.log(`Updated ${lang}.json`);
        }
    }
});
