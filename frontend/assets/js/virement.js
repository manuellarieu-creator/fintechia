// Logique relative aux virements (à intégrer dans l'UI via les pages app.html)
async function submitVirement(event) {
  event.preventDefault();
  
  const payload = {
    iban_dest: document.getElementById('vir-iban').value,
    bic_dest: document.getElementById('vir-bic').value,
    nom_dest: document.getElementById('vir-nom').value,
    montant: document.getElementById('vir-montant').value,
    motif: document.getElementById('vir-motif').value
  };

  try {
    const res = await apiCall('/transactions/virement', 'POST', payload);
    alert(`Virement initié avec succès. Réf: ${res.reference}`);
    showPage('pg-dash');
    loadTransactions();
    checkAuth(); // Rafraichir le solde
  } catch (err) {
    alert(err.message);
  }
}
