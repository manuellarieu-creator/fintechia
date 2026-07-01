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

// Mobile submit (Standard behavior)
document.getElementById('form-virement-mobile')?.addEventListener('submit', (e) => handleVirementSubmit(e, true));

// DESKTOP TUNNEL LOGIC
function openTunnelModal() {
  // Show the modal and the first step (Form)
  document.getElementById('modal-virement-tunnel').style.display = 'flex';
  document.getElementById('tunnel-step-form').style.display = 'block';
  document.getElementById('tunnel-step-otp').style.display = 'none';
  document.getElementById('tunnel-step-loading').style.display = 'none';
  document.getElementById('tunnel-step-recap').style.display = 'none';
}

function goToOtpStep() {
  const montant = document.getElementById('vir-montant').value;
  const iban = document.getElementById('vir-iban').value;
  
  if (!montant || !iban) {
    alert('Veuillez sélectionner un bénéficiaire et saisir un montant.');
    return;
  }
  
  // Update recap fields with form data
  document.getElementById('recap-montant').innerText = parseFloat(montant).toFixed(2) + ' €';
  document.getElementById('recap-vers').innerText = document.getElementById('vir-nom').value || iban;
  
  // Transition to OTP step
  document.getElementById('tunnel-step-form').style.display = 'none';
  document.getElementById('tunnel-step-otp').style.display = 'block';
}

async function submitTunnelOtp() {
  // Show Loading step
  document.getElementById('tunnel-step-otp').style.display = 'none';
  document.getElementById('tunnel-step-loading').style.display = 'block';
  
  // Call the actual API
  const payload = {
    iban_dest: document.getElementById('vir-iban').value,
    bic_dest: 'N/A',
    nom_dest: document.getElementById('vir-nom').value,
    montant: document.getElementById('vir-montant').value,
    motif: document.getElementById('vir-motif').value
  };

  try {
    const res = await apiCall('/transactions/virement', 'POST', payload);
    
    // Simulate slight processing delay for realism in the tunnel
    setTimeout(() => {
        document.getElementById('tunnel-step-loading').style.display = 'none';
        document.getElementById('tunnel-step-recap').style.display = 'block';
    }, 1500);
    
    // Refresh backend data
    loadTransactions();
    checkAuth();
  } catch(err) {
    alert('Erreur lors du virement: ' + err.message);
    closeModal('modal-virement-tunnel');
  }
}

function finishTunnel() {
  closeModal('modal-virement-tunnel');
  const formDesktop = document.getElementById('form-virement-desktop');
  if(formDesktop) formDesktop.reset();
  showView('view-dashboard');
}

// Prevent default form submission on Desktop to avoid bypass
document.getElementById('form-virement-desktop')?.addEventListener('submit', (e) => {
    e.preventDefault();
    openTunnelModal();
});
