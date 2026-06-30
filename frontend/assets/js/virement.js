// Logique relative aux virements (à intégrer dans l'UI via les pages app.html)

async function handleVirementSubmit(e, isMobile) {
  e.preventDefault();
  
  const suffix = isMobile ? '-mobile' : '';
  const payload = {
    iban_dest: document.getElementById('vir-iban' + suffix).value,
    bic_dest: 'N/A', // Plus nécessaire ou mocké
    nom_dest: document.getElementById('vir-nom' + suffix).value,
    montant: document.getElementById('vir-montant' + suffix).value,
    motif: document.getElementById('vir-motif' + suffix).value
  };

  if(!payload.iban_dest) return alert('Veuillez sélectionner un bénéficiaire.');

  try {
    const res = await apiCall('/transactions/virement', 'POST', payload);
    alert(`Virement initié avec succès. Ce virement est en attente de validation (Réf: ${res.reference})`);
    
    // Réinitialiser le formulaire
    document.getElementById(isMobile ? 'form-virement-mobile' : 'form-virement-desktop').reset();
    
    // Retour à l'accueil
    if(isMobile) {
      showMobileView('m-view-dashboard');
      document.querySelectorAll('.bottom-nav .nb-item').forEach(i=>i.classList.remove('active'));
      document.querySelector('.bottom-nav .nb-item:first-child').classList.add('active');
    } else {
      showView('view-dashboard');
    }
    
    loadTransactions();
    checkAuth(); // Rafraichir le solde
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('form-virement-desktop')?.addEventListener('submit', (e) => handleVirementSubmit(e, false));
document.getElementById('form-virement-mobile')?.addEventListener('submit', (e) => handleVirementSubmit(e, true));
