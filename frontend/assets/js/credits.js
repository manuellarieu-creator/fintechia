// Credits Logic — Configuration centralisée des 4 types de crédit

window.CREDIT_CONFIG = {
  personnel: {
    label: 'Prêt personnel',
    minAmount: 5000, maxAmount: 120000, stepAmount: 500,
    minDuration: 3, maxDuration: 60, stepDuration: 1,
    rates: [
      { max: 50000, rate: 0.03 },
      { max: 120000, rate: 0.025 }
    ],
    defaultAmount: 15000,
    defaultDuration: 24
  },
  consommation: {
    label: 'Crédit de consommation',
    minAmount: 5000, maxAmount: 30000, stepAmount: 500,
    minDuration: 3, maxDuration: 60, stepDuration: 1,
    rates: [{ max: 30000, rate: 0.03 }],
    defaultAmount: 10000,
    defaultDuration: 24
  },
  immobilier: {
    label: 'Crédit immobilier',
    minAmount: 70000, maxAmount: 1000000, stepAmount: 5000,
    minDuration: 24, maxDuration: 300, stepDuration: 6,
    rates: [
      { max: 500000, rate: 0.025 },
      { max: 1000000, rate: 0.02 }
    ],
    defaultAmount: 200000,
    defaultDuration: 240
  },
  grands_projets: {
    label: 'Financement grands projets',
    minAmount: 1000000, maxAmount: 5000000, stepAmount: 50000,
    minDuration: 24, maxDuration: 360, stepDuration: 6,
    rates: [
      { max: 2000000, rate: 0.02 },
      { max: 5000000, rate: 0.015 }
    ],
    defaultAmount: 1500000,
    defaultDuration: 120
  }
};

// Utilitaire: récupérer le taux pour un montant et un type donnés
window.getCreditRate = function(type, amount) {
  const config = window.CREDIT_CONFIG[type];
  if (!config) return 0.03;
  for (const bracket of config.rates) {
    if (amount <= bracket.max) return bracket.rate;
  }
  return config.rates[config.rates.length - 1].rate;
};

// Utilitaire: formater un nombre en euros
function fmt(n) {
  return Math.round(n).toLocaleString((typeof window.getCurrentLocale === 'function' ? window.getCurrentLocale() : 'fr-FR')) + ' €';
}

