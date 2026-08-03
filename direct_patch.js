const fs = require('fs');
const path = require('path');

const localesDir = 'frontend/assets/locales';

const translations = {
  "da": {
    "Profil mis à jour avec succès !": "Profil opdateret med succes!",
    "Erreur lors de la mise à jour du profil": "Fejl ved opdatering af profil",
    "Paramètres de sécurité mis à jour": "Sikkerhedsindstillinger opdateret",
    "Mot de passe mis à jour": "Adgangskode opdateret",
    "Code PIN mis à jour avec succès": "PIN-kode opdateret",
    "Préférences de notifications enregistrées": "Notifikationspræferencer gemt",
    "Plafonds mis à jour avec succès": "Grænser opdateret med succes",
    "Paramètres de virements mis à jour": "Overførselsindstillinger opdateret",
    "Préférences d'apparence appliquées": "Udseendepræferencer anvendt",
    "Préférences de confidentialité enregistrées": "Privatlivspræferencer gemt",
    "Notification": "Notification",
    "Succès !": "Succes!"
  },
  "de": {
    "Profil mis à jour avec succès !": "Profil erfolgreich aktualisiert!",
    "Erreur lors de la mise à jour du profil": "Fehler beim Aktualisieren des Profils",
    "Paramètres de sécurité mis à jour": "Sicherheitseinstellungen aktualisiert",
    "Mot de passe mis à jour": "Passwort aktualisiert",
    "Code PIN mis à jour avec succès": "PIN-Code erfolgreich aktualisiert",
    "Préférences de notifications enregistrées": "Benachrichtigungseinstellungen gespeichert",
    "Plafonds mis à jour avec succès": "Limits erfolgreich aktualisiert",
    "Paramètres de virements mis à jour": "Überweisungseinstellungen aktualisiert",
    "Préférences d'apparence appliquées": "Erscheinungsbildeinstellungen angewendet",
    "Préférences de confidentialité enregistrées": "Datenschutzeinstellungen gespeichert",
    "Notification": "Benachrichtigung",
    "Succès !": "Erfolg!"
  },
  "en": {
    "Profil mis à jour avec succès !": "Profile successfully updated!",
    "Erreur lors de la mise à jour du profil": "Error updating profile",
    "Paramètres de sécurité mis à jour": "Security settings updated",
    "Mot de passe mis à jour": "Password updated",
    "Code PIN mis à jour avec succès": "PIN code successfully updated",
    "Préférences de notifications enregistrées": "Notification preferences saved",
    "Plafonds mis à jour avec succès": "Limits successfully updated",
    "Paramètres de virements mis à jour": "Transfer settings updated",
    "Préférences d'apparence appliquées": "Appearance preferences applied",
    "Préférences de confidentialité enregistrées": "Privacy preferences saved",
    "Notification": "Notification",
    "Succès !": "Success!"
  },
  "es": {
    "Profil mis à jour avec succès !": "¡Perfil actualizado con éxito!",
    "Erreur lors de la mise à jour du profil": "Error al actualizar el perfil",
    "Paramètres de sécurité mis à jour": "Configuración de seguridad actualizada",
    "Mot de passe mis à jour": "Contraseña actualizada",
    "Code PIN mis à jour avec succès": "Código PIN actualizado con éxito",
    "Préférences de notifications enregistrées": "Preferencias de notificación guardadas",
    "Plafonds mis à jour avec succès": "Límites actualizados con éxito",
    "Paramètres de virements mis à jour": "Configuración de transferencias actualizada",
    "Préférences d'apparence appliquées": "Preferencias de apariencia aplicadas",
    "Préférences de confidentialité enregistrées": "Preferencias de privacidad guardadas",
    "Notification": "Notificación",
    "Succès !": "¡Éxito!"
  },
  "fr": {
    "Profil mis à jour avec succès !": "Profil mis à jour avec succès !",
    "Erreur lors de la mise à jour du profil": "Erreur lors de la mise à jour du profil",
    "Paramètres de sécurité mis à jour": "Paramètres de sécurité mis à jour",
    "Mot de passe mis à jour": "Mot de passe mis à jour",
    "Code PIN mis à jour avec succès": "Code PIN mis à jour avec succès",
    "Préférences de notifications enregistrées": "Préférences de notifications enregistrées",
    "Plafonds mis à jour avec succès": "Plafonds mis à jour avec succès",
    "Paramètres de virements mis à jour": "Paramètres de virements mis à jour",
    "Préférences d'apparence appliquées": "Préférences d'apparence appliquées",
    "Préférences de confidentialité enregistrées": "Préférences de confidentialité enregistrées",
    "Notification": "Notification",
    "Succès !": "Succès !"
  },
  "hr": {
    "Profil mis à jour avec succès !": "Profil uspješno ažuriran!",
    "Erreur lors de la mise à jour du profil": "Pogreška pri ažuriranju profila",
    "Paramètres de sécurité mis à jour": "Sigurnosne postavke ažurirane",
    "Mot de passe mis à jour": "Lozinka ažurirana",
    "Code PIN mis à jour avec succès": "PIN kod uspješno ažuriran",
    "Préférences de notifications enregistrées": "Postavke obavijesti spremljene",
    "Plafonds mis à jour avec succès": "Ograničenja uspješno ažurirana",
    "Paramètres de virements mis à jour": "Postavke prijenosa ažurirane",
    "Préférences d'apparence appliquées": "Postavke izgleda primijenjene",
    "Préférences de confidentialité enregistrées": "Postavke privatnosti spremljene",
    "Notification": "Obavijest",
    "Succès !": "Uspjeh!"
  },
  "hu": {
    "Profil mis à jour avec succès !": "A profil sikeresen frissítve!",
    "Erreur lors de la mise à jour du profil": "Hiba történt a profil frissítésekor",
    "Paramètres de sécurité mis à jour": "Biztonsági beállítások frissítve",
    "Mot de passe mis à jour": "Jelszó frissítve",
    "Code PIN mis à jour avec succès": "PIN kód sikeresen frissítve",
    "Préférences de notifications enregistrées": "Értesítési beállítások mentve",
    "Plafonds mis à jour avec succès": "Limitek sikeresen frissítve",
    "Paramètres de virements mis à jour": "Átutalási beállítások frissítve",
    "Préférences d'apparence appliquées": "Megjelenési beállítások alkalmazva",
    "Préférences de confidentialité enregistrées": "Adatvédelmi beállítások mentve",
    "Notification": "Értesítés",
    "Succès !": "Siker!"
  }
};

fs.readdirSync(localesDir).forEach(file => {
  if (file.endsWith('.json')) {
    const langCode = path.basename(file, '.json');
    if (translations[langCode]) {
      const filePath = path.join(localesDir, file);
      let json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Inject translations
      Object.assign(json, translations[langCode]);
      
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
      console.log(`Directly updated ${file}`);
    }
  }
});
