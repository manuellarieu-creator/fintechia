// Base logic for the frontend SPA

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');

  // Afficher le loading par défaut
  showPage('pg-loading');

  const token = localStorage.getItem('fintech_token');
  if (token) {
    checkAuth(token);
  } else {
    setTimeout(() => {
      if (action === 'register') {
        showPage('pg-register');
      } else {
        showPage('pg-login');
      }
    }, 500); // Petit délai pour éviter les flashs
  }
});

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const target = document.getElementById(pageId);
  if (target) {
    target.style.display = target.classList.contains('flex-col') ? 'flex' : 'block';
  }
}

function showView(viewId) {
  document.querySelectorAll('.nb-view').forEach(v => v.style.display = 'none');
  const target = document.getElementById(viewId);
  if (target) {
    target.style.display = 'block';
  }
  
  if (viewId === 'view-virements') {
    if (typeof loadBeneficiairesForSelect === 'function') loadBeneficiairesForSelect();
    if (typeof loadVirementHistory === 'function') loadVirementHistory(1);
  } else if (viewId === 'view-beneficiaires' && typeof loadBeneficiaires === 'function') {
    loadBeneficiaires();
  } else if (viewId === 'view-cartes' && typeof loadCartes === 'function') {
    loadCartes();
  } else if (viewId === 'view-budget' && typeof loadBudgetsPage === 'function') {
    loadBudgetsPage();
  }
}

function showMobileView(viewId) {
  document.querySelectorAll('.m-view').forEach(v => v.style.display = 'none');
  const target = document.getElementById(viewId);
  if (target) {
    target.style.display = 'block';
  }

  if (viewId === 'm-view-virements' && typeof loadBeneficiairesForSelect === 'function') {
    loadBeneficiairesForSelect();
  } else if (viewId === 'm-view-cartes' && typeof loadCartes === 'function') {
    loadCartes();
  } else if (viewId === 'm-view-budget' && typeof loadBudgetsPage === 'function') {
    loadBudgetsPage();
  }
}

// Global API Fetch function
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('fintech_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`/api${endpoint}`, options);
  
  if (res.status === 401 && endpoint !== '/auth/login') {
    localStorage.removeItem('fintech_token');
    showPage('pg-login');
    alert('Session expirée, veuillez vous reconnecter.');
    return null;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur API');
  return data;
}

// Login logic
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-pwd').value;
  
  try {
    const res = await apiCall('/auth/login', 'POST', { email, password });
    localStorage.setItem('fintech_token', res.token);
    initDashboard(res.user, res.account);
  } catch (err) {
    alert(err.message);
  }
});

async function checkAuth() {
  try {
    const data = await apiCall('/auth/me');
    initDashboard(data.user, data.account, data.kyc_statut);
  } catch (err) {
    console.error(err);
  }
}

