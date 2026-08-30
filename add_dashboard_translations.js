const fs = require('fs');
const path = require('path');

const localesDir = path.join('C:\\Users\\ariol\\.gemini\\fintechia', 'frontend', 'assets', 'locales');
const newTranslations = {
  "Virement émis": { "en": "Transfer sent", "es": "Transferencia enviada", "de": "Überweisung gesendet", "da": "Overførsel sendt", "hu": "Átutalás elküldve", "hr": "Prijenos poslan" },
  "REVENUS - TOUT TEMPS": { "en": "INCOME - ALL TIME", "es": "INGRESOS - TODO EL TIEMPO", "de": "EINNAHMEN - GESAMTE ZEIT", "da": "INDTÆGT - HELE TIDEN", "hu": "BEVÉTEL - MINDEN IDŐBEN", "hr": "PRIHOD - SVO VRIJEME" },
  "REVENUS — TOUT TEMPS": { "en": "INCOME - ALL TIME", "es": "INGRESOS - TODO EL TIEMPO", "de": "EINNAHMEN - GESAMTE ZEIT", "da": "INDTÆGT - HELE TIDEN", "hu": "BEVÉTEL - MINDEN IDŐBEN", "hr": "PRIHOD - SVO VRIJEME" },
  "+ Nouveau virement ↗": { "en": "+ New transfer ↗", "es": "+ Nueva transferencia ↗", "de": "+ Neue Überweisung ↗", "da": "+ Ny overførsel ↗", "hu": "+ Új átutalás ↗", "hr": "+ Novi prijenos ↗" },
  "Transactions récentes": { "en": "Recent transactions", "es": "Transacciones recientes", "de": "Kürzliche Transaktionen", "da": "Seneste transaktioner", "hu": "Legutóbbi tranzakciók", "hr": "Nedavne transakcije" },
  "Compte Courant": { "en": "Current Account", "es": "Cuenta Corriente", "de": "Girokonto", "da": "Lønkonto", "hu": "Folyószámla", "hr": "Tekući račun" },
  "SOLDE DISPONIBLE": { "en": "AVAILABLE BALANCE", "es": "SALDO DISPONIBLE", "de": "VERFÜGBARES GUTHABEN", "da": "TILGÆNGELIG SALDO", "hu": "ELÉRHETŐ EGYENLEG", "hr": "RASPOLOŽIVO STANJE" },
  "BUDGET MENSUEL": { "en": "MONTHLY BUDGET", "es": "PRESUPUESTO MENSUAL", "de": "MONATLICHES BUDGET", "da": "MÅNEDLIGT BUDGET", "hu": "HAVI KÖLTSÉGVETÉS", "hr": "MJESEČNI PRORAČUN" },
  "Gérer": { "en": "Manage", "es": "Gestionar", "de": "Verwalten", "da": "Administrer", "hu": "Kezelés", "hr": "Upravljaj" },
  "Mes Budgets": { "en": "My Budgets", "es": "Mis Presupuestos", "de": "Meine Budgets", "da": "Mine Budgetter", "hu": "Költségvetéseim", "hr": "Moji proračuni" },
  "Aucune enveloppe budgétaire définie.": { "en": "No budget envelope defined.", "es": "No hay sobre de presupuesto definido.", "de": "Kein Budgetrahmen definiert.", "da": "Ingen budgetramme defineret.", "hu": "Nincs meghatározott költségvetési keret.", "hr": "Nije definirana proračunska omotnica." },
  "Ajouter une enveloppe": { "en": "Add an envelope", "es": "Añadir un sobre", "de": "Einen Rahmen hinzufügen", "da": "Tilføj en ramme", "hu": "Keret hozzáadása", "hr": "Dodaj omotnicu" },
  "Catégorie (ex: Casino)": { "en": "Category (ex: Casino)", "es": "Categoría (ej: Casino)", "de": "Kategorie (z.B. Casino)", "da": "Kategori (f.eks. Casino)", "hu": "Kategória (pl: Kaszinó)", "hr": "Kategorija (npr: Casino)" },
  "Limite (€)": { "en": "Limit (€)", "es": "Límite (€)", "de": "Limit (€)", "da": "Grænse (€)", "hu": "Korlát (€)", "hr": "Ograničenje (€)" },
  "+ Ajouter": { "en": "+ Add", "es": "+ Añadir", "de": "+ Hinzufügen", "da": "+ Tilføj", "hu": "+ Hozzáadás", "hr": "+ Dodaj" },
  "Fermer": { "en": "Close", "es": "Cerrar", "de": "Schließen", "da": "Luk", "hu": "Bezárás", "hr": "Zatvori" },
  "Mes transactions": { "en": "My transactions", "es": "Mis transacciones", "de": "Meine Transaktionen", "da": "Mine transaktioner", "hu": "Tranzakcióim", "hr": "Moje transakcije" },
  "Télécharger historique": { "en": "Download history", "es": "Descargar historial", "de": "Verlauf herunterladen", "da": "Download historik", "hu": "Előzmények letöltése", "hr": "Preuzmi povijest" },
  "Libellé": { "en": "Description", "es": "Descripción", "de": "Beschreibung", "da": "Beskrivelse", "hu": "Leírás", "hr": "Opis" },
  "Catégorie": { "en": "Category", "es": "Categoría", "de": "Kategorie", "da": "Kategori", "hu": "Kategória", "hr": "Kategorija" },
  "Plafonds": { "en": "Limits", "es": "Límites", "de": "Limits", "da": "Grænser", "hu": "Korlátok", "hr": "Ograničenja" },
  "Modifier": { "en": "Edit", "es": "Editar", "de": "Bearbeiten", "da": "Rediger", "hu": "Szerkesztés", "hr": "Uredi" },
  "Paiement mensuel": { "en": "Monthly payment", "es": "Pago mensual", "de": "Monatliche Zahlung", "da": "Månedlig betaling", "hu": "Havi fizetés", "hr": "Mjesečno plaćanje" },
  "Retrait hebdomadaire": { "en": "Weekly withdrawal", "es": "Retiro semanal", "de": "Wöchentliche Abhebung", "da": "Ugentlig udbetaling", "hu": "Heti pénzfelvétel", "hr": "Tjedna isplata" },
  "Actions rapides": { "en": "Quick actions", "es": "Acciones rápidas", "de": "Schnellaktionen", "da": "Hurtige handlinger", "hu": "Gyors műveletek", "hr": "Brze akcije" },
  "Bloquer": { "en": "Block", "es": "Bloquear", "de": "Sperren", "da": "Bloker", "hu": "Blokkolás", "hr": "Blokiraj" },
  "Voir le code": { "en": "View code", "es": "Ver código", "de": "Code anzeigen", "da": "Vis kode", "hu": "Kód megtekintése", "hr": "Pogledaj kod" },
  "Renouveler": { "en": "Renew", "es": "Renovar", "de": "Erneuern", "da": "Forny", "hu": "Megújítás", "hr": "Obnovi" },
  "Résilier": { "en": "Cancel", "es": "Cancelar", "de": "Kündigen", "da": "Opsig", "hu": "Felmondás", "hr": "Otkaži" },
  "Mes Crédits": { "en": "My Credits", "es": "Mis Créditos", "de": "Meine Kredite", "da": "Mine Kreditter", "hu": "Hiteleim", "hr": "Moji Krediti" },
  "Gérez vos demandes de financement.": { "en": "Manage your financing requests.", "es": "Gestione sus solicitudes de financiación.", "de": "Verwalten Sie Ihre Finanzierungsanfragen.", "da": "Administrer dine finansieringsanmodninger.", "hu": "Kezelje finanszírozási kérelmeit.", "hr": "Upravljajte svojim zahtjevima za financiranje." },
  " Nouvelle demande": { "en": " New request", "es": " Nueva solicitud", "de": " Neue Anfrage", "da": " Ny anmodning", "hu": " Új kérelem", "hr": " Novi zahtjev" },
  "Historique des demandes": { "en": "Request history", "es": "Historial de solicitudes", "de": "Anfrageverlauf", "da": "Anmodningshistorik", "hu": "Kérelmek előzményei", "hr": "Povijest zahtjeva" },
  "Suivre ma demande": { "en": "Track my request", "es": "Seguir mi solicitud", "de": "Meine Anfrage verfolgen", "da": "Følg min anmodning", "hu": "Kérelmem nyomon követése", "hr": "Prati moj zahtjev" },
  "Suivez et maîtrisez vos dépenses par catégorie": { "en": "Track and master your expenses by category", "es": "Rastree y controle sus gastos por categoría", "de": "Verfolgen und kontrollieren Sie Ihre Ausgaben nach Kategorie", "da": "Spor og mestr dine udgifter efter kategori", "hu": "Kövesse nyomon és irányítsa kiadásait kategóriánként", "hr": "Pratite i kontrolirajte svoje troškove po kategorijama" },
  " Nouvelle enveloppe": { "en": " New envelope", "es": " Nuevo sobre", "de": " Neuer Rahmen", "da": " Ny ramme", "hu": " Új keret", "hr": " Nova omotnica" },
  "Répartition": { "en": "Distribution", "es": "Distribución", "de": "Verteilung", "da": "Fordeling", "hu": "Eloszlás", "hr": "Raspodjela" },
  "Dernières dépenses": { "en": "Latest expenses", "es": "Últimos gastos", "de": "Letzte Ausgaben", "da": "Seneste udgifter", "hu": "Legutóbbi kiadások", "hr": "Najnoviji troškovi" },
  "Voir tout →": { "en": "See all →", "es": "Ver todo →", "de": "Alle ansehen →", "da": "Se alle →", "hu": "Összes megtekintése →", "hr": "Vidi sve →" },
  "Évolution des dépenses": { "en": "Expense evolution", "es": "Evolución de los gastos", "de": "Ausgabenentwicklung", "da": "Udvikling af udgifter", "hu": "Kiadások alakulása", "hr": "Razvoj troškova" },
  "Année": { "en": "Year", "es": "Año", "de": "Jahr", "da": "År", "hu": "Év", "hr": "Godina" },
  "Enveloppes budgétaires": { "en": "Budget envelopes", "es": "Sobres de presupuesto", "de": "Budgetrahmen", "da": "Budgetrammer", "hu": "Költségvetési keretek", "hr": "Proračunske omotnice" },
  "vs préc.": { "en": "vs prev.", "es": "vs ant.", "de": "vs vorh.", "da": "vs tidl.", "hu": "vs előző", "hr": "vs pret." },
  "Obj. ": { "en": "Target ", "es": "Obj. ", "de": "Ziel ", "da": "Mål ", "hu": "Cél ", "hr": "Cilj " },
  "Mes Bénéficiaires": { "en": "My Beneficiaries", "es": "Mis Beneficiarios", "de": "Meine Begünstigten", "da": "Mine modtagere", "hu": "Kedvezményezettjeim", "hr": "Moji korisnici" },
  "Relevés de compte": { "en": "Account statements", "es": "Estados de cuenta", "de": "Kontoauszüge", "da": "Kontoudtog", "hu": "Számlakivonatok", "hr": "Izvodi računa" },
  "Consultez et téléchargez vos relevés mensuels": { "en": "View and download your monthly statements", "es": "Consulte y descargue sus estados de cuenta mensuales", "de": "Sehen Sie sich Ihre monatlichen Kontoauszüge an und laden Sie sie herunter", "da": "Se og download dine månedlige kontoudtog", "hu": "Tekintse meg és töltse le a havi kivonatokat", "hr": "Pogledajte i preuzmite svoje mjesečne izvode" },
  "Télécharger RIB": { "en": "Download IBAN", "es": "Descargar IBAN", "de": "IBAN herunterladen", "da": "Download IBAN", "hu": "IBAN letöltése", "hr": "Preuzmi IBAN" },
  "Télécharger Relevé": { "en": "Download Statement", "es": "Descargar estado de cuenta", "de": "Kontoauszug herunterladen", "da": "Download kontoudtog", "hu": "Kivonat letöltése", "hr": "Preuzmi izvod" },
  "RELEVÉS DISPO": { "en": "AVAILABLE STATEMENTS", "es": "ESTADOS DISPONIBLES", "de": "VERFÜGBARE KONTOAUSZÜGE", "da": "TILGÆNGELIGE KONTOUDTOG", "hu": "ELÉRHETŐ KIVONATOK", "hr": "DOSTUPNI IZVODI" },
  "PROCHAIN RELEVÉ": { "en": "NEXT STATEMENT", "es": "PRÓXIMO ESTADO", "de": "NÄCHSTER KONTOAUSZUG", "da": "NÆSTE KONTOUDTOG", "hu": "KÖVETKEZŐ KIVONAT", "hr": "SLJEDEĆI IZVOD" },
  "FORMAT": { "en": "FORMAT", "es": "FORMATO", "de": "FORMAT", "da": "FORMAT", "hu": "FORMÁTUM", "hr": "FORMAT" },
  "Historique": { "en": "History", "es": "Historial", "de": "Verlauf", "da": "Historik", "hu": "Előzmények", "hr": "Povijest" },
  "Aperçu PDF": { "en": "PDF Preview", "es": "Vista previa de PDF", "de": "PDF-Vorschau", "da": "PDF-forhåndsvisning", "hu": "PDF előnézet", "hr": "PDF pregled" },
  "Envoi automatique": { "en": "Automatic sending", "es": "Envío automático", "de": "Automatischer Versand", "da": "Automatisk afsendelse", "hu": "Automatikus küldés", "hr": "Automatsko slanje" },
  "Export personnalisé": { "en": "Custom export", "es": "Exportación personalizada", "de": "Benutzerdefinierter Export", "da": "Brugerdefineret eksport", "hu": "Egyéni exportálás", "hr": "Prilagođeni izvoz" },
  "Période": { "en": "Period", "es": "Período", "de": "Zeitraum", "da": "Periode", "hu": "Időszak", "hr": "Razdoblje" },
  "Compte": { "en": "Account", "es": "Cuenta", "de": "Konto", "da": "Konto", "hu": "Fiók", "hr": "Račun" },
  "Générer l'export": { "en": "Generate export", "es": "Generar exportación", "de": "Export generieren", "da": "Generer eksport", "hu": "Exportálás generálása", "hr": "Generiraj izvoz" },
  "Format CSV inclus": { "en": "CSV format included", "es": "Formato CSV incluido", "de": "CSV-Format enthalten", "da": "CSV-format inkluderet", "hu": "CSV formátum mellékelve", "hr": "Uključen CSV format" },
  "Avec le PDF": { "en": "With the PDF", "es": "Con el PDF", "de": "Mit dem PDF", "da": "Med PDF", "hu": "A PDF-fel", "hr": "Uz PDF" },
  "Archivage cloud": { "en": "Cloud archiving", "es": "Archivo en la nube", "de": "Cloud-Archivierung", "da": "Cloud-arkivering", "hu": "Felhő archiválás", "hr": "Arhiviranje u oblaku" },
  "Google Drive": { "en": "Google Drive", "es": "Google Drive", "de": "Google Drive", "da": "Google Drive", "hu": "Google Drive", "hr": "Google Drive" },
  "Email mensuel": { "en": "Monthly email", "es": "Correo electrónico mensual", "de": "Monatliche E-Mail", "da": "Månedlig e-mail", "hu": "Havi e-mail", "hr": "Mjesečni e-mail" },
  "+ CSV disponible": { "en": "+ CSV available", "es": "+ CSV disponible", "de": "+ CSV verfügbar", "da": "+ CSV tilgængelig", "hu": "+ CSV elérhető", "hr": "+ Dostupan CSV" },
  "Nous envoyer un e-mail": { "en": "Send us an email", "es": "Envíanos un correo electrónico", "de": "Senden Sie uns eine E-Mail", "da": "Send os en e-mail", "hu": "Küldjön nekünk egy e-mailt", "hr": "Pošaljite nam e-mail" },
  "Vous pouvez nous écrire directement à ": { "en": "You can write to us directly at ", "es": "Puede escribirnos directamente a ", "de": "Sie können uns direkt schreiben an ", "da": "Du kan skrive direkte til os på ", "hu": "Közvetlenül írhat nekünk a ", "hr": "Možete nam pisati izravno na " },
  " ou utiliser le formulaire ci-dessous.": { "en": " or use the form below.", "es": " o utilizar el formulario de abajo.", "de": " oder das untenstehende Formular nutzen.", "da": " eller bruge formularen nedenfor.", "hu": " vagy használja az alábbi űrlapot.", "hr": " ili upotrijebite obrazac u nastavku." },
  "Sujet": { "en": "Subject", "es": "Asunto", "de": "Betreff", "da": "Emne", "hu": "Tárgy", "hr": "Naslov" },
  "Votre message": { "en": "Your message", "es": "Tu mensaje", "de": "Ihre Nachricht", "da": "Din besked", "hu": "Az Ön üzenete", "hr": "Vaša poruka" },
  "Envoyer le message": { "en": "Send message", "es": "Enviar mensaje", "de": "Nachricht senden", "da": "Send besked", "hu": "Üzenet küldése", "hr": "Pošalji poruku" },
  "Chat en direct": { "en": "Live chat", "es": "Chat en vivo", "de": "Live-Chat", "da": "Live chat", "hu": "Élő chat", "hr": "Chat uživo" },
  "Discutez en temps réel avec un conseiller Fintechia. Notre système reconnaîtra automatiquement votre compte.": { "en": "Chat in real-time with a Fintechia advisor. Our system will automatically recognize your account.", "es": "Chatee en tiempo real con un asesor de Fintechia. Nuestro sistema reconocerá automáticamente su cuenta.", "de": "Chatten Sie in Echtzeit mit einem Fintechia-Berater. Unser System erkennt Ihr Konto automatisch.", "da": "Chat i realtid med en Fintechia-rådgiver. Vores system vil automatisk genkende din konto.", "hu": "Csevegjen valós időben egy Fintechia tanácsadóval. Rendszerünk automatikusan felismeri fiókját.", "hr": "Razgovarajte u stvarnom vremenu s Fintechia savjetnikom. Naš će sustav automatski prepoznati vaš račun." },
  "Ouvrir le Chat Live": { "en": "Open Live Chat", "es": "Abrir el Chat en Vivo", "de": "Live-Chat öffnen", "da": "Åbn live chat", "hu": "Élő chat megnyitása", "hr": "Otvori chat uživo" },
  
  // PIN reset modal
  "Vous avez atteint la limite de 20 connexions avec votre code actuel. Veuillez définir un nouveau code PIN à 6 chiffres pour continuer.": { "en": "You have reached the limit of 20 connections with your current code. Please define a new 6-digit PIN to continue.", "es": "Ha alcanzado el límite de 20 conexiones con su código actual. Defina un nuevo PIN de 6 dígitos para continuar.", "de": "Sie haben das Limit von 20 Verbindungen mit Ihrem aktuellen Code erreicht. Bitte definieren Sie eine neue 6-stellige PIN, um fortzufahren.", "da": "Du har nået grænsen på 20 forbindelser med din nuværende kode. Definer venligst en ny 6-cifret pinkode for at fortsætte.", "hu": "Elérte a jelenlegi kódjával a 20 kapcsolódási korlátot. A folytatáshoz adjon meg egy új, 6 jegyű PIN-kódot.", "hr": "Dostigli ste ograničenje od 20 veza s vašim trenutnim kodom. Molimo definirajte novi 6-znamenkasti PIN za nastavak." },
  "Nouveau code PIN": { "en": "New PIN code", "es": "Nuevo código PIN", "de": "Neue PIN", "da": "Ny pinkode", "hu": "Új PIN kód", "hr": "Novi PIN kod" },
  "Confirmer le nouveau code PIN": { "en": "Confirm the new PIN code", "es": "Confirmar el nuevo código PIN", "de": "Neue PIN bestätigen", "da": "Bekræft den nye pinkode", "hu": "Erősítse meg az új PIN-kódot", "hr": "Potvrdite novi PIN kod" },
  "Valider et se connecter": { "en": "Validate and connect", "es": "Validar y conectar", "de": "Validieren und verbinden", "da": "Valider og forbind", "hu": "Érvényesítés és csatlakozás", "hr": "Potvrdi i spoji se" },
  "Les codes ne correspondent pas.": { "en": "Codes do not match.", "es": "Los códigos no coinciden.", "de": "Die Codes stimmen nicht überein.", "da": "Koderne stemmer ikke overens.", "hu": "A kódok nem egyeznek.", "hr": "Kodovi se ne podudaraju." }
};

const files = fs.readdirSync(localesDir);
files.forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.replace('.json', '');
    const filepath = path.join(localesDir, file);
    const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    let added = 0;
    for (const [key, trans] of Object.entries(newTranslations)) {
      content[key] = trans[lang] || trans['en'] || key;
      // Also add French for consistency
      if (lang === 'fr') content[key] = key;
      added++;
    }
    
    fs.writeFileSync(filepath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Updated ${added} translations in ${file}`);
  }
});