// Utilitaire: calculer la mensualité
window.computeMonthlyPayment = function(principal, annualRate, months) {
  if (months <= 0 || principal <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
};

document.addEventListener('DOMContentLoaded', () => {
  // ===== Anciens éléments (landing page éventuelle) =====
  const amountEl = document.getElementById('credit-amount-range');
  const durationEl = document.getElementById('credit-duration-range');
  const amountOut = document.getElementById('credit-amount-display');
  const durationOut = document.getElementById('credit-duration-display');
  const monthlyOut = document.getElementById('credit-mensualite-display');

  function computeMonthlyOld() {
    if (!amountEl || !durationEl) return;
    const P = parseFloat(amountEl.value);
    const n = parseFloat(durationEl.value);
    const rate = 0.039;
    const r = rate / 12;
    const monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    
    amountOut.textContent = fmt(P);
    durationOut.textContent = Math.round(n) + ' mois';
    monthlyOut.textContent = fmt(monthly);
  }

  if (amountEl) amountEl.addEventListener('input', computeMonthlyOld);
  if (durationEl) durationEl.addEventListener('input', computeMonthlyOld);
  if (amountEl) computeMonthlyOld();
  
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
        message,
        type_credit: motif
    });
    if (res.success) {
      document.getElementById('modalStep3').style.display = 'none';
      document.getElementById('modalSuccess').style.display = 'block';
      const titleEl = document.getElementById('modalCreditTitle');
      if(titleEl) titleEl.style.display = 'none';
      const subEl = document.getElementById('modalSubtitle');
      if(subEl) subEl.style.display = 'none';
      
      // Stocker la référence et les infos pour le contrat
      window._lastCreditRef = res.reference;
      window._lastCreditId = res.id;
      window._lastCreditType = motif;
      window._lastCreditAmount = parseFloat(montant);
      window._lastCreditDuration = parseInt(duree_mois);
      
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
      const date = new Date(c.created_at).toLocaleDateString((typeof window.getCurrentLocale === 'function' ? window.getCurrentLocale() : 'fr-FR'));
      const montant = parseFloat(c.montant).toLocaleString((typeof window.getCurrentLocale === 'function' ? window.getCurrentLocale() : 'fr-FR')) + ' €';
      let statusBadge = '';
      let progressWidth = '33%';
      let progressColor = '#eab308';
      let progressText = 'En attente';
      if (c.statut === 'en_attente') {
         statusBadge = '<span class="badge badge-warning">En attente</span>';
      } else if (c.statut === 'analyse' || c.statut === 'en_analyse') {
         statusBadge = '<span class="badge badge-info" style="background:#3b82f6; color:#fff;">En analyse</span>';
         progressWidth = '66%';
         progressColor = '#3b82f6';
         progressText = 'Analyse';
      } else if (c.statut === 'contrat_a_signer') {
         statusBadge = '<span class="badge badge-warning" style="background:#f59e0b; color:#fff;">Contrat à signer</span>';
         progressWidth = '80%';
         progressColor = '#f59e0b';
         progressText = 'Signature';
      } else if (c.statut === 'valide') {
         statusBadge = '<span class="badge badge-success">Validé</span>';
         progressWidth = '100%';
         progressColor = '#22c55e';
         progressText = 'Validé';
      } else if (c.statut === 'rejete') {
         statusBadge = '<span class="badge badge-danger">Rejeté</span>';
         progressWidth = '100%';
         progressColor = '#ef4444';
         progressText = 'Rejeté';
      }

      // Déterminer le label du type de crédit
      const typeConfig = window.CREDIT_CONFIG[c.type_credit || c.motif];
      const typeLabel = typeConfig ? typeConfig.label : (c.motif || c.type_credit || '-');

      let contratBtn = '';
      if (c.statut === 'contrat_a_signer') {
        contratBtn = `<button class="btn-primary" style="font-size:12px; padding:6px 12px; border-radius:6px; background:#059669; border:none; color:white; cursor:pointer; margin-left:8px; font-weight:600;" onclick="openContratModal('${c.type_credit || c.motif}', {reference:'${c.reference}', montant:${c.montant}, duree:${c.duree_mois}, taux:${c.taux}, mensualite:${c.mensualite}, id:${c.id}})"><i class="ti ti-writing"></i> Signer le contrat</button>`;
      } else if (c.statut !== 'rejete') {
        contratBtn = `<button class="btn-outline" style="font-size:12px; padding:6px 12px; border-radius:6px; background:white; cursor:pointer; margin-left:8px; color:#059669; border-color:#059669;" onclick="openContratModal('${c.type_credit || c.motif}', {reference:'${c.reference}', montant:${c.montant}, duree:${c.duree_mois}, taux:${c.taux}, mensualite:${c.mensualite}, id:${c.id}})"><i class="ti ti-file-text"></i> Contrat</button>`;
      }

      const actions = `
        <div style="margin-top: 12px; display:flex; flex-wrap:wrap; gap:6px;">
            <button class="btn-outline" style="font-size:12px; padding:6px 12px; border-radius:6px; background:white; cursor:pointer;" onclick="openSuivreDemande('${c.reference}', '${c.statut}', '${montant}', '${date}')">Suivre ma demande</button>
            ${contratBtn}
        </div>
      `;

      desktopHtml += `
        <tr>
          <td style="font-family:monospace; font-weight:600;">${c.reference}</td>
          <td>${date}</td>
          <td>${typeLabel}</td>
          <td style="font-weight:600;">${montant}</td>
          <td>${c.duree_mois} mois</td>
          <td>
            ${actions}
          </td>
        </tr>
      `;

      mobileHtml += `
        <div style="border-bottom:1px solid #E2E8F0; padding:12px 0;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="font-weight:600;">${typeLabel}</span>
            <span style="font-weight:600;">${montant}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:13px; color:#64748b;">
            <span>${date} &bull; ${c.duree_mois} mois</span>
            <span>${statusBadge}</span>
          </div>
          ${actions}
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

// Modal Suivi Demande
window.openSuivreDemande = function(reference, statut, montant, date) {
    document.getElementById('suivi-ref').innerText = reference;
    document.getElementById('suivi-montant').innerText = montant;
    document.getElementById('suivi-date').innerText = date;
    
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById('suivi-step-' + i);
        if(!step) continue;
        const node = step.querySelector('.suivi-node');
        node.style.background = '#F1F5F9';
        node.style.color = '#94A3B8';
        node.style.borderColor = 'white';
        node.style.boxShadow = '0 0 0 2px #E2E8F0';
        node.innerHTML = i;
    }
    document.getElementById('suivi-progress-line').style.width = '0%';
    document.getElementById('suivi-message-container').style.display = 'none';
    
    let progressLevel = 1;
    let step3Label = "Approuver";
    
    if (statut === 'en_attente') {
        progressLevel = 1;
    } else if (statut === 'etude' || statut === 'analyse' || statut === 'en_analyse') {
        progressLevel = 2;
    } else if (statut === 'incomplet') {
        progressLevel = 3;
        step3Label = "Incomplet";
        document.getElementById('suivi-message').innerText = "Votre dossier est incomplet. Veuillez vérifier vos documents ou nous contacter.";
        document.getElementById('suivi-message-container').style.display = 'block';
    } else if (statut === 'contrat_a_signer') {
        progressLevel = 3;
        step3Label = "Contrat";
        document.getElementById('suivi-message').innerText = "Votre demande est acceptée sous réserve de la signature de votre contrat. Veuillez le remplir et le signer.";
        document.getElementById('suivi-message-container').style.display = 'block';
    } else if (statut === 'rejete') {
        progressLevel = 3;
        step3Label = "Rejeté";
    } else if (statut === 'valide_succes' || statut === 'valide') {
        progressLevel = 3;
        step3Label = "Validé";
    } else if (statut === 'credite') {
        progressLevel = 4;
        step3Label = "Validé";
    }
    
    document.getElementById('suivi-step-3-label').innerText = step3Label;
    
    for (let i = 1; i <= progressLevel; i++) {
        const step = document.getElementById('suivi-step-' + i);
        if(!step) continue;
        const node = step.querySelector('.suivi-node');
        
        let color = '#2563EB';
        if (i === 3 && (statut === 'rejete' || statut === 'incomplet')) {
            color = '#DC2626';
        } else if (i === 3 && statut === 'contrat_a_signer') {
            color = '#F59E0B'; // Orange
        } else if (i === 4 || (i === 3 && (statut === 'valide_succes' || statut === 'valide' || statut === 'credite'))) {
            color = '#16A34A';
        }
        if (i < progressLevel && progressLevel === 3 && (statut === 'rejete' || statut === 'incomplet' || statut === 'contrat_a_signer')) color = '#2563EB'; // Keep previous steps blue
        if (i < progressLevel && progressLevel >= 3 && (statut === 'valide_succes' || statut === 'valide' || statut === 'credite')) color = '#2563EB';
        
        node.style.background = color;
        node.style.color = 'white';
        node.style.boxShadow = `0 0 0 2px ${color}`;
        node.innerHTML = '<i class="ti ti-check"></i>';
    }
    
    const percentages = ['0%', '33%', '66%', '100%'];
    document.getElementById('suivi-progress-line').style.width = percentages[progressLevel - 1];
    
    let lineColor = '#2563EB';
    if (progressLevel === 3 && (statut === 'rejete' || statut === 'incomplet')) lineColor = '#DC2626';
    if (progressLevel >= 3 && (statut === 'valide_succes' || statut === 'valide' || statut === 'credite')) lineColor = '#16A34A';
    document.getElementById('suivi-progress-line').style.background = lineColor;
    
    const actionBtn = document.getElementById('suivi-action-btn');
    if (actionBtn) {
        if (statut === 'credite') {
            actionBtn.innerText = 'Voir mon solde';
            actionBtn.onclick = function() {
                closeModal('modal-suivre-demande');
                if (typeof showView === 'function') {
                    showView('view-dashboard');
                }
            };
        } else {
            actionBtn.innerText = 'Fermer';
            actionBtn.onclick = function() {
                closeModal('modal-suivre-demande');
            };
        }
    }
    
    document.getElementById('modal-suivre-demande').style.display = 'flex';
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
    const titleEl = document.getElementById('modalCreditTitle');
    if(titleEl) titleEl.style.display = 'block';
    const subEl = document.getElementById('modalSubtitle');
    if(subEl) subEl.style.display = 'block';
    
    // Initialiser les sliders selon le type sélectionné
    updateSlidersForType();
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

// ===== Logique dynamique des sliders selon le type de crédit =====

function updateSlidersForType() {
  const typeSelect = document.getElementById('modalCreditType');
  const mAmount = document.getElementById('modalAmount');
  const mDuration = document.getElementById('modalDuration');
  if (!typeSelect || !mAmount || !mDuration) return;

  const type = typeSelect.value;
  const config = window.CREDIT_CONFIG[type];
  if (!config) return;

  // Mettre à jour les attributs des sliders
  mAmount.min = config.minAmount;
  mAmount.max = config.maxAmount;
  mAmount.step = config.stepAmount;
  
  mDuration.min = config.minDuration;
  mDuration.max = config.maxDuration;
  mDuration.step = config.stepDuration;

  // Réinitialiser les valeurs par défaut
  mAmount.value = config.defaultAmount;
  mDuration.value = config.defaultDuration;

  // Mettre à jour les indicateurs de limites
  const limitsEl = document.getElementById('modalLimitsInfo');
  if (limitsEl) {
    limitsEl.innerHTML = `
      <span style="font-size:12px; color:#64748b;">
        <i class="ti ti-info-circle"></i> 
        ${fmt(config.minAmount)} — ${fmt(config.maxAmount)} · ${config.minDuration} à ${config.maxDuration} mois
      </span>
    `;
  }

  // Recalculer
  computeModalMonthly();
}

function computeModalMonthly() {
  const mAmount = document.getElementById('modalAmount');
  const mDuration = document.getElementById('modalDuration');
  const mAmountOut = document.getElementById('modalAmountOut');
  const mDurationOut = document.getElementById('modalDurationOut');
  const mMonthly = document.getElementById('modalMonthly');
  const mRateLabel = document.getElementById('modalRateLabel');
  const typeSelect = document.getElementById('modalCreditType');

  if (!mAmount || !mDuration) return;

  const P = parseFloat(mAmount.value);
  const n = parseFloat(mDuration.value);
  const type = typeSelect ? typeSelect.value : 'personnel';
  
  // Calculer le taux selon le type et le montant
  const rate = window.getCreditRate(type, P);
  const monthly = window.computeMonthlyPayment(P, rate, n);
  
  // Calculer le coût total du crédit
  const totalCost = (monthly * n) - P;
  
  if (mAmountOut) mAmountOut.textContent = fmt(P);
  if (mDurationOut) mDurationOut.textContent = Math.round(n) + ' mois';
  if (mMonthly) mMonthly.textContent = fmt(monthly);
  if (mRateLabel) mRateLabel.textContent = "Mensualité estimée (TAEG indicatif: " + (rate*100) + "%)";
  
  // Coût total
  const totalCostEl = document.getElementById('modalTotalCost');
  if (totalCostEl) {
    totalCostEl.textContent = 'Coût total du crédit : ' + fmt(totalCost);
  }
}

// Initialiser le calcul et les documents
document.addEventListener('DOMContentLoaded', () => {
  const mAmount = document.getElementById('modalAmount');
  const mDuration = document.getElementById('modalDuration');
  const typeSelect = document.getElementById('modalCreditType');

  if(mAmount) {
    mAmount.addEventListener('input', computeModalMonthly);
    mDuration.addEventListener('input', computeModalMonthly);
    
    // Écouter le changement de type de crédit
    if (typeSelect) {
      typeSelect.addEventListener('change', updateSlidersForType);
    }
    
    // Initialiser avec le type par défaut
    updateSlidersForType();
  }
  
  // Remplir les docs initiaux
  if (document.getElementById('doc-list-container')) {
    switchDocTab('personnel');
  }
});
