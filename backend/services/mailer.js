const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Vérification de la configuration SMTP au démarrage
// Vérification supprimée pour éviter les lenteurs au démarrage sur Vercel

async function envoyerResetMdp(email, prenom, lien) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Réinitialisation de votre mot de passe Fintechia',
    text: `Bonjour ${prenom},\n\nVous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur ce lien (valable 1 heure) : ${lien}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #F15A22; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Fintechia</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${prenom},</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${lien}" style="background-color: #F15A22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="color: #B45309; background-color: #FEF3C7; padding: 10px; border-radius: 4px;">Attention : ce lien expirera dans 1 heure.</p>
          <p style="font-size: 0.9em; color: #666; margin-top: 30px;">Si le bouton ne fonctionne pas, copiez ce lien :<br>${lien}</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 0.8em; color: #888;">
          &copy; 2026 Fintechia. Cet email est automatique, merci de ne pas y répondre.
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('[MAILER] Erreur lors de l\'envoi de l\'email de reset:', err);
  }
}

async function envoyerConfirmationMdp(email, prenom, ip) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Votre mot de passe Fintechia a été modifié',
    text: `Bonjour ${prenom},\n\nVotre mot de passe a bien été mis à jour (IP : ${ip}). Si vous n'êtes pas à l'origine de cette action, contactez le support immédiatement.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #F15A22; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Fintechia</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${prenom},</h2>
          <p>Nous vous confirmons que votre mot de passe a été modifié avec succès.</p>
          <div style="background-color: #FEE2E2; border: 1px solid #F87171; padding: 15px; border-radius: 4px; margin-top: 20px;">
            <strong style="color: #B91C1C;">Sécurité :</strong>
            <p style="color: #991B1B; margin-bottom: 0;">Si vous n'êtes pas à l'origine de cette action (IP : ${ip}), veuillez contacter notre support immédiatement.</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('[MAILER] Erreur lors de l\'envoi de l\'email de confirmation:', err);
  }
}

module.exports = {
  envoyerResetMdp,
  envoyerConfirmationMdp
};
