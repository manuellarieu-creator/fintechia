const fs = require('fs');

const path = 'update_locales.js';
let content = fs.readFileSync(path, 'utf8');

const newTranslations = {
  'da': {
    'Code envoyé au': 'Kode sendt til',
    'Code envoyé à': 'Kode sendt til'
  },
  'de': {
    'Code envoyé au': 'Code gesendet an',
    'Code envoyé à': 'Code gesendet an'
  },
  'en': {
    'Code envoyé au': 'Code sent to',
    'Code envoyé à': 'Code sent to'
  },
  'es': {
    'Code envoyé au': 'Código enviado al',
    'Code envoyé à': 'Código enviado a'
  },
  'fr': {
    'Code envoyé au': 'Code envoyé au',
    'Code envoyé à': 'Code envoyé à'
  },
  'hr': {
    'Code envoyé au': 'Kod poslan na',
    'Code envoyé à': 'Kod poslan na'
  },
  'hu': {
    'Code envoyé au': 'Kód elküldve:',
    'Code envoyé à': 'Kód elküldve:'
  }
};

for (let lang in newTranslations) {
  let langBlock = newTranslations[lang];
  let newLines = Object.keys(langBlock).map(k => `    "${k}": "${langBlock[k]}"`).join(',\n');
  
  let regex = new RegExp(`("${lang}":\\s*{[^}]+)`, 'g');
  content = content.replace(regex, `$1,\n${newLines}`);
}

fs.writeFileSync(path, content, 'utf8');
console.log('update_locales.js patched for split strings');
