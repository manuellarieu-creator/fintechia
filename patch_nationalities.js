const fs = require('fs');
const path = './frontend/assets/locales';
const files = fs.readdirSync(path).filter(f => f.endsWith('.json'));

const translations = {
  'Europe': {
    'fr': 'Europe', 'en': 'Europe', 'es': 'Europa', 'de': 'Europa', 'da': 'Europa', 'hr': 'Europa', 'hu': 'Európa'
  },
  'Amérique du Sud': {
    'fr': 'Amérique du Sud', 'en': 'South America', 'es': 'América del Sur', 'de': 'Südamerika', 'da': 'Sydamerika', 'hr': 'Južna Amerika', 'hu': 'Dél-Amerika'
  },
  'nat_Française': {
    'fr': '🇫🇷 Française', 'en': '🇫🇷 French', 'es': '🇫🇷 Francesa', 'de': '🇫🇷 Französisch', 'da': '🇫🇷 Fransk', 'hr': '🇫🇷 Francusko', 'hu': '🇫🇷 Francia'
  },
  'nat_Belge': {
    'fr': '🇧🇪 Belge', 'en': '🇧🇪 Belgian', 'es': '🇧🇪 Belga', 'de': '🇧🇪 Belgisch', 'da': '🇧🇪 Belgisk', 'hr': '🇧🇪 Belgijsko', 'hu': '🇧🇪 Belga'
  },
  'nat_Suisse': {
    'fr': '🇨🇭 Suisse', 'en': '🇨🇭 Swiss', 'es': '🇨🇭 Suiza', 'de': '🇨🇭 Schweizerisch', 'da': '🇨🇭 Schweizisk', 'hr': '🇨🇭 Švicarsko', 'hu': '🇨🇭 Svájci'
  },
  'nat_Espagnole': {
    'fr': '🇪🇸 Espagnole', 'en': '🇪🇸 Spanish', 'es': '🇪🇸 Española', 'de': '🇪🇸 Spanisch', 'da': '🇪🇸 Spansk', 'hr': '🇪🇸 Španjolsko', 'hu': '🇪🇸 Spanyol'
  },
  'nat_Italienne': {
    'fr': '🇮🇹 Italienne', 'en': '🇮🇹 Italian', 'es': '🇮🇹 Italiana', 'de': '🇮🇹 Italienisch', 'da': '🇮🇹 Italiensk', 'hr': '🇮🇹 Talijansko', 'hu': '🇮🇹 Olasz'
  },
  'nat_Allemande': {
    'fr': '🇩🇪 Allemande', 'en': '🇩🇪 German', 'es': '🇩🇪 Alemana', 'de': '🇩🇪 Deutsch', 'da': '🇩🇪 Tysk', 'hr': '🇩🇪 Njemačko', 'hu': '🇩🇪 Német'
  },
  'nat_Portugaise': {
    'fr': '🇵🇹 Portugaise', 'en': '🇵🇹 Portuguese', 'es': '🇵🇹 Portuguesa', 'de': '🇵🇹 Portugiesisch', 'da': '🇵🇹 Portugisisk', 'hr': '🇵🇹 Portugalsko', 'hu': '🇵🇹 Portugál'
  },
  'nat_Britannique': {
    'fr': '🇬🇧 Britannique', 'en': '🇬🇧 British', 'es': '🇬🇧 Británica', 'de': '🇬🇧 Britisch', 'da': '🇬🇧 Britisk', 'hr': '🇬🇧 Britansko', 'hu': '🇬🇧 Brit'
  },
  'nat_Brésilienne': {
    'fr': '🇧🇷 Brésilienne', 'en': '🇧🇷 Brazilian', 'es': '🇧🇷 Brasileña', 'de': '🇧🇷 Brasilianisch', 'da': '🇧🇷 Brasiliansk', 'hr': '🇧🇷 Brazilsko', 'hu': '🇧🇷 Brazil'
  },
  'nat_Argentine': {
    'fr': '🇦🇷 Argentine', 'en': '🇦🇷 Argentine', 'es': '🇦🇷 Argentina', 'de': '🇦🇷 Argentinisch', 'da': '🇦🇷 Argentinsk', 'hr': '🇦🇷 Argentinsko', 'hu': '🇦🇷 Argentin'
  },
  'nat_Colombienne': {
    'fr': '🇨🇴 Colombienne', 'en': '🇨🇴 Colombian', 'es': '🇨🇴 Colombiana', 'de': '🇨🇴 Kolumbianisch', 'da': '🇨🇴 Colombiansk', 'hr': '🇨🇴 Kolumbijsko', 'hu': '🇨🇴 Kolumbiai'
  },
  'nat_Chilienne': {
    'fr': '🇨🇱 Chilienne', 'en': '🇨🇱 Chilean', 'es': '🇨🇱 Chilena', 'de': '🇨🇱 Chilenisch', 'da': '🇨🇱 Chilensk', 'hr': '🇨🇱 Čileansko', 'hu': '🇨🇱 Chilei'
  },
  'nat_Péruvienne': {
    'fr': '🇵🇪 Péruvienne', 'en': '🇵🇪 Peruvian', 'es': '🇵🇪 Peruana', 'de': '🇵🇪 Peruanisch', 'da': '🇵🇪 Peruansk', 'hr': '🇵🇪 Peruansko', 'hu': '🇵🇪 Perui'
  },
  'nat_Vénézuélienne': {
    'fr': '🇻🇪 Vénézuélienne', 'en': '🇻🇪 Venezuelan', 'es': '🇻🇪 Venezolana', 'de': '🇻🇪 Venezolanisch', 'da': '🇻🇪 Venezuelansk', 'hr': '🇻🇪 Venezuelansko', 'hu': '🇻🇪 Venezuelai'
  },
  'nat_Équatorienne': {
    'fr': '🇪🇨 Équatorienne', 'en': '🇪🇨 Ecuadorian', 'es': '🇪🇨 Ecuatoriana', 'de': '🇪🇨 Ecuadorianisch', 'da': '🇪🇨 Ecuadoriansk', 'hr': '🇪🇨 Ekvadorsko', 'hu': '🇪🇨 Ecuadori'
  },
  'nat_Bolivienne': {
    'fr': '🇧🇴 Bolivienne', 'en': '🇧🇴 Bolivian', 'es': '🇧🇴 Boliviana', 'de': '🇧🇴 Bolivianisch', 'da': '🇧🇴 Boliviansk', 'hr': '🇧🇴 Bolivijsko', 'hu': '🇧🇴 Bolíviai'
  },
  'nat_Paraguayenne': {
    'fr': '🇵🇾 Paraguayenne', 'en': '🇵🇾 Paraguayan', 'es': '🇵🇾 Paraguaya', 'de': '🇵🇾 Paraguayisch', 'da': '🇵🇾 Paraguayansk', 'hr': '🇵🇾 Paragvajsko', 'hu': '🇵🇾 Paraguayi'
  },
  'nat_Uruguayenne': {
    'fr': '🇺🇾 Uruguayenne', 'en': '🇺🇾 Uruguayan', 'es': '🇺🇾 Uruguaya', 'de': '🇺🇾 Uruguayisch', 'da': '🇺🇾 Uruguayansk', 'hr': '🇺🇾 Urugvajsko', 'hu': '🇺🇾 Uruguayi'
  }
};