function initDashboard(user, account, kycStatut = null) {
  showPage('pg-dash');
  
  ['user-prenom-mobile', 'user-prenom-desktop', 'user-prenom-greeting'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerText = user.prenom;
  });
  
  ['user-nom-mobile', 'user-nom-desktop'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerText = user.nom;
  });

  ['user-avatar-mobile', 'user-avatar-desktop'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerText = (user.prenom[0] + user.nom[0]).toUpperCase();
  });
  
  if (account) {
    ['solde-display-mobile', 'solde-display-desktop', 'virement-solde-display'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerText = `${parseFloat(account.solde).toFixed(2).replace('.', ',')} €`;
    });
    
    ['iban-display-mobile', 'iban-display-desktop', 'virement-iban-display'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerText = account.iban ? account.iban.replace(/.(?=.{4})/g, '*') : 'En attente';
    });
    
    ['type-compte-display-mobile', 'type-compte-display-desktop'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerText = `Compte ${account.type_compte || 'Courant'}`;
    });
    
    if (account.statut === 'kyc_requis' || kycStatut === 'en_attente') {
      if(document.getElementById('kyc-alert-mobile')) document.getElementById('kyc-alert-mobile').style.display = 'block';
      if(document.getElementById('kyc-alert-desktop')) document.getElementById('kyc-alert-desktop').style.display = 'block';
    } else {
      if(document.getElementById('kyc-alert-mobile')) document.getElementById('kyc-alert-mobile').style.display = 'none';
      if(document.getElementById('kyc-alert-desktop')) document.getElementById('kyc-alert-desktop').style.display = 'none';
    }
  }

  const dateEl = document.getElementById('nb-current-date');
  if(dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('fr-FR', options);
    dateEl.innerText = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }

  // Load budgets & transactions
  if (typeof loadBudgets === 'function') {
    loadBudgets().then(() => {
      if (typeof loadTransactions === 'function') loadTransactions();
    });
  } else if (typeof loadTransactions === 'function') {
    loadTransactions();
  }

  // Pre-fill profile settings
  if(document.getElementById('prof-prenom')) {
    document.getElementById('prof-prenom').value = user.prenom || '';
    document.getElementById('prof-nom').value = user.nom || '';
    document.getElementById('prof-tel').value = user.telephone || '';
  }

  // Restore view from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get('view');
  const mview = urlParams.get('mview');
  
  if (view && typeof showView === 'function') {
      showView(view);
      // Highlight the correct menu item
      document.querySelectorAll('.nb-nav a').forEach(a => {
          a.classList.remove('active');
          if(a.getAttribute('onclick') && a.getAttribute('onclick').includes(view)) {
              a.classList.add('active');
          }
      });
  }
  
  if (mview && typeof showMobileView === 'function' && window.innerWidth <= 768) {
      showMobileView(mview);
      document.querySelectorAll('.bottom-nav .nb-item').forEach(i => {
          i.classList.remove('active');
          if(i.getAttribute('onclick') && i.getAttribute('onclick').includes(mview)) {
              i.classList.add('active');
          }
      });
  }
}

/* === GESTION DES BUDGETS === */
let userBudgets = [];

async function loadBudgets() {
  try {
    userBudgets = await apiCall('/budgets');
    renderBudgetsManageList();
  } catch (err) {
    console.error("Erreur chargement budgets:", err);
  }
}

