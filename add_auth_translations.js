const fs = require('fs');
const path = require('path');

const localesDir = path.join('C:\\Users\\ariol\\.gemini\\fintechia', 'frontend', 'assets', 'locales');
const newTranslations = {
  // Login & Onboarding Sidebars
  "Bienvenue sur": { "en": "Welcome to", "es": "Bienvenido a", "de": "Willkommen bei", "da": "Velkommen til", "hu": "Üdvözöljük a", "hr": "Dobrodošli na", "fr": "Bienvenue sur" },
  "Fintechia": { "en": "Fintechia", "es": "Fintechia", "de": "Fintechia", "da": "Fintechia", "hu": "Fintechia", "hr": "Fintechia", "fr": "Fintechia" },
  "Votre banque 100% en ligne,": { "en": "Your 100% online bank,", "es": "Tu banco 100% online,", "de": "Ihre 100%ige Online-Bank,", "da": "Din 100% online bank,", "hu": "Az Ön 100% online bankja,", "hr": "Vaša 100% online banka,", "fr": "Votre banque 100% en ligne," },
  "sécurisée et disponible 24h/24.": { "en": "secure and available 24/7.", "es": "segura y disponible 24/7.", "de": "sicher und 24/7 verfügbar.", "da": "sikker og tilgængelig 24/7.", "hu": "biztonságos és 24/7 elérhető.", "hr": "sigurna i dostupna 24/7.", "fr": "sécurisée et disponible 24h/24." },
  "Connexion sécurisée SSL": { "en": "SSL secure connection", "es": "Conexión segura SSL", "de": "Sichere SSL-Verbindung", "da": "Sikker SSL-forbindelse", "hu": "Biztonságos SSL kapcsolat", "hr": "Sigurna SSL veza", "fr": "Connexion sécurisée SSL" },
  "Double authentification": { "en": "Two-factor authentication", "es": "Autenticación de dos factores", "de": "Zwei-Faktor-Authentifizierung", "da": "Tofaktorgodkendelse", "hu": "Kétfaktoros hitelesítés", "hr": "Dvofaktorska autentifikacija", "fr": "Double authentification" },
  "Données chiffrées": { "en": "Encrypted data", "es": "Datos cifrados", "de": "Verschlüsselte Daten", "da": "Krypterede data", "hu": "Titkosított adatok", "hr": "Šifrirani podaci", "fr": "Données chiffrées" },
  "Connexion": { "en": "Login", "es": "Iniciar sesión", "de": "Anmelden", "da": "Log ind", "hu": "Bejelentkezés", "hr": "Prijava", "fr": "Connexion" },
  "Accédez à votre espace personnel": { "en": "Access your personal space", "es": "Accede a tu espacio personal", "de": "Greifen Sie auf Ihren persönlichen Bereich zu", "da": "Få adgang til dit personlige rum", "hu": "Férjen hozzá személyes teréhez", "hr": "Pristupite svom osobnom prostoru", "fr": "Accédez à votre espace personnel" },
  "ID client": { "en": "Client ID", "es": "ID de cliente", "de": "Kunden-ID", "da": "Kunde-ID", "hu": "Ügyfél-azonosító", "hr": "ID klijenta", "fr": "ID client" },
  "Saisissez votre ID client": { "en": "Enter your Client ID", "es": "Ingrese su ID de cliente", "de": "Geben Sie Ihre Kunden-ID ein", "da": "Indtast dit kunde-ID", "hu": "Adja meg ügyfél-azonosítóját", "hr": "Unesite svoj ID klijenta", "fr": "Saisissez votre ID client" },
  "Rester connecté sur cet appareil": { "en": "Stay logged in on this device", "es": "Mantener la sesión iniciada en este dispositivo", "de": "Auf diesem Gerät angemeldet bleiben", "da": "Forbliv logget ind på denne enhed", "hu": "Maradjon bejelentkezve ezen az eszközön", "hr": "Ostanite prijavljeni na ovom uređaju", "fr": "Rester connecté sur cet appareil" },
  "Pas encore client ?": { "en": "Not a customer yet?", "es": "¿Aún no eres cliente?", "de": "Noch kein Kunde?", "da": "Endnu ikke kunde?", "hu": "Még nem ügyfél?", "hr": "Još niste klijent?", "fr": "Pas encore client ?" },
  "Ouvrir un compte": { "en": "Open an account", "es": "Abrir una cuenta", "de": "Ein Konto eröffnen", "da": "Åbn en konto", "hu": "Számlanyitás", "hr": "Otvorite račun", "fr": "Ouvrir un compte" },
  "Retour à l'accueil": { "en": "Back to home", "es": "Volver al inicio", "de": "Zurück zur Startseite", "da": "Tilbage til forsiden", "hu": "Vissza a főoldalra", "hr": "Povratak na početnu", "fr": "Retour à l'accueil" },
  "fintechia.fr/login": { "en": "fintechia.co/login", "es": "fintechia.co/login", "de": "fintechia.co/login", "da": "fintechia.co/login", "hu": "fintechia.co/login", "hr": "fintechia.co/login", "fr": "fintechia.fr/login" }
};

const files = fs.readdirSync(localesDir);
files.forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.replace('.json', '');
    const filepath = path.join(localesDir, file);
    const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    let added = 0;
    for (const [key, trans] of Object.entries(newTranslations)) {
      // Force overwrite to fix any encoding issues
      content[key] = trans[lang] || key;
      added++;
    }
    
    fs.writeFileSync(filepath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Updated ${added} translations in ${file}`);
  }
});
