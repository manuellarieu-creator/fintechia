const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Helper pour charger le SVG
const loadLogoSVG = () => {
  try {
    const svgPath = path.join(__dirname, '../../frontend/assets/favicon.svg');
    return fs.readFileSync(svgPath, 'utf8');
  } catch (err) {
    console.error('Erreur chargement SVG:', err);
    return null;
  }
};

// GET /api/documents/rib
router.get('/rib', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Récupérer les informations utilisateur et compte
    const [users] = await db.query('SELECT prenom, nom, email FROM users WHERE id = ?', [userId]);
    const [accounts] = await db.query('SELECT iban, type_compte FROM accounts WHERE user_id = ? ORDER BY id ASC LIMIT 1', [userId]);

    if (users.length === 0 || accounts.length === 0) {
      return res.status(404).json({ error: 'Compte introuvable' });
    }

    const user = users[0];
    const account = accounts[0];
    const fullName = `${user.prenom} ${user.nom}`.toUpperCase();

    // Initialiser le document PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=RIB_Fintechia_${user.nom}.pdf`);
    
    doc.pipe(res);

    // Dessiner le logo (SVG)
    const svgContent = loadLogoSVG();
    if (svgContent) {
      SVGtoPDF(doc, svgContent, 50, 45, { width: 50, height: 50 });
    }

    // Header Fintechia
    doc.font('Helvetica-Bold').fontSize(24).text('Fintechia', 110, 55, { color: '#0F1B33' });
    doc.font('Helvetica').fontSize(10).text('Votre argent mérite mieux.', 110, 80, { color: '#B9B4A6' });

    doc.moveDown(4);

    // Titre
    doc.font('Helvetica-Bold').fontSize(18).text("RELEVÉ D'IDENTITÉ BANCAIRE (RIB)", { align: 'center' });
    doc.moveDown(2);

    // Bloc d'information (Titulaire)
    doc.font('Helvetica-Bold').fontSize(12).text('Titulaire du compte :', 50);
    doc.font('Helvetica').fontSize(12).text(fullName, 50);
    doc.moveDown();
    
    doc.font('Helvetica-Bold').text('Type de compte :', 50);
    doc.font('Helvetica').text(account.type_compte, 50);
    
    doc.moveDown(2);

    // Cadre RIB
    const boxTop = doc.y;
    doc.rect(50, boxTop, 495, 120).stroke('#E2E8F0');
    
    doc.font('Helvetica-Bold').fontSize(12).text('Nom de la banque :', 70, boxTop + 20);
    doc.font('Helvetica').text('FINTECHIA SA', 200, boxTop + 20);

    doc.font('Helvetica-Bold').text('IBAN :', 70, boxTop + 50);
    doc.font('Helvetica').text(account.iban, 200, boxTop + 50);

    doc.font('Helvetica-Bold').text('BIC :', 70, boxTop + 80);
    // Code BIC générique pour la démo
    doc.font('Helvetica').text('FINTFRPP', 200, boxTop + 80);

    // Footer
    doc.fontSize(8).fillColor('#64748B')
       .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} par Fintechia.`, 50, 750, { align: 'center' });

    doc.end();

  } catch (err) {
    console.error('[pdf] Erreur RIB:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors de la génération du RIB' });
    }
  }
});

// GET /api/documents/releve
router.get('/releve', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    let targetYear = year ? parseInt(year) : new Date().getFullYear();

    const [users] = await db.query('SELECT prenom, nom FROM users WHERE id = ?', [userId]);
    const [accounts] = await db.query('SELECT id, iban, solde FROM accounts WHERE user_id = ? ORDER BY id ASC LIMIT 1', [userId]);

    if (users.length === 0 || accounts.length === 0) {
      return res.status(404).json({ error: 'Compte introuvable' });
    }

    const user = users[0];
    const account = accounts[0];
    const fullName = `${user.prenom} ${user.nom}`.toUpperCase();

    const dateDebut = new Date(targetYear, targetMonth - 1, 1);
    const dateFin = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    const moisTexte = dateDebut.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    const [transactions] = await db.query(
      'SELECT type, montant, motif, created_at, statut FROM transactions WHERE account_id = ? AND created_at >= ? AND created_at <= ? ORDER BY created_at DESC',
      [account.id, dateDebut, dateFin]
    );

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Releve_Fintechia_${moisTexte.replace(' ', '_')}.pdf`);
    doc.pipe(res);

    const svgContent = loadLogoSVG();
    if (svgContent) {
      SVGtoPDF(doc, svgContent, 50, 45, { width: 50, height: 50 });
    }
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#0F1B33').text('Fintechia', 110, 55);
    doc.font('Helvetica').fontSize(10).fillColor('#B9B4A6').text('Votre argent mérite mieux.', 110, 80);

    doc.moveDown(4);

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#0F172A').text(`RELEVÉ DE COMPTE`, { align: 'center' });
    doc.font('Helvetica').fontSize(12).fillColor('#64748B').text(`Période : ${moisTexte.toUpperCase()}`, { align: 'center' });
    doc.moveDown(2);

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text('Titulaire :', 50);
    doc.font('Helvetica').text(fullName, 150, doc.y - 12);
    
    doc.font('Helvetica-Bold').text('IBAN :', 50, doc.y + 10);
    doc.font('Helvetica').text(account.iban, 150, doc.y - 12);

    doc.font('Helvetica-Bold').text('Solde Actuel :', 50, doc.y + 10);
    doc.font('Helvetica').text(`${parseFloat(account.solde).toFixed(2)} €`, 150, doc.y - 12);

    doc.moveDown(3);

    const tableTop = doc.y;
    doc.rect(50, tableTop, 495, 20).fillAndStroke('#F8FAFC', '#E2E8F0');
    
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9);
    doc.text('DATE', 55, tableTop + 5);
    doc.text('OPÉRATION', 150, tableTop + 5);
    doc.text('DÉBIT', 350, tableTop + 5);
    doc.text('CRÉDIT', 450, tableTop + 5);

    let yPosition = tableTop + 25;

    if (transactions.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor('#64748B').text('Aucune opération sur cette période.', 50, yPosition + 10, { align: 'center' });
    } else {
      doc.font('Helvetica').fontSize(9).fillColor('#475569');
      transactions.forEach(tx => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        const txDate = new Date(tx.created_at).toLocaleDateString('fr-FR');
        const motif = tx.motif || 'Virement';
        const montant = parseFloat(tx.montant).toFixed(2);

        doc.text(txDate, 55, yPosition);
        doc.text(motif.substring(0, 30), 150, yPosition);
        
        if (tx.type === 'debit') {
          doc.fillColor('#EF4444').text(`- ${montant} €`, 350, yPosition);
        } else {
          doc.fillColor('#10B981').text(`+ ${montant} €`, 450, yPosition);
        }

        doc.fillColor('#475569');
        doc.moveTo(50, yPosition + 12).lineTo(545, yPosition + 12).strokeColor('#E2E8F0').stroke();
        
        yPosition += 20;
      });
    }

    doc.fontSize(8).fillColor('#64748B')
       .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} par Fintechia.`, 50, 750, { align: 'center' });

    doc.end();

  } catch (err) {
    console.error('[pdf] Erreur Relevé:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors de la génération du relevé' });
    }
  }
});

module.exports = router;
