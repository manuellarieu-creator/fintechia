window.alert = function(message, callback) {
    let modal = document.getElementById('modal-custom-alert');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-custom-alert';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;backdrop-filter:blur(4px);opacity:0;transition:opacity 0.2s;';
        modal.innerHTML = `
            <div style="background:var(--bg-body, #fff); border-radius:24px; padding:32px; max-width:400px; width:90%; text-align:center; box-shadow:0 20px 40px rgba(0,0,0,0.2); transform:scale(0.9); transition:transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);" id="custom-alert-box">
                <div id="custom-alert-icon" style="font-size:56px; margin-bottom:16px; line-height:1;"></div>
                <h3 id="custom-alert-title" style="margin:0 0 12px; font-size:20px; font-weight:700; color:var(--text-main, #1e293b);"></h3>
                <p id="custom-alert-message" style="margin:0 0 24px; font-size:15px; color:var(--text-muted, #64748b); line-height:1.5;"></p>
                <button id="custom-alert-btn" style="background:var(--primary, #3b82f6); color:#fff; border:none; padding:14px 24px; border-radius:12px; font-weight:600; width:100%; cursor:pointer; font-size:15px; transition:transform 0.1s, filter 0.2s;">Compris</button>
            </div>
        `;
        document.body.appendChild(modal);
        const btn = document.getElementById('custom-alert-btn');
        btn.addEventListener('mouseover', () => btn.style.filter = 'brightness(1.1)');
        btn.addEventListener('mouseout', () => btn.style.filter = 'brightness(1)');
        btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.97)');
        btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
    }
    const lowerMsg = (message || '').toString().toLowerCase();
    let type = 'info';
    if (lowerMsg.includes('erreur') || lowerMsg.includes('échoué') || lowerMsg.includes('invalide') || lowerMsg.includes('incorrect') || lowerMsg.includes('insuffisant') || lowerMsg.includes('bloqué') || lowerMsg.includes('rejetée') || lowerMsg.includes('impossible') || lowerMsg.includes('exigé')) {
        type = 'error';
    } else if (lowerMsg.includes('succès') || lowerMsg.includes('validé') || lowerMsg.includes('ajouté') || lowerMsg.includes('réussi')) {
        type = 'success';
    } else if (lowerMsg.includes('attention') || lowerMsg.includes('bientôt') || lowerMsg.includes('limite')) {
        type = 'warning';
    }
    let emoji = '💡', title = 'Notification', btnColor = 'var(--primary, #3b82f6)';
    if (type === 'error') { emoji = '🚨'; title = 'Oups !'; btnColor = 'var(--danger, #ef4444)'; }
    else if (type === 'success') { emoji = '✅'; title = 'Succès !'; btnColor = 'var(--success, #22c55e)'; }
    else if (type === 'warning') { emoji = '⚠️'; title = 'Attention'; btnColor = 'var(--warning, #f59e0b)'; }
    document.getElementById('custom-alert-icon').innerText = emoji;
    document.getElementById('custom-alert-title').innerText = title;
    document.getElementById('custom-alert-message').innerText = message;
    document.getElementById('custom-alert-btn').style.background = btnColor;
    modal.style.display = 'flex';
    setTimeout(() => { modal.style.opacity = '1'; document.getElementById('custom-alert-box').style.transform = 'scale(1)'; }, 10);
    document.getElementById('custom-alert-btn').onclick = () => {
        modal.style.opacity = '0';
        document.getElementById('custom-alert-box').style.transform = 'scale(0.9)';
        setTimeout(() => { modal.style.display = 'none'; if (callback) callback(); }, 200);
    };
};

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
          alert('Session expirée pour inactivité.', () => window.location.reload());
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
  if (viewId === 'view-kyc' && typeof kycStatut !== 'undefined' && kycStatut === 'valide') {
    viewId = 'view-dashboard';
  }
  
  localStorage.setItem('activeClientView', viewId);
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
  } else if (viewId === 'view-credits' && typeof loadCredits === 'function') {
    loadCredits();
  } else if (viewId === 'view-releves' && typeof loadRelevesData === 'function') {
    loadRelevesData();
  }
}