files.forEach(f => {
  const lang = f.split('.')[0];
  const filePath = path + '/' + f;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  for (const [key, langs] of Object.entries(translations)) {
    data[key] = langs[lang] || langs['en'] || langs['fr'];
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log('Updated ' + f);
});

// Update app.html
let appFile = './frontend/pages/app.html';
let appHtml = fs.readFileSync(appFile, 'utf8');

appHtml = appHtml.replace(/<optgroup label="Europe">/, '<optgroup label="Europe" data-i18n="Europe">');
appHtml = appHtml.replace(/<optgroup label="Amérique du Sud">/, '<optgroup label="Amérique du Sud" data-i18n="Amérique du Sud">');

const flags = [
  'Française', 'Belge', 'Suisse', 'Espagnole', 'Italienne', 'Allemande', 'Portugaise', 'Britannique',
  'Brésilienne', 'Argentine', 'Colombienne', 'Chilienne', 'Péruvienne', 'Vénézuélienne', 'Équatorienne',
  'Bolivienne', 'Paraguayenne', 'Uruguayenne'
];

flags.forEach(f => {
  const regex = new RegExp('<option value="' + f + '">([^<]+)<\/option>', 'g');
  appHtml = appHtml.replace(regex, '<option value="' + f + '" data-i18n="nat_' + f + '">$1</option>');
});

fs.writeFileSync(appFile, appHtml);
console.log('Updated app.html');
