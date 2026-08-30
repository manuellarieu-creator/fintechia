const fs = require('fs');
const path = require('path');

const localesDir = path.join('C:\\Users\\ariol\\.gemini\\fintechia', 'frontend', 'assets', 'locales');
const newTranslations = {
  "Code PIN oublié ?": {
    "en": "Forgot PIN code?",
    "es": "¿Olvidó su código PIN?",
    "de": "PIN-Code vergessen?",
    "da": "Glemt PIN-kode?",
    "hu": "Elfelejtette a PIN kódját?",
    "hr": "Zaboravili ste PIN kod?",
    "fr": "Code PIN oublié ?"
  },
  "Veuillez confirmer vos identifiants pour démarrer la récupération.": {
    "en": "Please confirm your credentials to start the recovery.",
    "es": "Por favor, confirme sus credenciales para iniciar la recuperación.",
    "de": "Bitte bestätigen Sie Ihre Anmeldeinformationen, um die Wiederherstellung zu starten.",
    "da": "Bekræft venligst dine legitimationsoplysninger for at starte gendannelsen.",
    "hu": "Kérjük, erősítse meg hitelesítő adatait a helyreállítás megkezdéséhez.",
    "hr": "Molimo potvrdite svoje vjerodajnice za pokretanje oporavka.",
    "fr": "Veuillez confirmer vos identifiants pour démarrer la récupération."
  },
  "Adresse Email": {
    "en": "Email address",
    "es": "Dirección de correo electrónico",
    "de": "E-Mail-Adresse",
    "da": "E-mail adresse",
    "hu": "E-mail cím",
    "hr": "Adresa e-pošte",
    "fr": "Adresse Email"
  },
  "Pour des raisons de sécurité, veuillez fournir vos documents.": {
    "en": "For security reasons, please provide your documents.",
    "es": "Por razones de seguridad, proporcione sus documentos.",
    "de": "Aus Sicherheitsgründen stellen Sie bitte Ihre Dokumente zur Verfügung.",
    "da": "Af sikkerhedsmæssige årsager bedes du fremlægge dine dokumenter.",
    "hu": "Biztonsági okokból kérjük, adja meg dokumentumait.",
    "hr": "Iz sigurnosnih razloga, molimo priložite svoje dokumente.",
    "fr": "Pour des raisons de sécurité, veuillez fournir vos documents."
  },
  "Pièce d'identité (Recto)": {
    "en": "ID document (Front)",
    "es": "Documento de identidad (Anverso)",
    "de": "Ausweisdokument (Vorderseite)",
    "da": "ID-dokument (Forside)",
    "hu": "Személyazonosító okmány (Előlap)",
    "hr": "Osobni dokument (Prednja strana)",
    "fr": "Pièce d'identité (Recto)"
  },
  "Pièce d'identité (Verso)": {
    "en": "ID document (Back)",
    "es": "Documento de identidad (Reverso)",
    "de": "Ausweisdokument (Rückseite)",
    "da": "ID-dokument (Bagside)",
    "hu": "Személyazonosító okmány (Hátlap)",
    "hr": "Osobni dokument (Stražnja strana)",
    "fr": "Pièce d'identité (Verso)"
  },
  "Selfie vidéo": {
    "en": "Video selfie",
    "es": "Selfie en vídeo",
    "de": "Video-Selfie",
    "da": "Video selfie",
    "hu": "Videó szelfi",
    "hr": "Video selfie",
    "fr": "Selfie vidéo"
  },
  "Enregistrer la vidéo": {
    "en": "Record video",
    "es": "Grabar vídeo",
    "de": "Video aufnehmen",
    "da": "Optag video",
    "hu": "Videó rögzítése",
    "hr": "Snimi video",
    "fr": "Enregistrer la vidéo"
  },
  "Soumettre et recevoir mon PIN": {
    "en": "Submit and receive my PIN",
    "es": "Enviar y recibir mi PIN",
    "de": "Senden und meinen PIN erhalten",
    "da": "Indsend og modtag min PIN-kode",
    "hu": "Beküldés és a PIN kódom fogadása",
    "hr": "Pošalji i primi moj PIN",
    "fr": "Soumettre et recevoir mon PIN"
  },
  "PIN Envoyé": {
    "en": "PIN Sent",
    "es": "PIN Enviado",
    "de": "PIN gesendet",
    "da": "PIN sendt",
    "hu": "PIN elküldve",
    "hr": "PIN poslan",
    "fr": "PIN Envoyé"
  },
  "Vos documents ont été reçus. Un code PIN provisoire a été envoyé à votre adresse email.": {
    "en": "Your documents have been received. A temporary PIN code has been sent to your email address.",
    "es": "Sus documentos han sido recibidos. Se ha enviado un código PIN temporal a su dirección de correo electrónico.",
    "de": "Ihre Dokumente wurden empfangen. Ein temporärer PIN-Code wurde an Ihre E-Mail-Adresse gesendet.",
    "da": "Dine dokumenter er modtaget. En midlertidig PIN-kode er sendt til din e-mailadresse.",
    "hu": "Dokumentumait megkaptuk. Egy ideiglenes PIN kódot küldtünk e-mail címére.",
    "hr": "Vaši dokumenti su primljeni. Privremeni PIN kod poslan je na vašu adresu e-pošte.",
    "fr": "Vos documents ont été reçus. Un code PIN provisoire a été envoyé à votre adresse email."
  },
  "Retour à la connexion": {
    "en": "Back to login",
    "es": "Volver al inicio de sesión",
    "de": "Zurück zur Anmeldung",
    "da": "Tilbage til login",
    "hu": "Vissza a bejelentkezéshez",
    "hr": "Natrag na prijavu",
    "fr": "Retour à la connexion"
  }
};

const files = fs.readdirSync(localesDir);
files.forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.replace('.json', '');
    const filepath = path.join(localesDir, file);
    const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    let added = 0;
    for (const [key, trans] of Object.entries(newTranslations)) {
      if (!content[key]) {
        content[key] = trans[lang] || key;
        added++;
      }
    }
    
    if (added > 0) {
      fs.writeFileSync(filepath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`Added ${added} translations to ${file}`);
    }
  }
});
