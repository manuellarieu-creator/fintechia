const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend', 'assets', 'locales', 'de.json');
const dict = JSON.parse(fs.readFileSync(file, 'utf8'));

const corrections = {
  "Les crédits": "Kredite",
  "Un projet à financer ? On a le crédit qu'il faut.": "Ein Projekt zu finanzieren? Wir haben den passenden Kredit.",
  "Immobilier, personnel, consommation ou financement de grands projets — Demande en ligne, réponse de principe sous 48h.": "Immobilien, Privatkredit, Konsum oder Finanzierung von Großprojekten — Online-Antrag, vorläufige Zusage innerhalb von 48 Stunden.",
  "Crédit immobilier": "Immobilienkredit",
  "Achat, construction ou renégociation.": "Kauf, Bau oder Umschuldung.",
  "Taux dès 3,2 %": "Zins ab 3,2 %",
  "Crédit personnel": "Privatkredit",
  "Sans justificatif, libre d'usage.": "Ohne Verwendungszweck, zur freien Verfügung.",
  "Taux dès 4,9 %": "Zins ab 4,9 %",
  "Crédit consommation": "Konsumkredit",
  "Travaux, véhicule, équipement.": "Renovierung, Fahrzeug, Ausstattung.",
  "Taux dès 5,4 %": "Zins ab 5,4 %",
  "Grands projets": "Großprojekte",
  "Financement structuré, montant élevé.": "Strukturierte Finanzierung, hoher Betrag.",
  "Sur dossier": "Auf Anfrage",
  "Simulateur de mensualité": "Ratenrechner",
  "Montant emprunté": "Darlehensbetrag",
  "Durée": "Laufzeit",
  "120 mois": "120 Monate",
  "Mensualité estimée": "Geschätzte monatliche Rate",
  "(taux indicatif 3,9 %)": "(Richtzins 3,9 %)",
  "Faire une demande de crédit": "Einen Kredit beantragen"
};

for (const [key, val] of Object.entries(corrections)) {
    dict[key] = val;
}

fs.writeFileSync(file, JSON.stringify(dict, null, 2));
console.log('de.json updated successfully.');
