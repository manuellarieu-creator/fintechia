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

    // Auto-logout: 3 minutes d'inactivité
    let logoutTimer;
    function resetLogoutTimer() {
      clearTimeout(logoutTimer);
      if (localStorage.getItem('fintech_token')) {
        logoutTimer = setTimeout(() => {
          localStorage.removeItem('fintech_token');
          alert('Session expirée pour inactivité.');
          window.location.reload();
        }, 3 * 60 * 1000);
      }
    }
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => document.addEventListener(evt, resetLogoutTimer));
    resetLogoutTimer();
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
    const action = params.get('action');
    if (action !== 'login' && action !== 'register') {
      alert('Session expirée, veuillez vous reconnecter.');
    }
    return null;
  }

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Erreur API');
    err.isPopupRule = data.isPopupRule;
    err.code = data.code;
    throw err;
  }
  return data;
}

// Login logic
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-pwd').value;
  
  try {
    const res = await apiCall('/auth/login', 'POST', { email, password });
    
    if (res.require2FA) {
      document.getElementById('modal-2fa-login').style.display = 'flex';
      document.getElementById('login-2fa-phone').innerText = res.obfuscatedPhone;
      tempToken2FA = res.tempToken;
      document.getElementById('2fa-input-1').focus();
      return;
    }
    
    localStorage.setItem('fintech_token', res.token);
    initDashboard(res.user, res.account, res.kyc_statut);
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
  if (kycStatut === null && user.role !== 'admin') {
    showPage('pg-register');
    setStep(3);
    return;
  }

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
let regData = {};

function setStep(num) {
  for(let i=1; i<=5; i++) {
    const sForm = document.getElementById('form-step-'+i);
    const sNav = document.getElementById('step-nav-'+i);
    if(sForm) sForm.style.display = (i === num) ? 'block' : 'none';
    if(sNav) {
      if(i < num) {
        sNav.className = 'register-step completed';
      } else if (i === num) {
        sNav.className = 'register-step active';
      } else {
        sNav.className = 'register-step';
      }
    }
  }
}

document.getElementById('form-step-1')?.addEventListener('submit', (e) => {
  e.preventDefault();
  regData.prenom = document.getElementById('reg-prenom').value;
  regData.nom = document.getElementById('reg-nom').value;
  regData.date_naissance = document.getElementById('reg-dob').value;
  regData.telephone = document.getElementById('reg-tel').value;
  regData.email = document.getElementById('reg-email').value;
  setStep(2);
});

window.movePinFocus = function(el, num) {
  if (el.value.length === 1 && num < 4) {
    document.getElementById('reg-pin-' + (num + 1)).focus();
  }
}

document.getElementById('form-step-2')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = document.getElementById('reg-pwd').value;
  const pwdConf = document.getElementById('reg-pwd-confirm').value;
  if(pwd !== pwdConf) {
    return alert('Les mots de passe ne correspondent pas');
  }
  const pin = document.getElementById('reg-pin-1').value + 
              document.getElementById('reg-pin-2').value + 
              document.getElementById('reg-pin-3').value + 
              document.getElementById('reg-pin-4').value;
  
  if(pin.length !== 4) return alert('Le code PIN doit comporter 4 chiffres');

  regData.password = pwd;
  regData.pin_code = pin;

  const btn = document.getElementById('btn-step-2');
  const prevText = btn.innerText;
  btn.innerText = 'Création en cours...';
  btn.disabled = true;

  try {
    const res = await apiCall('/auth/register', 'POST', regData);
    localStorage.setItem('fintech_token', res.token);
    
    if (res.numero_client) {
      alert(`Votre identifiant client est : ${res.numero_client}. Notez-le bien !`);
    }

    setStep(3);
  } catch (err) {
    alert(err.message);
  } finally {
    btn.innerText = prevText;
    btn.disabled = false;
  }
});

  document.getElementById('form-step-3')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('fintech_token');
    if(!token) return alert('Vous devez d\'abord créer le compte.');
  
    const typeDoc = document.getElementById('reg-kyc-type').value;
    const rectoFile = document.getElementById('reg-kyc-recto').files[0];
  
    if (!rectoFile || !recordedVideoBlob) {
      return alert('Veuillez fournir la pièce d\'identité et terminer la vérification vidéo.');
    }
  
    const formData = new FormData();
    formData.append('type_document', typeDoc);
    formData.append('document', rectoFile);
    
    // Check if recordedVideoBlob is set, and append it with a filename based on mime type
    const ext = recordedVideoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('selfie', recordedVideoBlob, `video_kyc.${ext}`);
    formData.append('instructions_kyc', `Code lu: ${kycCode}`);

  const btn = document.getElementById('btn-step-3');
  const prevText = btn.innerText;
  btn.innerText = 'Envoi...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/kyc/submit', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors du KYC');

    setStep(4);
    const btnFinal = document.getElementById('btn-final-kyc');
    btnFinal.disabled = false;
    btnFinal.style.background = '#2563EB';
    btnFinal.style.color = '#fff';

  } catch (err) {
    alert(err.message);
  } finally {
    btn.innerText = prevText;
    btn.disabled = false;
  }
});

