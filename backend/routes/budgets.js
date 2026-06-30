const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Initialisation de la table si elle n'existe pas
pool.query(`
  CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    categorie VARCHAR(100) NOT NULL,
    limite DECIMAL(15,2) NOT NULL,
    couleur VARCHAR(20) DEFAULT 'blue',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).catch(err => console.error("Erreur création table budgets:", err));

// GET: Récupérer les budgets de l'utilisateur
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [budgets] = await pool.query('SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at ASC', [req.user.id]);
    res.json(budgets);
  } catch (error) {
    console.error('Erreur GET /budgets:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des budgets' });
  }
});

// POST: Créer un budget
router.post('/', authMiddleware, async (req, res) => {
  const { categorie, limite, couleur } = req.body;
  if (!categorie || !limite) {
    return res.status(400).json({ error: 'Catégorie et limite sont requises' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO budgets (user_id, categorie, limite, couleur) VALUES (?, ?, ?, ?)',
      [req.user.id, categorie, parseFloat(limite), couleur || 'blue']
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      categorie, 
      limite: parseFloat(limite), 
      couleur: couleur || 'blue' 
    });
  } catch (error) {
    console.error('Erreur POST /budgets:', error);
    res.status(500).json({ error: 'Erreur lors de la création du budget' });
  }
});

// DELETE: Supprimer un budget
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Budget non trouvé ou non autorisé' });
    }
    res.json({ message: 'Budget supprimé avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /budgets:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du budget' });
  }
});

module.exports = router;