function renderBudgetsManageList() {
  const container = document.getElementById('budgets-manage-list');
  if(!container) return;
  if(userBudgets.length === 0) {
    container.innerHTML = '<p style="font-size:13px; color:#64748B;">Aucune enveloppe budgétaire définie.</p>';
    return;
  }
  container.innerHTML = userBudgets.map(b => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #E2E8F0;">
      <div>
        <div style="font-weight:600; font-size:14px; color:#0F172A;">${b.categorie}</div>
        <div style="font-size:12px; color:#64748B;">Limite: ${parseFloat(b.limite).toFixed(2).replace('.',',')} €</div>
      </div>
      <button onclick="supprimerBudget(${b.id})" style="background:none; border:none; color:#EF4444; font-size:16px; cursor:pointer;">🗑</button>
    </div>
  `).join('');
}

async function ajouterBudget() {
  const cat = document.getElementById('new-budget-cat').value;
  const lim = document.getElementById('new-budget-limite').value;
  if(!cat || !lim) return; // Simple validation
  try {
    await apiCall('/budgets', 'POST', { categorie: cat, limite: parseFloat(lim), couleur: 'blue' });
    document.getElementById('new-budget-cat').value = '';
    document.getElementById('new-budget-limite').value = '';
    await loadBudgets();
    if(typeof loadTransactions === 'function') loadTransactions();
  } catch(e) {
    alert('Erreur ajout budget');
  }
}

async function supprimerBudget(id) {
  if(!confirm("Supprimer cette enveloppe budgétaire ?")) return;
  try {
    await apiCall(`/budgets/${id}`, 'DELETE');
    await loadBudgets();
    if(typeof loadTransactions === 'function') loadTransactions();
  } catch(e) {
    alert('Erreur suppression');
  }
}

// Drawer logic
window.openAppDrawer = function() {
  document.getElementById('app-overlay').style.display = 'block';
  document.getElementById('app-drawer').style.transform = 'translateX(0)';
};

window.closeAppDrawer = function() {
  document.getElementById('app-overlay').style.display = 'none';
  document.getElementById('app-drawer').style.transform = 'translateX(100%)';
};

// Logout
function logout() {
  localStorage.removeItem('fintech_token');
  window.location.reload();
}

// ==========================================
// TUNNEL ONBOARDING (MULTI-ETAPES)
// ==========================================
document.getElementById('form-step-1')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const payload = {
    prenom: document.getElementById('reg-prenom').value,
    nom: document.getElementById('reg-nom').value,
    email: document.getElementById('reg-email').value,
    password: document.getElementById('reg-pwd').value,
    telephone: document.getElementById('reg-tel').value,
    adresse: document.getElementById('reg-adresse').value,
    profession: document.getElementById('reg-profession').value,
    revenus: document.getElementById('reg-revenus').value
  };

  try {
    const res = await apiCall('/auth/register', 'POST', payload);
    localStorage.setItem('fintech_token', res.token);
    
    // Si le backend renvoie le code simulé (telephone_code)
    if (res.telephone_code) {
      document.getElementById('display-tel').innerText = payload.telephone;
      document.getElementById('simulated-sms-code').innerText = res.telephone_code;
    }

    // Passer à l'étape 2 (Vérification Téléphone)
    document.getElementById('form-step-1').style.display = 'none';
    document.getElementById('form-step-2').style.display = 'block';
    
    document.getElementById('step-icon-1').classList.remove('active');
    document.getElementById('step-icon-1').style.background = 'var(--success)';
    document.getElementById('step-icon-1').innerHTML = '<i class="ti ti-check"></i>';
    document.getElementById('step-icon-2').classList.add('active');
    document.getElementById('stepper-desc').innerText = 'Étape 2 sur 3';

  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('form-step-2')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('reg-sms-code').value;

  try {
    const res = await apiCall('/auth/verify-phone', 'POST', { code });
    if (res.success) {
      // Passer à l'étape 3 (KYC)
      document.getElementById('form-step-2').style.display = 'none';
      document.getElementById('form-step-3').style.display = 'block';
      
      document.getElementById('step-icon-2').classList.remove('active');
      document.getElementById('step-icon-2').style.background = 'var(--success)';
      document.getElementById('step-icon-2').innerHTML = '<i class="ti ti-check"></i>';
      document.getElementById('step-icon-3').classList.add('active');
      document.getElementById('stepper-desc').innerText = 'Étape 3 sur 3';
    }
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('form-step-3')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('fintech_token');
  const typeDoc = document.getElementById('reg-kyc-type').value;
  const docFile = document.getElementById('reg-kyc-doc').files[0];
  const selfieFile = document.getElementById('reg-kyc-selfie').files[0];

  if (!docFile || !selfieFile) {
    return alert('Veuillez fournir les deux documents.');
  }

  const formData = new FormData();
  formData.append('type_document', typeDoc);
  formData.append('document', docFile);
  formData.append('selfie', selfieFile);

  try {
    const res = await fetch('/api/kyc/submit', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors du KYC');

    alert('Inscription terminée ! Bienvenue sur NovaBanque.');
    window.location.reload(); // Va charger le dashboard automatiquement grâce au token
  } catch (err) {
    alert(err.message);
  }
});

window.finishOnboardingWithoutKYC = function() {
  alert('Inscription terminée ! Vous pourrez fournir vos documents plus tard.');
  window.location.reload();
}

// Profile update
document.getElementById('form-profile')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const prenom = document.getElementById('prof-prenom').value;
  const nom = document.getElementById('prof-nom').value;
  const telephone = document.getElementById('prof-tel').value;
  
  try {
    await apiCall('/auth/profile', 'PATCH', { prenom, nom, telephone });
    alert('Profil mis à jour avec succès !');
    checkAuth(); // Refresh UI with new data
  } catch(err) {
    alert(err.message);
  }
});

// Security update
document.getElementById('form-security')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const current_password = document.getElementById('sec-current-pwd').value;
  const new_password = document.getElementById('sec-new-pwd').value;
  
  try {
    await apiCall('/auth/password', 'PATCH', { current_password, new_password });
    alert('Mot de passe mis à jour avec succès !');
    document.getElementById('form-security').reset();
    showPage('pg-dash');
  } catch(err) {
    alert(err.message);
  }
});

window.filterTx = function(type, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tx-row').forEach(row => {
    if (type === 'all' || row.dataset.type === type) {
      row.classList.remove('hidden');
    } else {
      row.classList.add('hidden');
    }
  });
};

window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
};
