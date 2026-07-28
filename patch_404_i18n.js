const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend', 'assets', 'locales');
const newKeys = {
  "ERREUR 404": {
    "fr": "ERREUR 404",
    "en": "ERROR 404",
    "es": "ERROR 404",
    "de": "FEHLER 404",
    "da": "FEJL 404",
    "hr": "GREŠKA 404",
    "hu": "404-ES HIBA"
  },
  "Cette page s'est perdue": {
    "fr": "Cette page s'est perdue",
    "en": "This page got lost",
    "es": "Esta página se ha perdido",
    "de": "Diese Seite ist verloren gegangen",
    "da": "Denne side er faret vild",
    "hr": "Ova stranica se izgubila",
    "hu": "Ez az oldal elveszett"
  },
  "en chemin.": {
    "fr": "en chemin.",
    "en": "along the way.",
    "es": "en el camino.",
    "de": "auf dem Weg.",
    "da": "på vejen.",
    "hr": "na putu.",
    "hu": "útközben."
  },
  "La page que vous cherchez n'existe pas ou a été déplacée. Retournez à l'accueil pour reprendre le fil.": {
    "fr": "La page que vous cherchez n'existe pas ou a été déplacée. Retournez à l'accueil pour reprendre le fil.",
    "en": "The page you are looking for does not exist or has been moved. Return to the home page to get back on track.",
    "es": "La página que buscas no existe o ha sido movida. Regresa al inicio para retomar el rumbo.",
    "de": "Die gesuchte Seite existiert nicht oder wurde verschoben. Kehren Sie zur Startseite zurück, um wieder auf den richtigen Weg zu kommen.",
    "da": "Den side du leder efter findes ikke eller er blevet flyttet. Vend tilbage til startsiden for at komme tilbage på sporet.",
    "hr": "Stranica koju tražite ne postoji ili je premještena. Vratite se na početnu stranicu kako biste nastavili.",
    "hu": "A keresett oldal nem található vagy áthelyezték. Térjen vissza a kezdőlapra a folytatáshoz."
  },
  "Retourner à l'accueil": {
    "fr": "Retourner à l'accueil",
    "en": "Return to home",
    "es": "Volver al inicio",
    "de": "Zurück zur Startseite",
    "da": "Tilbage til forsiden",
    "hr": "Povratak na početnu",
    "hu": "Vissza a kezdőlapra"
  }
};

const langs = ['fr', 'en', 'es', 'de', 'da', 'hr', 'hu'];

langs.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const key in newKeys) {
      data[key] = newKeys[key][lang];
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}.json`);
  }
});
