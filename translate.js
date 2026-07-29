const fs = require('fs');
const path = require('path');

const translations = {
  'en': {
    'Date de naissance': 'Date of birth',
    'Nationalité': 'Nationality',
    'Code...': 'Code...',
    'Europe': 'Europe',
    'Amérique du Sud': 'South America',
    'Sélectionnez...': 'Select...',
    'Française': 'French', 'Belge': 'Belgian', 'Suisse': 'Swiss', 'Espagnole': 'Spanish', 'Italienne': 'Italian', 'Allemande': 'German', 'Portugaise': 'Portuguese', 'Britannique': 'British',
    'Brésilienne': 'Brazilian', 'Argentine': 'Argentine', 'Colombienne': 'Colombian', 'Chilienne': 'Chilean', 'Péruvienne': 'Peruvian', 'Vénézuélienne': 'Venezuelan', 'Équatorienne': 'Ecuadorian', 'Bolivienne': 'Bolivian', 'Paraguayenne': 'Paraguayan', 'Uruguayenne': 'Uruguayan'
  },
  'es': {
    'Date de naissance': 'Fecha de nacimiento',
    'Nationalité': 'Nacionalidad',
    'Code...': 'Código...',
    'Europe': 'Europa',
    'Amérique du Sud': 'América del Sur',
    'Sélectionnez...': 'Seleccione...',
    'Française': 'Francesa', 'Belge': 'Belga', 'Suisse': 'Suiza', 'Espagnole': 'Española', 'Italienne': 'Italiana', 'Allemande': 'Alemana', 'Portugaise': 'Portuguesa', 'Britannique': 'Británica',
    'Brésilienne': 'Brasileña', 'Argentine': 'Argentina', 'Colombienne': 'Colombiana', 'Chilienne': 'Chilena', 'Péruvienne': 'Peruana', 'Vénézuélienne': 'Venezolana', 'Équatorienne': 'Ecuatoriana', 'Bolivienne': 'Boliviana', 'Paraguayenne': 'Paraguaya', 'Uruguayenne': 'Uruguaya'
  },
  'de': {
    'Date de naissance': 'Geburtsdatum',
    'Nationalité': 'Nationalität',
    'Code...': 'Code...',
    'Europe': 'Europa',
    'Amérique du Sud': 'Südamerika',
    'Sélectionnez...': 'Wählen...',
    'Française': 'Französisch', 'Belge': 'Belgisch', 'Suisse': 'Schweizerisch', 'Espagnole': 'Spanisch', 'Italienne': 'Italienisch', 'Allemande': 'Deutsch', 'Portugaise': 'Portugiesisch', 'Britannique': 'Britisch',
    'Brésilienne': 'Brasilianisch', 'Argentine': 'Argentinisch', 'Colombienne': 'Kolumbianisch', 'Chilienne': 'Chilenisch', 'Péruvienne': 'Peruanisch', 'Vénézuélienne': 'Venezolanisch', 'Équatorienne': 'Ecuadorianisch', 'Bolivienne': 'Bolivianisch', 'Paraguayenne': 'Paraguayisch', 'Uruguayenne': 'Uruguayisch'
  },
  'da': {
    'Date de naissance': 'Fødselsdato',
    'Nationalité': 'Nationalitet',
    'Code...': 'Kode...',
    'Europe': 'Europa',
    'Amérique du Sud': 'Sydamerika',
    'Sélectionnez...': 'Vælg...',
    'Française': 'Fransk', 'Belge': 'Belgisk', 'Suisse': 'Schweizisk', 'Espagnole': 'Spansk', 'Italienne': 'Italiensk', 'Allemande': 'Tysk', 'Portugaise': 'Portugisisk', 'Britannique': 'Britisk',
    'Brésilienne': 'Brasiliansk', 'Argentine': 'Argentinsk', 'Colombienne': 'Colombiansk', 'Chilienne': 'Chilensk', 'Péruvienne': 'Peruviansk', 'Vénézuélienne': 'Venezuelansk', 'Équatorienne': 'Ecuadoriansk', 'Bolivienne': 'Boliviansk', 'Paraguayenne': 'Paraguayansk', 'Uruguayenne': 'Uruguayansk'
  },
  'hu': {
    'Date de naissance': 'Születési dátum',
    'Nationalité': 'Állampolgárság',
    'Code...': 'Kód...',
    'Europe': 'Európa',
    'Amérique du Sud': 'Dél-Amerika',
    'Sélectionnez...': 'Válasszon...',
    'Française': 'Francia', 'Belge': 'Belga', 'Suisse': 'Svájci', 'Espagnole': 'Spanyol', 'Italienne': 'Olasz', 'Allemande': 'Német', 'Portugaise': 'Portugál', 'Britannique': 'Brit',
    'Brésilienne': 'Brazil', 'Argentine': 'Argentin', 'Colombienne': 'Kolumbiai', 'Chilienne': 'Chilei', 'Péruvienne': 'Perui', 'Vénézuélienne': 'Venezuelai', 'Équatorienne': 'Ecuadori', 'Bolivienne': 'Bolíviai', 'Paraguayenne': 'Paraguayi', 'Uruguayenne': 'Uruguayi'
  },
  'hr': {
    'Date de naissance': 'Datum rođenja',
    'Nationalité': 'Nacionalnost',
    'Code...': 'Kod...',
    'Europe': 'Europa',
    'Amérique du Sud': 'Južna Amerika',
    'Sélectionnez...': 'Odaberite...',
    'Française': 'Francusko', 'Belge': 'Belgijsko', 'Suisse': 'Švicarsko', 'Espagnole': 'Španjolsko', 'Italienne': 'Talijansko', 'Allemande': 'Njemačko', 'Portugaise': 'Portugalsko', 'Britannique': 'Britansko',
    'Brésilienne': 'Brazilsko', 'Argentine': 'Argentinsko', 'Colombienne': 'Kolumbijsko', 'Chilienne': 'Čileansko', 'Péruvienne': 'Peruansko', 'Vénézuélienne': 'Venezuelsko', 'Équatorienne': 'Ekvadorsko', 'Bolivienne': 'Bolivijsko', 'Paraguayenne': 'Paragvajsko', 'Uruguayenne': 'Urugvajsko'
  }
};

const dir = path.join(__dirname, 'frontend', 'assets', 'locales');
for (const lang of Object.keys(translations)) {
  const filePath = path.join(dir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    Object.assign(data, translations[lang]);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${lang}.json`);
  }
}
