const fs = require('fs');

const path = 'update_locales.js';
let content = fs.readFileSync(path, 'utf8');

const newTranslations = {
  'da': {
    'Notification': 'Notification',
    'Session expirée pour inactivité.': 'Session udløbet på grund af inaktivitet.',
    'Compris': 'Forstået'
  },
  'de': {
    'Notification': 'Benachrichtigung',
    'Session expirée pour inactivité.': 'Sitzung wegen Inaktivität abgelaufen.',
    'Compris': 'Verstanden'
  },
  'en': {
    'Notification': 'Notification',
    'Session expirée pour inactivité.': 'Session expired due to inactivity.',
    'Compris': 'Got it'
  },
  'es': {
    'Notification': 'Notificación',
    'Session expirée pour inactivité.': 'Sesión caducada por inactividad.',
    'Compris': 'Entendido'
  },
  'fr': {
    'Notification': 'Notification',
    'Session expirée pour inactivité.': 'Session expirée pour inactivité.',
    'Compris': 'Compris'
  },
  'hr': {
    'Notification': 'Obavijest',
    'Session expirée pour inactivité.': 'Sesija je istekla zbog neaktivnosti.',
    'Compris': 'Razumijem'
  },
  'hu': {
    'Notification': 'Értesítés',
    'Session expirée pour inactivité.': 'A munkamenet inaktivitás miatt lejárt.',
    'Compris': 'Értem'
  }
};

for (let lang in newTranslations) {
  let langBlock = newTranslations[lang];
  let newLines = Object.keys(langBlock).map(k => `    "${k}": "${langBlock[k]}"`).join(',\n');
  
  let regex = new RegExp(`("${lang}":\\s*{[^}]+)`, 'g');
  content = content.replace(regex, `$1,\n${newLines}`);
}

fs.writeFileSync(path, content, 'utf8');
console.log('update_locales.js patched for notification strings');
