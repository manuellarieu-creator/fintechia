const fs = require('fs');
const path = 'update_locales.js';
let content = fs.readFileSync(path, 'utf8');

const newTranslations = {
  'da': {
    'Code PIN': 'PIN-kode',
    'Modifiez votre code PIN de connexion (6 chiffres)': 'Skift din login PIN-kode (6 cifre)',
    'Code PIN actuel': 'Nuværende PIN-kode',
    'Nouveau code PIN': 'Ny PIN-kode',
    'Confirmer nouveau PIN': 'Bekræft ny PIN-kode',
    'Mettre à jour le code PIN': 'Opdater PIN-kode',
    'Succès !': 'Succes!',
    'Oups !': 'Hov!',
    'Attention': 'Opmærksomhed'
  },
  'de': {
    'Code PIN': 'PIN-Code',
    'Modifiez votre code PIN de connexion (6 chiffres)': 'Ändern Sie Ihren Anmelde-PIN-Code (6 Ziffern)',
    'Code PIN actuel': 'Aktueller PIN-Code',
    'Nouveau code PIN': 'Neuer PIN-Code',
    'Confirmer nouveau PIN': 'Neuen PIN-Code bestätigen',
    'Mettre à jour le code PIN': 'PIN-Code aktualisieren',
    'Succès !': 'Erfolg!',
    'Oups !': 'Hoppla!',
    'Attention': 'Achtung'
  },
  'en': {
    'Code PIN': 'PIN Code',
    'Modifiez votre code PIN de connexion (6 chiffres)': 'Change your login PIN code (6 digits)',
    'Code PIN actuel': 'Current PIN code',
    'Nouveau code PIN': 'New PIN code',
    'Confirmer nouveau PIN': 'Confirm new PIN code',
    'Mettre à jour le code PIN': 'Update PIN code',
    'Succès !': 'Success!',
    'Oups !': 'Oops!',
    'Attention': 'Warning'
  },
  'es': {
    'Code PIN': 'Código PIN',
    'Modifiez votre code PIN de connexion (6 chiffres)': 'Cambie su código PIN de inicio de sesión (6 dígitos)',
    'Code PIN actuel': 'Código PIN actual',
    'Nouveau code PIN': 'Nuevo código PIN',
    'Confirmer nouveau PIN': 'Confirmar nuevo código PIN',
    'Mettre à jour le code PIN': 'Actualizar código PIN',
    'Succès !': '¡Éxito!',
    'Oups !': '¡Ups!',
    'Attention': 'Atención'
  },
  'fr': {
    'Code PIN': 'Code PIN',
    'Modifiez votre code PIN de connexion (6 chiffres)': 'Modifiez votre code PIN de connexion (6 chiffres)',
    'Code PIN actuel': 'Code PIN actuel',
    'Nouveau code PIN': 'Nouveau code PIN',
    'Confirmer nouveau PIN': 'Confirmer nouveau PIN',
    'Mettre à jour le code PIN': 'Mettre à jour le code PIN',
    'Succès !': 'Succès !',
    'Oups !': 'Oups !',
    'Attention': 'Attention'
  },
  'hr': {
    'Code PIN': 'PIN kod',
    'Modifiez votre code PIN de connexion (6 chiffres)': 'Promijenite svoj PIN kod za prijavu (6 znamenki)',
    'Code PIN actuel': 'Trenutni PIN kod',
    'Nouveau code PIN': 'Novi PIN kod',
    'Confirmer nouveau PIN': 'Potvrdite novi PIN kod',
    'Mettre à jour le code PIN': 'Ažuriraj PIN kod',
    'Succès !': 'Uspjeh!',
    'Oups !': 'Ups!',
    'Attention': 'Upozorenje'
  },
  'hu': {
    'Code PIN': 'PIN kód',
    'Modifiez votre code PIN de connexion (6 chiffres)': 'Módosítsa a bejelentkezési PIN kódját (6 számjegy)',
    'Code PIN actuel': 'Jelenlegi PIN kód',
    'Nouveau code PIN': 'Új PIN kód',
    'Confirmer nouveau PIN': 'Új PIN kód megerősítése',
    'Mettre à jour le code PIN': 'PIN kód frissítése',
    'Succès !': 'Siker!',
    'Oups !': 'Hoppá!',
    'Attention': 'Figyelem'
  }
};

for (let lang in newTranslations) {
  let langBlock = newTranslations[lang];
  let newLines = Object.keys(langBlock).map(k => `    "${k}": "${langBlock[k]}"`).join(',\n');
  
  let regex = new RegExp(`("${lang}":\\s*{[^}]+)`, 'g');
  content = content.replace(regex, `$1,\n${newLines}`);
}

fs.writeFileSync(path, content, 'utf8');
console.log('update_locales.js patched for PIN and success strings');
