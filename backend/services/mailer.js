const nodemailer = require('nodemailer');

// Fonction pour envoyer un email via l'API REST de Resend (contourne le blocage SMTP de Vercel)
async function sendViaResendAPI(mailOptions) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SMTP_PASSWORD}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: mailOptions.from || process.env.EMAIL_FROM,
        to: mailOptions.to,
        subject: mailOptions.subject,
        text: mailOptions.text,
        html: mailOptions.html
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MAILER] Erreur API Resend:', response.status, errorText);
      throw new Error(`Resend API Error: ${errorText}`);
    }
    return await response.json();
  } catch (err) {
    console.error('[MAILER] Exception lors de l\'appel à Resend API:', err.message);
    throw err;
  }
}

// Fallback: SMTP classique si on n'est pas sur Resend
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

async function sendMailWrapper(mailOptions) {
  // Si c'est resend, on utilise l'API REST pour éviter les timeouts (blocage port 465 sur Vercel)
  if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('resend')) {
    return await sendViaResendAPI(mailOptions);
  }
  return await transporter.sendMail(mailOptions);
}

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
    await sendMailWrapper(mailOptions);
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
    await sendMailWrapper(mailOptions);
  } catch (err) {
    console.error('[MAILER] Erreur lors de l\'envoi de l\'email de confirmation:', err);
  }
}

async function envoyerBienvenue(email, prenom) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Bienvenue chez Fintechia !',
    text: `Bonjour ${prenom},\n\nBienvenue chez Fintechia ! Votre compte a été créé avec succès. Découvrez notre espace client pour gérer vos finances en toute simplicité.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0F1B33; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; color: #4F46E5;">Fintechia</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${prenom}, bienvenue à bord ! 🎉</h2>
          <p>Votre compte Fintechia a été créé avec succès.</p>
          <p>Nous sommes ravis de vous compter parmi nos membres. Vous pouvez dès à présent vous connecter à votre espace client pour consulter votre solde, effectuer des virements et gérer vos cartes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://fintechia.vercel.app'}/login" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Accéder à mon espace</a>
          </div>
        </div>
      </div>
    `
  };
  try { await sendMailWrapper(mailOptions); } catch (e) { console.error(e); }
}

async function envoyerConfirmationVirement(email, prenom, montant, destinataire, reference) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Confirmation de virement Fintechia',
    text: `Virement de ${montant}€ envoyé à ${destinataire}.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0F1B33; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; color: #4F46E5;">Fintechia</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${prenom},</h2>
          <p>Votre virement de <strong>${montant} €</strong> vers <strong>${destinataire}</strong> a bien été initié (Réf: ${reference}).</p>
        </div>
      </div>
    `
  };
  try { await sendMailWrapper(mailOptions); } catch (e) { console.error(e); }
}

async function envoyerOTP(email, prenom, code) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Votre code de sécurité Fintechia',
    text: `Bonjour ${prenom},\n\nVotre code de sécurité à 6 chiffres est : ${code}. Ce code est valable pour la signature de votre contrat ou toute autre opération sécurisée.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0F1B33; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; color: #4F46E5;">Fintechia</h1>
        </div>
        <div style="padding: 20px; text-align: center;">
          <h2>Bonjour ${prenom},</h2>
          <p>Voici votre code de sécurité :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 20px; background: #F3F4F6; border-radius: 8px; margin: 20px 0;">${code}</div>
          <p>Ne partagez ce code avec personne.</p>
        </div>
      </div>
    `
  };
  try { await sendMailWrapper(mailOptions); } catch (e) { console.error(e); }
}

async function envoyerAlerteAdmin(sujet, message) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@fintechia.co',
    to: 'info@fintechia.co',
    subject: `[ADMIN ALERTE] ${sujet}`,
    text: message,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #EF4444; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Fintechia - Alerte Admin</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Nouvelle alerte</h2>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `
  };
  try { await sendMailWrapper(mailOptions); } catch (e) { console.error('[MAILER] Erreur alerte admin:', e); }
}

async function envoyerPinProvisoire(email, prenom, code) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Votre code PIN provisoire Fintechia',
    text: `Bonjour ${prenom},\n\nSuite à votre demande et la vérification de votre identité, voici votre code PIN provisoire à 6 chiffres : ${code}.\nLors de votre prochaine connexion, il vous sera demandé de définir un nouveau code PIN définitif.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0F1B33; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; color: #4F46E5;">Fintechia</h1>
        </div>
        <div style="padding: 20px; text-align: center;">
          <h2>Bonjour ${prenom},</h2>
          <p>Suite à la vérification de votre identité, voici votre code PIN provisoire :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 20px; background: #F3F4F6; border-radius: 8px; margin: 20px 0;">${code}</div>
          <p>Utilisez ce code pour vous connecter. Vous devrez immédiatement <strong>définir un nouveau code PIN définitif</strong>.</p>
        </div>
      </div>
    `
  };
  try { await sendMailWrapper(mailOptions); } catch (e) { console.error(e); }
}

module.exports = {
  envoyerResetMdp,
  envoyerConfirmationMdp,
  envoyerBienvenue,
  envoyerConfirmationVirement,
  envoyerOTP,
  envoyerAlerteAdmin,
  envoyerPinProvisoire
};
