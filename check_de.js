const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend', 'assets', 'locales', 'de.json');
const dict = JSON.parse(fs.readFileSync(file, 'utf8'));

const keys = [
  "Les crédits",
  "Un projet à financer ? On a le crédit qu'il faut.",
  "Immobilier, personnel, consommation ou financement de grands projets — Demande en ligne, réponse de principe sous 48h.",
  "Crédit immobilier",
  "Achat, construction ou renégociation.",
  "Taux dès 3,2 %",
  "Crédit personnel",
  "Sans justificatif, libre d'usage.",
  "Taux dès 4,9 %",
  "Crédit consommation",
  "Travaux, véhicule, équipement.",
  "Taux dès 5,4 %",
  "Grands projets",
  "Financement structuré, montant élevé.",
  "Sur dossier"
];

keys.forEach(k => {
  console.log(`"${k}" => "${dict[k]}"`);
});
