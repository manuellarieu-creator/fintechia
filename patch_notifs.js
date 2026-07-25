const fs = require('fs');
const path = require('path');

function insertNotification(file, findText, notifCode) {
    const filePath = path.join(__dirname, 'backend', 'routes', file);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes("const notificationsService")) {
        content = "const notificationsService = require('../services/notifications');\n" + content;
    }
    
    if (content.includes(notifCode)) return; // Already patched
    
    const parts = content.split(findText);
    if (parts.length > 1) {
        content = parts[0] + findText + "\n        " + notifCode + parts[1];
        fs.writeFileSync(filePath, content);
        console.log(`Patched ${file}`);
    }
}

// 1. In auth.js: notify Admin when a new user registers
insertNotification('auth.js', 
    "res.status(201).json({ message: 'Utilisateur créé avec succès', token, kycLink });", 
    "notificationsService.envoyer(null, 'Nouvelle inscription', `Un nouveau client (${email}) vient de s\\'inscrire.`);"
);

// 2. In kyc.js: notify Admin when KYC is submitted
insertNotification('kyc.js',
    "res.status(201).json({ success: true, message: 'Dossier soumis avec succès', id: result.insertId });",
    "notificationsService.envoyer(null, 'Dossier KYC soumis', `Le client ID ${userId} a soumis ses documents KYC.`);\n        notificationsService.envoyer(userId, 'Dossier soumis', `Vos documents ont été reçus et sont en cours d\\'analyse.`);"
);

// 3. In admin.js (Update KYC status): notify User when KYC is validated or rejected
insertNotification('admin.js',
    "await db.query('UPDATE kyc_documents SET statut = ? WHERE user_id = ?', [statut, userId]);",
    "if (statut === 'valide') notificationsService.envoyer(userId, 'Identité vérifiée', 'Votre compte a été validé avec succès !');\n        if (statut === 'rejete') notificationsService.envoyer(userId, 'Vérification rejetée', 'Vos documents ont été rejetés. Veuillez les soumettre à nouveau.');"
);

// 4. In credits.js: notify Admin when new credit is requested
insertNotification('credits.js',
    "res.status(201).json({ message: 'Demande de crédit soumise avec succès' });",
    "notificationsService.envoyer(null, 'Nouvelle demande de crédit', `Une demande de crédit de ${montant}€ a été soumise par le client ID ${userId}.`);\n        notificationsService.envoyer(userId, 'Demande de crédit reçue', `Votre demande de crédit de ${montant}€ a bien été enregistrée.`);"
);

// 5. In transactions.js: notify User when transaction is successful
// Actually, I'll search for 'Transaction réussie'
insertNotification('transactions.js',
    "res.json({ success: true, message: 'Virement effectué avec succès' });",
    "notificationsService.envoyer(userId, 'Virement émis', `Votre virement de ${montant}€ vers ${destinataire} a été effectué.`);"
);

console.log("All patches applied.");
