// Credits Logic

document.addEventListener('DOMContentLoaded', () => {
  const amountEl = document.getElementById('credit-amount-range');
  const durationEl = document.getElementById('credit-duration-range');
  const amountOut = document.getElementById('credit-amount-display');
  const durationOut = document.getElementById('credit-duration-display');
  const monthlyOut = document.getElementById('credit-mensualite-display');
  const rate = 0.039;

  function fmt(n) {
    return Math.round(n).toLocaleString('fr-FR') + ' €';
  }

  function computeMonthly() {
    if (!amountEl || !durationEl) return;
    const P = parseFloat(amountEl.value);
    const n = parseFloat(durationEl.value);
    const r = rate / 12;
    const monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    
    amountOut.textContent = fmt(P);
    durationOut.textContent = Math.round(n) + ' mois';
    monthlyOut.textContent = fmt(monthly);
  }

  if (amountEl) amountEl.addEventListener('input', computeMonthly);
  if (durationEl) durationEl.addEventListener('input', computeMonthly);
  computeMonthly();
  
  // Load credits on view show
  const originalShowView = window.showView;
  window.showView = function(id) {
    if (originalShowView) originalShowView(id);
    if (id === 'view-credits') {
      loadCredits();
    }
  };
  
  const originalShowMobileView = window.showMobileView;
  window.showMobileView = function(id) {
    if (originalShowMobileView) originalShowMobileView(id);
    if (id === 'm-view-credits') {
      loadCredits();
    }
  };
  
  // Check if URL has ?action=credit to open modal automatically
  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'credit') {
      setTimeout(() => {
          if (typeof openModal === 'function') openModal('modal-demande-credit');
      }, 500);
  }
});

async function submitCreditRequest() {
  const errEl = document.getElementById('credit-error-msg');
  errEl.style.display = 'none';

  const montant = document.getElementById('credit-amount-range').value;
  const duree_mois = document.getElementById('credit-duration-range').value;
  const motif = document.getElementById('credit-motif').value;
  const prenom = document.getElementById('credit-prenom').value;
  const nom = document.getElementById('credit-nom').value;
  const email = document.getElementById('credit-email').value;
  const telephone = document.getElementById('credit-telephone').value;
  const message = document.getElementById('credit-message').value;

  try {
    const res = await apiCall('/credits/demande', 'POST', { 
        montant, 
        duree_mois, 
        motif, 
        prenom, 
        nom, 
        email, 
        telephone, 
        message 
    });
    if (res.success) {
      closeModal('modal-demande-credit');
      alert('Votre demande de crédit a été enregistrée avec succès (Réf: ' + res.reference + ').');
      loadCredits();
      
      // Update sidebar active class if applicable
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      const navItem = document.querySelector('[onclick*="view-credits"]');
      if (navItem) navItem.classList.add('active');

      if (window.innerWidth <= 768) {
          if (typeof showMobileView === 'function') showMobileView('m-view-credits');
      } else {
          if (typeof showView === 'function') showView('view-credits');
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (e) {
    errEl.textContent = e.message || "Erreur lors de la demande.";
    errEl.style.display = 'block';
  }
}

async function loadCredits() {
  const tbodyDesktop = document.getElementById('credits-tbody-desktop');
  const listMobile = document.getElementById('credits-list-mobile');
  
  if (tbodyDesktop) tbodyDesktop.innerHTML = '<tr><td colspan="6" style="text-align:center;">Chargement...</td></tr>';
  if (listMobile) listMobile.innerHTML = '<p style="text-align:center;">Chargement...</p>';

  try {
    const credits = await apiCall('/credits/mes-demandes', 'GET');
    
    if (credits.length === 0) {
      if (tbodyDesktop) tbodyDesktop.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">Aucune demande de crédit pour le moment.</td></tr>';
      if (listMobile) listMobile.innerHTML = '<p style="text-align:center; padding:20px; color:#64748b;">Aucune demande de crédit.</p>';
      return;
    }

    let desktopHtml = '';
    let mobileHtml = '';

    credits.forEach(c => {
      const date = new Date(c.created_at).toLocaleDateString('fr-FR');
      const montant = parseFloat(c.montant).toLocaleString('fr-FR') + ' €';
      let statusBadge = '';
      if (c.statut === 'en_attente') statusBadge = '<span class="badge badge-warning">En attente</span>';
      else if (c.statut === 'valide') statusBadge = '<span class="badge badge-success">Validé</span>';
      else if (c.statut === 'rejete') statusBadge = '<span class="badge badge-danger">Rejeté</span>';

      desktopHtml += `
        <tr>
          <td style="font-family:monospace; font-weight:600;">${c.reference}</td>
          <td>${date}</td>
          <td>${c.motif}</td>
          <td style="font-weight:600;">${montant}</td>
          <td>${c.duree_mois} mois</td>
          <td>${statusBadge}</td>
        </tr>
      `;

      mobileHtml += `
        <div style="border-bottom:1px solid #E2E8F0; padding:12px 0;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="font-weight:600;">${c.motif}</span>
            <span style="font-weight:600;">${montant}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:13px; color:#64748b;">
            <span>${date} &bull; ${c.duree_mois} mois</span>
            <span>${statusBadge}</span>
          </div>
        </div>
      `;
    });

    if (tbodyDesktop) tbodyDesktop.innerHTML = desktopHtml;
    if (listMobile) listMobile.innerHTML = mobileHtml;
  } catch (e) {
    console.error('Erreur chargement crédits:', e);
    if (tbodyDesktop) tbodyDesktop.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Erreur de chargement.</td></tr>';
    if (listMobile) listMobile.innerHTML = '<p style="text-align:center; color:red;">Erreur de chargement.</p>';
  }
}
