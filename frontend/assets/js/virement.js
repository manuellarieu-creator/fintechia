// Logique relative aux virements (à intégrer dans l'UI via les pages app.html)
document.getElementById('form-virement-desktop')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const payload = {
    iban_dest: document.getElementById('vir-iban').value,
    bic_dest: 'N/A', // Plus nécessaire ou mocké
    nom_dest: document.getElementById('vir-nom').value,
    montant: document.getElementById('vir-montant').value,
    motif: document.getElementById('vir-motif').value
  };

  if(!payload.iban_dest) return alert('Veuillez sélectionner un bénéficiaire.');

  try {
    const res = await apiCall('/transactions/virement', 'POST', payload);
    alert(`Virement initié avec succès. Ce virement est en attente de validation (Réf: ${res.reference})`);
    
    // Réinitialiser le formulaire
    document.getElementById('form-virement-desktop').reset();
    
    // Retour à l'accueil
    showView('view-dashboard');
    loadTransactions();
    checkAuth(); // Rafraichir le solde
  } catch (err) {
    alert(err.message);
  }
});