window.selectPlan = function(el, type) {
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  regData.plan = type;
};

document.getElementById('form-step-4')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!document.getElementById('reg-cgu').checked) {
    return alert('Veuillez accepter les CGU');
  }
  setStep(5);
});

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

// --- Video KYC Logic ---
let mediaRecorder;
let recordedChunks = [];
let recordedVideoBlob = null;
let kycStream = null;
let kycStep = 0;
let kycCode = "";
let kycTimerInterval = null;
let kycTimeRemaining = 30;

function generateKycCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

window.startVideoKyc = async function() {
  const modal = document.getElementById('modal-video-kyc');
  modal.style.display = 'flex';
  document.getElementById('btn-kyc-start-record').style.display = 'block';
  document.getElementById('btn-kyc-next-step').style.display = 'none';
  document.getElementById('btn-kyc-finish').style.display = 'none';
  document.getElementById('kyc-instruction-overlay').style.display = 'none';
  document.getElementById('kyc-timer').style.display = 'none';
  
  kycCode = generateKycCode();
  recordedChunks = [];
  recordedVideoBlob = null;
  kycStep = 0;

  try {
    kycStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const videoPreview = document.getElementById('kyc-video-preview');
    videoPreview.srcObject = kycStream;
  } catch (err) {
    console.error("Camera access denied", err);
    alert("Impossible d'accéder à la caméra et au microphone. Autorisation requise.");
    window.cancelVideoKyc();
  }
}

window.cancelVideoKyc = function() {
  if (kycStream) {
    kycStream.getTracks().forEach(track => track.stop());
    kycStream = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  clearInterval(kycTimerInterval);
  document.getElementById('modal-video-kyc').style.display = 'none';
}

window.startRecording = function() {
  if (!kycStream) return;
  
  recordedChunks = [];
  try {
    mediaRecorder = new MediaRecorder(kycStream, { mimeType: 'video/webm; codecs=vp8,opus' });
  } catch (e) {
    try {
      mediaRecorder = new MediaRecorder(kycStream, { mimeType: 'video/webm' });
    } catch (e) {
      mediaRecorder = new MediaRecorder(kycStream); // Fallback
    }
  }

  mediaRecorder.ondataavailable = function(e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  mediaRecorder.onstop = function() {
    recordedVideoBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
    document.getElementById('video-kyc-status').innerText = 'Vidéo enregistrée avec succès (Prêt à soumettre)';
    document.getElementById('video-kyc-status').style.color = '#16A34A';
    
    // Stop camera
    if (kycStream) {
      kycStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('modal-video-kyc').style.display = 'none';
  };

  mediaRecorder.start(100);
  
  document.getElementById('btn-kyc-start-record').style.display = 'none';
  document.getElementById('btn-kyc-next-step').style.display = 'block';
  
  // Timer setup
  kycTimeRemaining = 30;
  document.getElementById('kyc-timer').style.display = 'block';
  document.getElementById('kyc-timer').innerText = '00:' + kycTimeRemaining;
  
  kycTimerInterval = setInterval(() => {
    kycTimeRemaining--;
    let displayTime = kycTimeRemaining < 10 ? '0' + kycTimeRemaining : kycTimeRemaining;
    document.getElementById('kyc-timer').innerText = '00:' + displayTime;
    if (kycTimeRemaining <= 0) {
      window.finishVideoKyc();
    }
  }, 1000);

  window.nextVideoStep();
}

window.nextVideoStep = function() {
  kycStep++;
  const overlay = document.getElementById('kyc-instruction-overlay');
  overlay.style.display = 'block';
  
  if (kycStep === 1) {
    overlay.innerText = "Étape 1/3: Tournez la tête en haut puis à droite";
  } else if (kycStep === 2) {
    overlay.innerText = `Étape 2/3: Lisez à voix haute les chiffres : ${kycCode.split('').join(' - ')}`;
  } else if (kycStep === 3) {
    overlay.innerText = "Étape 3/3: Dites votre nom, prénom, puis le numéro de la pièce d'identité";
    document.getElementById('btn-kyc-next-step').style.display = 'none';
    document.getElementById('btn-kyc-finish').style.display = 'block';
  }
}

window.finishVideoKyc = function() {
  clearInterval(kycTimerInterval);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}
