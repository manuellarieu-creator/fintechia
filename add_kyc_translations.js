const fs = require('fs');
const path = require('path');

const localesDir = path.join('C:\\Users\\ariol\\.gemini\\fintechia', 'frontend', 'assets', 'locales');
const newTranslations = {
  "Vérification Vidéo (Max 30s)": { "en": "Video Verification (Max 30s)", "es": "Verificación de video (Máx 30s)", "de": "Video-Verifizierung (Max 30s)", "da": "Videobekræftelse (Maks 30s)", "hu": "Videós azonosítás (Max 30mp)", "hr": "Video verifikacija (Maks 30s)", "fr": "Vérification Vidéo (Max 30s)" },
  "Veuillez suivre les instructions à l'écran tout en vous filmant.": { "en": "Please follow the on-screen instructions while filming yourself.", "es": "Siga las instrucciones en pantalla mientras se graba.", "de": "Bitte befolgen Sie die Anweisungen auf dem Bildschirm, während Sie sich filmen.", "da": "Følg venligst instruktionerne på skærmen, mens du filmer dig selv.", "hu": "Kérjük, kövesse a képernyőn megjelenő utasításokat, miközben filmezi magát.", "hr": "Slijedite upute na zaslonu dok se snimate.", "fr": "Veuillez suivre les instructions à l'écran tout en vous filmant." },
  "Annuler": { "en": "Cancel", "es": "Cancelar", "de": "Abbrechen", "da": "Annuller", "hu": "Mégse", "hr": "Odustani", "fr": "Annuler" },
  "Annuller": { "en": "Cancel", "es": "Cancelar", "de": "Abbrechen", "da": "Annuller", "hu": "Mégse", "hr": "Odustani", "fr": "Annuller" }, // Adding the user's typo version just in case
  "Commencer l'enregistrement": { "en": "Start recording", "es": "Comenzar la grabación", "de": "Aufnahme starten", "da": "Start optagelse", "hu": "Felvétel indítása", "hr": "Započni snimanje", "fr": "Commencer l'enregistrement" },
  "Étape 1/3: Tournez la tête en haut puis à droite": { "en": "Step 1/3: Turn your head up then to the right", "es": "Paso 1/3: Gire la cabeza hacia arriba y luego a la derecha", "de": "Schritt 1/3: Drehen Sie den Kopf nach oben, dann nach rechts", "da": "Trin 1/3: Drej hovedet op og derefter til højre", "hu": "1/3. lépés: Fordítsa a fejét felfelé, majd jobbra", "hr": "Korak 1/3: Okrenite glavu prema gore, zatim udesno", "fr": "Étape 1/3: Tournez la tête en haut puis à droite" },
  "Action Suivante": { "en": "Next Action", "es": "Siguiente acción", "de": "Nächste Aktion", "da": "Næste handling", "hu": "Következő művelet", "hr": "Sljedeća radnja", "fr": "Action Suivante" },
  "Étape 2/3: Lisez à voix haute les chiffres : ": { "en": "Step 2/3: Read the numbers aloud: ", "es": "Paso 2/3: Lea los números en voz alta: ", "de": "Schritt 2/3: Lesen Sie die Zahlen laut vor: ", "da": "Trin 2/3: Læs tallene højt: ", "hu": "2/3. lépés: Olvassa fel a számokat: ", "hr": "Korak 2/3: Pročitajte brojeve naglas: ", "fr": "Étape 2/3: Lisez à voix haute les chiffres : " },
  "Vidéo enregistrée avec succès (Prêt à soumettre)": { "en": "Video successfully recorded (Ready to submit)", "es": "Video grabado con éxito (Listo para enviar)", "de": "Video erfolgreich aufgenommen (Bereit zum Senden)", "da": "Video optaget med succes (Klar til at indsende)", "hu": "Videó sikeresen rögzítve (Beküldésre kész)", "hr": "Video uspješno snimljen (Spreman za slanje)", "fr": "Vidéo enregistrée avec succès (Prêt à soumettre)" },
  "Étape 3/3: Dites votre nom, prénom, puis le numéro de la pièce d'identité": { "en": "Step 3/3: Say your last name, first name, then your ID number", "es": "Paso 3/3: Diga su apellido, nombre, luego el número de su identificación", "de": "Schritt 3/3: Sagen Sie Ihren Nachnamen, Vornamen, dann die Nummer des Ausweises", "da": "Trin 3/3: Sig dit efternavn, fornavn, derefter ID-nummeret", "hu": "3/3. lépés: Mondja be a vezetéknevét, keresztnevét, majd a személyi igazolvány számát", "hr": "Korak 3/3: Recite svoje prezime, ime, zatim broj osobne iskaznice", "fr": "Étape 3/3: Dites votre nom, prénom, puis le numéro de la pièce d'identité" },
  "Vérification Vidéo (Selfie)": { "en": "Video Verification (Selfie)", "es": "Verificación de video (Selfie)", "de": "Video-Verifizierung (Selfie)", "da": "Videobekræftelse (Selfie)", "hu": "Videós azonosítás (Szelfi)", "hr": "Video verifikacija (Selfie)", "fr": "Vérification Vidéo (Selfie)" } // From the logs
};

const files = fs.readdirSync(localesDir);
files.forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.replace('.json', '');
    const filepath = path.join(localesDir, file);
    const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    let added = 0;
    for (const [key, trans] of Object.entries(newTranslations)) {
      content[key] = trans[lang] || key;
      added++;
    }
    
    fs.writeFileSync(filepath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Updated ${added} translations in ${file}`);
  }
});