function showMobileView(viewId) {
  if (viewId === 'm-view-kyc' && typeof kycStatut !== 'undefined' && kycStatut === 'valide') {
    viewId = 'm-view-dashboard';
  }
  
  localStorage.setItem('activeClientMobileView', viewId);
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
  } else if (viewId === 'm-view-credits' && typeof loadCredits === 'function') {
    loadCredits();
  } else if (viewId === 'm-view-releves' && typeof loadRelevesData === 'function') {
    loadRelevesData();
  } else if (viewId === 'm-view-beneficiaires' && typeof loadBeneficiaires === 'function') {
    loadBeneficiaires();
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
    const urlAction = new URLSearchParams(window.location.search).get('action');
    if (urlAction !== 'login' && urlAction !== 'register') {
      alert('Session expirée, veuillez vous reconnecter.');
    }
    return null;
  }

  let data;
  try {
    data = await res.json();
  } catch(e) {
    throw new Error('Erreur serveur critique (Base de données probablement arrêtée). Veuillez relancer MySQL.');
  }
  
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
        if (!data || !localStorage.getItem('fintech_token')) { clearInterval(kycPollInterval); return; }
    initDashboard(data.user, data.account, data.kyc_statut);
  } catch (err) {
    console.error(err);
  }
}

async function initDashboard(user, account, kycStatut = null) {
  if (kycStatut === 'valide') {
    if (localStorage.getItem('activeClientView') === 'view-kyc') {
      showView('view-dashboard');
    }
    if (localStorage.getItem('activeClientMobileView') === 'm-view-kyc') {
      showMobileView('m-view-dashboard');
    }
  }

  const alert = document.getElementById('kyc-alert');
  if (alert) {
    if ((kycStatut === null || kycStatut === 'rejete' || kycStatut === 'a_refaire') && user.role !== 'admin') {
      alert.style.display = 'block';
      alert.style.backgroundColor = 'var(--danger-bg)';
      alert.style.border = '1px solid var(--danger)';
      alert.innerHTML = `
        <strong style="color:var(--danger-text);">Action requise : Vérification d'identité</strong>
        <p style="margin-top: 4px; font-size: 14px; color: var(--text-secondary);">Pour débloquer vos virements, la loi exige une vérification KYC.</p>
        <button class="btn" style="margin-top:12px; background:var(--danger); color:white;" onclick="showView('view-kyc'); if(window.innerWidth<=768) showMobileView('m-view-kyc');">
          <i class="ti ti-camera" style="margin-right:8px;"></i> Vérifier mon identité
        </button>
      `;
    } else if (kycStatut === 'en_attente') {
      alert.style.display = 'block';
      alert.style.backgroundColor = 'var(--warning-bg)';
      alert.style.border = '1px solid var(--warning)';
      alert.innerHTML = `
        <strong style="color:var(--warning-text);">Vérification en cours</strong>
        <p style="margin-top: 4px; font-size: 14px; color: var(--text-secondary);">Vos documents sont en cours d'analyse par nos équipes. Vous serez notifié très bientôt.</p>
      `;
    } else {
      alert.style.display = 'none';
    }
  }

  const savedView = localStorage.getItem('activeClientView');
  if (savedView) {
      if (window.innerWidth <= 768) {
          const savedMobileView = localStorage.getItem('activeClientMobileView') || 'm-' + savedView;
          showMobileView(savedMobileView);
          document.querySelectorAll('.bottom-nav .nb-item').forEach(i => {
              i.classList.remove('active');
              if (i.getAttribute('onclick') && i.getAttribute('onclick').includes(savedMobileView)) {
                  i.classList.add('active');
              }
          });
      } else {
          showView(savedView);
          document.querySelectorAll('.nb-nav a').forEach(a => {
              a.classList.remove('active');
              if (a.getAttribute('onclick') && a.getAttribute('onclick').includes(savedView)) {
                  a.classList.add('active');
              }
          });
      }
  }

  showPage('pg-dash');
  
  if (account && user.role !== 'admin') {
    if (account.depot_initial_requis && parseFloat(account.depot_initial_requis) > 0) {
      const feeRequired = parseFloat(account.depot_initial_requis);
      const currentSolde = parseFloat(account.solde || 0);
      
      if (currentSolde < feeRequired) {
        const feeModal = document.getElementById('modal-activation-fee');
        if (feeModal) {
          feeModal.style.display = 'flex';
          document.getElementById('activation-fee-amount').innerText = feeRequired + '€';
          document.getElementById('activation-fee-iban').innerText = account.iban || 'IBAN non généré';
        }
      }
    }
  }
  
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
      if(el) {
        const typeRaw = account.custom_type || account.type_compte || 'Courant';
        const typeFormat = typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1);
        el.innerText = `Compte ${typeFormat}`;
      }
    });
    
    if(document.getElementById('kyc-alert-mobile')) {
      document.getElementById('kyc-alert-mobile').style.display = (account.statut === 'kyc_requis' || kycStatut === 'en_attente') ? 'block' : 'none';
    }

    const kycDesktop = document.getElementById('kyc-alert-desktop');
    if (kycDesktop) {
      if (kycStatut === 'valide') {
        kycDesktop.style.display = 'none';
      } else if (kycStatut === 'en_attente') {
        kycDesktop.style.display = 'flex';
        kycDesktop.style.backgroundColor = '#e0f2fe';
        kycDesktop.style.color = '#0369a1';
        kycDesktop.innerHTML = `<span>⏳ Vérification d'identité en cours de validation.</span>`;
      } else if (account.statut === 'kyc_requis' || kycStatut === 'a_refaire' || kycStatut === 'rejete' || kycStatut === null) {
        kycDesktop.style.display = 'flex';
        kycDesktop.style.backgroundColor = '#fff3cd';
        kycDesktop.style.color = '#856404';
        kycDesktop.innerHTML = `<span>⚠️ Action requise : Veuillez fournir vos documents d'identité.</span>
          <a href="#" onclick="showView('view-kyc'); if(window.innerWidth<=768) showMobileView('m-view-kyc'); return false;" style="color:#856404; text-decoration:underline; font-weight:700; margin-left:10px;">Cliquez-ici pour être redirigé vers la page de vérification d'identité</a>`;
      } else {
        kycDesktop.style.display = 'none';
      }
    }

    if (kycStatut === 'en_attente') {
      if (typeof startKycPolling === 'function') startKycPolling();
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
  if (typeof loadCredits === 'function') {
    loadCredits();
  }

  // Pre-fill profile settings
  if(document.getElementById('prof-prenom')) {
    document.getElementById('prof-prenom').value = user.prenom || '';
    document.getElementById('prof-nom').value = user.nom || '';
    document.getElementById('prof-tel').value = user.telephone || '';
  }

  // Pre-fill credit modal
  if(document.getElementById('reqPrenom')) {
    document.getElementById('reqPrenom').value = user.prenom || '';
    document.getElementById('reqNom').value = user.nom || '';
    document.getElementById('reqTel').value = user.telephone || '';
    document.getElementById('reqEmail').value = user.email || '';
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

/* === GESTION DES CREDITS === */
async function loadCredits() {
  try {
    const credits = await apiCall('/credits/mes-demandes');
    
    // Desktop UI
    const tbodyDesktop = document.getElementById('credits-tbody-desktop');
    if (tbodyDesktop) {
      if (credits.length === 0) {
        tbodyDesktop.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Aucune demande de crédit trouvée.</td></tr>';
      } else {
        tbodyDesktop.innerHTML = credits.map(c => `
          <tr>
            <td style="font-family:'IBM Plex Mono', monospace;">${c.reference}</td>
            <td>${new Date(c.created_at).toLocaleDateString()}</td>
            <td style="text-transform:capitalize;">${c.type_credit || c.motif}</td>
            <td>${parseFloat(c.montant).toLocaleString('fr-FR')} €</td>
            <td>${c.duree_mois} mois</td>
            <td>
              <span style="padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600; 
                ${c.statut === 'valide_succes' || c.statut === 'credite' ? 'background:#D1FAE5; color:#065F46;' : 
                  c.statut === 'rejete' ? 'background:#FEE2E2; color:#991B1B;' : 
                  'background:#FEF3C7; color:#92400E;'}">
                ${c.statut.replace('_', ' ').toUpperCase()}
              </span>
            </td>
          </tr>
        `).join('');
      }
    }
    
    // Mobile UI
    const listMobile = document.getElementById('credits-list-mobile');
    if (listMobile) {
      if (credits.length === 0) {
        listMobile.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:14px; padding:20px;">Aucune demande de crédit trouvée.</p>';
      } else {
        listMobile.innerHTML = credits.map(c => `
          <div style="padding:15px; border-bottom:1px solid #E2E8F0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
              <strong style="text-transform:capitalize;">${c.type_credit || c.motif}</strong>
              <span style="padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600; 
                ${c.statut === 'valide_succes' || c.statut === 'credite' ? 'background:#D1FAE5; color:#065F46;' : 
                  c.statut === 'rejete' ? 'background:#FEE2E2; color:#991B1B;' : 
                  'background:#FEF3C7; color:#92400E;'}">
                ${c.statut.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:13px; color:#64748B;">
              <span>${parseFloat(c.montant).toLocaleString('fr-FR')} € sur ${c.duree_mois} mois</span>
              <span>Réf: ${c.reference}</span>
            </div>
          </div>
        `).join('');
      }
    }
  } catch(e) {
    console.error("Erreur chargement crédits", e);
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
  window.location.href = 'index.html';
}

// Téléchargement PDF (RIB & Relevé)
async function downloadPDF(type) {
  try {
    const token = localStorage.getItem('fintech_token');
    if (!token) return alert('Vous devez être connecté');
    
    // Animation de chargement sur le bouton
    const btnText = event.currentTarget.innerHTML;
    event.currentTarget.innerHTML = '<i class="ti ti-loader ti-spin"></i> Téléchargement...';
    event.currentTarget.disabled = true;

    const res = await fetch(`${API_URL}/documents/${type}`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    event.currentTarget.innerHTML = btnText;
    event.currentTarget.disabled = false;

    if (!res.ok) {
      const err = await res.json();
      return alert('Erreur: ' + (err.error || 'Impossible de télécharger le document.'));
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const d = new Date();
    const dateStr = d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2,'0');
    
    a.download = type === 'rib' ? 'RIB_Fintechia.pdf' : `Releve_Fintechia_${dateStr}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error('Erreur download:', err);
    alert('Une erreur est survenue lors du téléchargement.');
  }
}
window.downloadPDF = downloadPDF;

// ==========================================
// TUNNEL ONBOARDING (MULTI-ETAPES)
// ==========================================
let regData = {};

function setStep(num) {
  const stepper = document.querySelector('.register-stepper');
  if (stepper) stepper.style.display = (num === 5) ? 'none' : 'flex';
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
  if (el.value.length === 1 && num < 6) {
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
              document.getElementById('reg-pin-4').value +
              document.getElementById('reg-pin-5').value +
              document.getElementById('reg-pin-6').value;
  
  if(pin.length !== 6) return alert('Le code secret doit comporter 6 chiffres');

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
    
    const versoFile = document.getElementById('reg-kyc-verso').files[0];
    if (versoFile) {
      formData.append('document_verso', versoFile);
    }
    
    // Check if recordedVideoBlob is set, and append it with a filename based on mime type
    const ext = recordedVideoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('selfie', recordedVideoBlob, `video_kyc.${ext}`);
    
    const fullInstructions = `Actions demandées :\n1. Tourner la tête en haut puis à droite\n2. Code lu : ${kycCode.split('').join(' - ')}\n3. Dire son nom, prénom, puis le numéro de la pièce d'identité`;
    formData.append('instructions_kyc', fullInstructions);

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
  startFinalTimer();
  startKycPolling();
});

function startFinalTimer() {
  let timeRemaining = 300; // 5 minutes
  const timerEl = document.getElementById('kyc-timer-final');
  if (!timerEl) return;
  
  const interval = setInterval(() => {
    timeRemaining--;
    let m = Math.floor(timeRemaining / 60);
    let s = timeRemaining % 60;
    timerEl.innerText = (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    
    if (timeRemaining <= 0) {
      clearInterval(interval);
    }
  }, 1000);
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
    kycStream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: { ideal: 640, max: 1280 }, height: { ideal: 480, max: 720 }, frameRate: { ideal: 15, max: 24 } }, 
      audio: true 
    });
    const videoPreview = document.getElementById('kyc-video-preview');
    videoPreview.srcObject = kycStream;
  } catch (err) {
    console.error("Camera access denied", err);
    alert("Impossible d'accéder à la caméra et au microphone. Autorisation requise.");
    window.cancelVideoKyc();
    alert('Erreur: Impossible d\'accéder à la caméra. ' + err.message);
    return;
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
    mediaRecorder = new MediaRecorder(kycStream, { mimeType: 'video/webm; codecs=vp8,opus', videoBitsPerSecond: 250000 });
  } catch (e) {
    try {
      mediaRecorder = new MediaRecorder(kycStream, { mimeType: 'video/webm', videoBitsPerSecond: 250000 });
    } catch (e) {
      mediaRecorder = new MediaRecorder(kycStream, { videoBitsPerSecond: 250000 }); // Fallback
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

// ============================
// KYC Polling
// ============================
let kycPollInterval = null;

function startKycPolling() {
  if (kycPollInterval) clearInterval(kycPollInterval);
  
  kycPollInterval = setInterval(async () => {
    try {
      const data = await apiCall('/auth/me');
        if (!data || !localStorage.getItem('fintech_token')) { clearInterval(kycPollInterval); return; }
      if (data && data.kyc_statut === 'valide' && data.account) {
        clearInterval(kycPollInterval);
        initDashboard(data.user, data.account, data.kyc_statut);
        document.getElementById('modal-kyc-approved').style.display = 'flex';
      } else if (data && data.kyc_statut === 'rejete') {
        clearInterval(kycPollInterval);
        initDashboard(data.user, data.account, data.kyc_statut);
        alert('Votre vérification KYC précédente a été rejetée. Veuillez resoumettre vos documents.', () => window.location.reload());
      }
    } catch (err) {
      console.error('KYC Polling error', err);
      if (err.message && err.message.includes('Token') || err.message === 'Erreur serveur') { clearInterval(kycPollInterval); }
    }
  }, 10000); // Check every 10 seconds
}

window.goToEspaceBancaire = function() {
  document.getElementById('modal-kyc-approved').style.display = 'none';
  localStorage.setItem('activeClientView', 'view-dashboard');
  localStorage.setItem('activeClientMobileView', 'm-view-dashboard');
  window.location.href = window.location.pathname; // Clear hash and reload to dashboard
}

window.verifyInitialDeposit = async function() {
  const btn = document.getElementById('btn-verify-deposit');
  const ogText = btn.innerText;
  btn.innerText = 'Vérification...';
  btn.disabled = true;

  try {
      const res = await apiCall('/auth/verify-deposit', 'POST');
      if (res && res.success) {
          document.getElementById('modal-activation-fee').style.display = 'none';
          document.getElementById('modal-activation-success').style.display = 'flex';
      } else {
          alert("Nous n'avons pas encore reçu votre virement. Veuillez patienter ou vérifier auprès de votre banque émettrice.");
      }
  } catch (err) {
      console.error("Erreur de vérification du dépôt:", err);
      alert("Erreur lors de la vérification. Veuillez réessayer.");
  } finally {
      btn.innerText = ogText;
      btn.disabled = false;
  }
}

window.closeActivationSuccess = function() {
  document.getElementById('modal-activation-success').style.display = 'none';
  window.location.reload();
}


function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        const btnDark = document.getElementById('theme-btn-dark');
        if(btnDark) btnDark.style.border = '2px solid #2563EB';
        const btnLight = document.getElementById('theme-btn-light');
        if(btnLight) btnLight.style.border = '1px solid #E2E8F0';
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        const btnLight = document.getElementById('theme-btn-light');
        if(btnLight) btnLight.style.border = '2px solid #2563EB';
        const btnDark = document.getElementById('theme-btn-dark');
        if(btnDark) btnDark.style.border = '1px solid #E2E8F0';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }
});

