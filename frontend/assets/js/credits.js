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
          if (typeof openCreditModal === 'function') openCreditModal();
      }, 500);
  }
});

async function submitCreditRequest() {
  const errEl = document.getElementById('credit-error-msg');
  errEl.style.display = 'none';

  const montant = document.getElementById('modalAmount').value;
  const duree_mois = document.getElementById('modalDuration').value;
  const motif = document.getElementById('modalCreditType').value;
  const prenom = document.getElementById('reqPrenom').value;
  const nom = document.getElementById('reqNom').value;
  const email = document.getElementById('reqEmail').value;
  const telephone = document.getElementById('reqTel').value;
  const message = document.getElementById('reqDesc').value;
  const profession = document.getElementById('reqProfession') ? document.getElementById('reqProfession').value : null;
  const revenu_mensuel = document.getElementById('reqRevenu') ? document.getElementById('reqRevenu').value : null;

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
      document.getElementById('modalStep3').style.display = 'none';
      document.getElementById('modalSuccess').style.display = 'block';
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

// Modal Logic
function openCreditModal() {
  const m = document.getElementById('modal-demande-credit');
  if (m) {
    m.style.display = 'flex';
    document.getElementById('modalStep1').style.display = 'block';
    document.getElementById('modalStep2').style.display = 'none';
    document.getElementById('modalStep3').style.display = 'none';
    document.getElementById('modalSuccess').style.display = 'none';
    document.getElementById('credit-error-msg').style.display = 'none';
  }
}

function goToStep2() {
  document.getElementById('modalStep1').style.display = 'none';
  document.getElementById('modalStep2').style.display = 'block';
}

function goToStep3() {
  const p = document.getElementById('reqPrenom').value;
  const n = document.getElementById('reqNom').value;
  const e = document.getElementById('reqEmail').value;
  const t = document.getElementById('reqTel').value;
  if(!p || !n || !e || !t) {
    alert('Veuillez remplir les informations obligatoires.');
    return;
  }
  document.getElementById('modalStep2').style.display = 'none';
  document.getElementById('modalStep3').style.display = 'block';
}

function switchDocTab(tab) {
  document.querySelectorAll('.doc-tab').forEach(el => {
    el.classList.remove('active');
    el.style.color = '#8A8676';
    el.style.borderBottom = 'none';
  });
  const activeTab = document.getElementById('tab-' + tab);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.style.color = 'var(--primary)';
    activeTab.style.borderBottom = '2px solid var(--primary)';
  }
  
  let docs = [];
  if(tab === 'personnel') {
    docs = [
      { id: 'cni', label: 'Pièce d\'identité (recto/verso)', desc: 'Format PDF ou image' },
      { id: 'rib', label: 'RIB de votre compte principal', desc: 'Au même nom que la demande' }
    ];
  } else if(tab === 'immobilier') {
    docs = [
      { id: 'cni', label: 'Pièce d\'identité (recto/verso)', desc: 'Format PDF ou image' },
      { id: 'rib', label: 'RIB', desc: 'Au même nom que la demande' },
      { id: 'avis', label: 'Dernier avis d\'imposition', desc: 'Justificatif de revenus' },
      { id: 'fiches', label: '3 dernières fiches de paie', desc: 'Justificatif de situation' },
      { id: 'compromis', label: 'Compromis de vente', desc: 'S\'il est déjà signé' }
    ];
  } else {
    docs = [
      { id: 'cni', label: 'Pièce d\'identité (recto/verso)', desc: 'Format PDF ou image' },
      { id: 'rib', label: 'RIB', desc: 'Au même nom que la demande' },
      { id: 'devis', label: 'Devis ou bon de commande', desc: 'Justificatif du projet' },
      { id: 'bilan', label: 'Bilan comptable (si pro)', desc: 'Pour les indépendants' }
    ];
  }
  
  const html = docs.map(d => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid #EFEBDE; border-radius:6px; margin-bottom:8px; background:#FAFAFA;">
      <div>
        <div style="font-size:13px; font-weight:500; color:#1C2436;">${d.label}</div>
        <div style="font-size:11px; color:#8A8676;">${d.desc}</div>
      </div>
      <input type="file" id="file-${d.id}" style="display:none" onchange="document.getElementById('lbl-${d.id}').innerText = 'Ajouté ✓'; document.getElementById('lbl-${d.id}').style.color='#059669'">
      <button onclick="document.getElementById('file-${d.id}').click()" style="background:none; border:none; cursor:pointer; color:var(--primary); font-size:13px; font-weight:600;" id="lbl-${d.id}">Uploader</button>
    </div>
  `).join('');
  
  document.getElementById('doc-list-container').innerHTML = html;
}

function toggleRevenu() {
  const prof = document.getElementById('reqProfession').value;
  const rev = document.getElementById('revenuContainer');
  if (prof === 'Salarie' || prof === 'Independant' || prof === 'Retraite') {
    rev.style.display = 'block';
  } else {
    rev.style.display = 'none';
  }
}

// Initialiser le calcul et les documents
document.addEventListener('DOMContentLoaded', () => {
  const mAmount = document.getElementById('modalAmount');
  const mDuration = document.getElementById('modalDuration');
  const mAmountOut = document.getElementById('modalAmountOut');
  const mDurationOut = document.getElementById('modalDurationOut');
  const mMonthly = document.getElementById('modalMonthly');
  const mRateLabel = document.getElementById('modalRateLabel');

  function computeModalMonthly() {
    if (!mAmount || !mDuration) return;
    var P = parseFloat(mAmount.value);
    var n = parseFloat(mDuration.value);
    var rate = 0.03;
    if(P > 50000 && P <= 500000) rate = 0.025;
    if(P > 500000) rate = 0.02;

    var r = rate / 12;
    var monthly = P * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
    
    mAmountOut.textContent = Math.round(P).toLocaleString('fr-FR') + ' €';
    mDurationOut.textContent = Math.round(n) + ' mois';
    mMonthly.textContent = Math.round(monthly).toLocaleString('fr-FR') + ' €';
    mRateLabel.textContent = "Mensualité estimée (TAEG indicatif: " + (rate*100) + "%)";
  }
  
  if(mAmount) {
    mAmount.addEventListener('input', computeModalMonthly);
    mDuration.addEventListener('input', computeModalMonthly);
    computeModalMonthly();
  }
  
  // Remplir les docs initiaux
  if (document.getElementById('doc-list-container')) {
    switchDocTab('personnel');
  }
});
