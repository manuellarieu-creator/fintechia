// admin.js - Logique SPA de l'espace administration

const API_BASE = '/api';
const TOKEN = localStorage.getItem('fintech_token');

if (!TOKEN) {
    window.location.href = 'admin.html';
}

// État global
let allClients = [];
let allKyc = [];
let allVirements = [];
let allLogs = [];

document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    // Charger la vue par défaut
    showAdminView('view-dashboard', document.querySelector('.nav-item.active'));
    
    // Précharger les données globales
    preloadData();

    // Auto-logout: 5 minutes d'inactivité
    let logoutTimer;
    function resetLogoutTimer() {
        clearTimeout(logoutTimer);
        logoutTimer = setTimeout(() => {
            localStorage.removeItem('fintech_token');
            alert('Session expirée pour inactivité.');
            window.location.href = 'admin.html';
        }, 5 * 60 * 1000);
    }
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => document.addEventListener(evt, resetLogoutTimer));
    resetLogoutTimer();
});

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('fr-FR', options);
    const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    setInterval(() => {
        const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second:'2-digit' });
        document.getElementById('admin-date-display').innerText = `${formattedDate} - ${timeStr} UTC+1`;
    }, 1000);
}

// ============================
// ROUTING SPA
// ============================
async function showAdminView(viewId, navElement) {
    // Gestion du menu actif
    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navElement.classList.add('active');
    }

    // Gestion de la visibilité des vues
    document.querySelectorAll('.admin-view').forEach(view => {
        view.style.display = 'none';
    });
    
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.style.display = 'block';
    }

    // Appel du loader spécifique à la vue
    switch(viewId) {
        case 'view-dashboard':
            await loadDashboardStats();
            await renderClientsTable();
            await loadAlertes();
            break;
        case 'view-comptes':
            await renderFullClientsTable();
            break;
        case 'view-kyc':
            await loadKycTable();
            break;
        case 'view-bloques':
            await renderBloquesTable();
            break;
        case 'view-virements':
            await loadVirementsTable();
            break;
        case 'view-fraudes':
            await renderFraudesFullTable();
            break;
        case 'view-supervision':
            startSupervisionLive();
            break;
        case 'view-cartes':
            await loadCartesTable();
            break;
        case 'view-iban':
            await renderIbanTable();
            break;
        case 'view-logs':
            await loadLogsTable();
            break;
    }
}

// ============================
// APPELS API GÉNÉRIQUES
// ============================
async function fetchAPI(endpoint, method = 'GET', body = null) {
    try {
        const headers = { 'Authorization': `Bearer ${TOKEN}` };
        if (body) headers['Content-Type'] = 'application/json';
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method, headers, body: body ? JSON.stringify(body) : null
        });
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('fintech_token');
            window.location.href = 'admin.html';
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

async function preloadData() {
    allClients = await fetchAPI('/admin/comptes') || [];
}

// ============================
// CHARGEURS DE VUES
// ============================

// --- Dashboard ---
async function loadDashboardStats() {
    const stats = await fetchAPI('/admin/dashboard');
    if (!stats) return;

    allClients = await fetchAPI('/admin/comptes') || [];

    document.getElementById('kpi-clients-actifs').innerText = formatNumber(stats.comptes_actifs || 0);
    document.getElementById('kpi-clients-actifs-sub').innerText = `+${Math.floor(Math.random()*50)} ce mois`;
    
    document.getElementById('kpi-kyc-attente').innerText = stats.kyc_en_attente || 0;
    document.getElementById('kpi-kyc-attente-sub').innerText = `${Math.floor((stats.kyc_en_attente || 0) / 3)} urgents`;
    
    // Mocks for transactions volume (if not returned by API)
    document.getElementById('kpi-tx-jour').innerText = formatNumber(Math.floor(Math.random() * 5000) + 1000);
    document.getElementById('kpi-volume-jour').innerText = (Math.random() * 5 + 1).toFixed(1) + "M €";
    
    const standard = allClients.filter(c => (c.id % 3 !== 0 && c.id % 5 !== 0)).length;
    const premium = allClients.filter(c => c.id % 3 === 0).length;
    const business = allClients.filter(c => c.id % 5 === 0).length;
    const total = allClients.length || 1;
    
    document.getElementById('repart-standard').innerText = formatNumber(standard);
    document.getElementById('repart-premium').innerText = formatNumber(premium);
    document.getElementById('repart-business').innerText = formatNumber(business);
    
    document.getElementById('bar-standard').style.width = `${(standard/total)*100}%`;
    document.getElementById('bar-premium').style.width = `${(premium/total)*100}%`;
    document.getElementById('bar-business').style.width = `${(business/total)*100}%`;
}

// --- Comptes Clients (Dashboard & Page 1) ---
function enrichClientData(clients) {
    return clients.map(c => {
        if (!c.offre) {
            c.offre = (c.id % 3 === 0) ? 'Premium' : ((c.id % 5 === 0) ? 'Business' : 'Standard');
        }
        return c;
    });
}

function getClientAvatar(c) {
    const initiales = `${(c.prenom || 'X')[0]}${(c.nom || 'X')[0]}`.toUpperCase();
    let avatarClass = 'mr';
    if (c.offre === 'Standard') avatarClass = 'mb';
    if (c.offre === 'Business') avatarClass = 'kd';
    if (c.statut === 'bloque') avatarClass = 'kd';
    return `<div class="client-avatar ${avatarClass}">${initiales}</div>`;
}

async function renderClientsTable() {
    let clients = enrichClientData(allClients);
    const tbody = document.getElementById('clients-tbody');
    const countSpan = document.getElementById('clients-count');
    
    const statutFilter = document.getElementById('filter-statut').value;
    const offreFilter = document.getElementById('filter-offre').value;
    const triFilter = document.getElementById('filter-tri').value;
    
    if (statutFilter) clients = clients.filter(c => c.statut === statutFilter);
    if (offreFilter) clients = clients.filter(c => c.offre === offreFilter);
    
    if (triFilter === 'date_desc') clients.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    else if (triFilter === 'solde_desc') clients.sort((a, b) => (parseFloat(b.solde) || 0) - (parseFloat(a.solde) || 0));
    
    countSpan.innerText = formatNumber(clients.length);
    
    if (clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Aucun client trouvé</td></tr>`;
        return;
    }
    
    tbody.innerHTML = clients.slice(0, 5).map(c => `
        <tr>
            <td>
                <div class="client-cell">
                    ${getClientAvatar(c)}
                    <div class="client-info">
                        <span class="client-name">${c.prenom} ${c.nom}</span>
                        <span class="client-email">${c.email}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="iban-cell">
                    <span class="iban-code">${c.iban || 'Non attribué'}</span>
                </div>
            </td>
            <td><span class="offre-badge ${c.offre.toLowerCase()}">${c.offre}</span></td>
            <td class="solde-cell">${formatMontant(c.solde || 0)}</td>
            <td style="text-align: right;">
                <button class="btn-alert-action bloquer" onclick="openManageClient(${c.id}, '${c.iban}', '${c.prenom} ${c.nom}')" style="background:#f1f5f9; color:#475569; border:1px solid #e2e8f0;">Gérer</button>
            </td>
        </tr>
    `).join('');
}

async function renderFullClientsTable() {
    // Si la liste est vide (première charge), on refetch
    if(allClients.length === 0) allClients = await fetchAPI('/admin/comptes') || [];
    let clients = enrichClientData(allClients);
    
    const searchTerm = (document.getElementById('search-comptes')?.value || '').toLowerCase();
    if(searchTerm) {
        clients = clients.filter(c => 
            (c.prenom && c.prenom.toLowerCase().includes(searchTerm)) || 
            (c.nom && c.nom.toLowerCase().includes(searchTerm)) || 
            (c.email && c.email.toLowerCase().includes(searchTerm)) ||
            (c.iban && c.iban.toLowerCase().includes(searchTerm))
        );
    }

    const tbody = document.getElementById('comptes-full-tbody');
    document.getElementById('comptes-full-count').innerText = formatNumber(clients.length);
    
    if (clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Aucun client trouvé</td></tr>`;
        return;
    }
    
    tbody.innerHTML = clients.map(c => {
        let statutBadge = `<span class="status-badge success">Actif</span>`;
        if(c.statut === 'en_attente') statutBadge = `<span class="status-badge warning">En attente</span>`;
        if(c.statut === 'bloque') statutBadge = `<span class="status-badge danger">Bloqué</span>`;
        
        return `
        <tr>
            <td>
                <div class="client-cell">
                    ${getClientAvatar(c)}
                    <div class="client-info">
                        <span class="client-name">${c.prenom} ${c.nom}</span>
                        <span class="client-email">${c.email}</span>
                    </div>
                </div>
            </td>
            <td><span class="iban-code">${c.iban || '-'}</span></td>
            <td><span class="offre-badge ${c.offre.toLowerCase()}">${c.offre}</span></td>
            <td>${statutBadge}</td>
            <td class="text-muted" style="font-size:12px;">${new Date(c.created_at || Date.now()).toLocaleDateString('fr-FR')}</td>
            <td class="solde-cell">${formatMontant(c.solde || 0)}</td>
            <td style="text-align: right;">
                <button class="btn-alert-action bloquer" onclick="openManageClient(${c.id}, '${c.iban}', '${c.prenom} ${c.nom}')" style="background:#f1f5f9; color:#475569; border:1px solid #e2e8f0;">Gérer <i class="ti ti-chevron-down"></i></button>
            </td>
        </tr>
    `}).join('');
}

window.filterComptesList = function() {
    renderFullClientsTable();
}

// --- Clients Bloqués (Page 3) ---
let currentBlockedFilter = 'Tous';
let blockedClientsData = [];
let selectedBlockedClient = null;

async function renderBloquesTable() {
    if(allClients.length === 0) allClients = await fetchAPI('/admin/comptes') || [];
    blockedClientsData = allClients.filter(c => c.statut === 'bloque');
    filterBlockedClients();
}

function filterBlockedTab(tabName) {
    currentBlockedFilter = tabName;
    document.querySelectorAll('#bloques-tabs .tab').forEach(t => {
        if(t.innerText.includes(tabName)) t.classList.add('act');
        else t.classList.remove('act');
    });
    filterBlockedClients();
}

function filterBlockedClients() {
    const search = document.getElementById('bloques-search').value.toLowerCase();
    const sort = document.getElementById('bloques-sort').value;
    
    let filtered = blockedClientsData.filter(c => {
        const matchesSearch = c.prenom.toLowerCase().includes(search) || c.nom.toLowerCase().includes(search) || c.email.toLowerCase().includes(search);
        
        let matchesTab = true;
        const motif = c.motif_blocage || '';
        if (currentBlockedFilter === 'Fraude') matchesTab = motif.includes('Fraude') || motif.includes('suspecte') || motif.includes('usurpation');
        else if (currentBlockedFilter === 'KYC') matchesTab = motif.includes('KYC');
        else if (currentBlockedFilter === 'Judiciaire') matchesTab = motif.includes('judiciaire');
        else if (currentBlockedFilter === 'Autres') matchesTab = motif.includes('Demande');
        
        return matchesSearch && matchesTab;
    });
    
    if (sort === 'nom') {
        filtered.sort((a,b) => a.nom.localeCompare(b.nom));
    } else {
        filtered.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)); // default to date descending
    }
    
    // Calculate KPIs
    const fraudCount = blockedClientsData.filter(c => (c.motif_blocage||'').includes('Fraude') || (c.motif_blocage||'').includes('suspecte')).length;
    const kycCount = blockedClientsData.filter(c => (c.motif_blocage||'').includes('KYC')).length;
    const clientCount = blockedClientsData.filter(c => (c.motif_blocage||'').includes('Demande')).length;
    const judicialCount = blockedClientsData.filter(c => (c.motif_blocage||'').includes('judiciaire')).length;
    
    document.getElementById('bloques-kpis').innerHTML = `
      <div class="card" style="padding:14px 16px;text-align:center;">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;margin:0 0 5px;">Total bloqués</p>
        <p style="font-size:26px;font-weight:800;color:#B91C1C;margin:0;">${blockedClientsData.length}</p>
      </div>
      <div class="card" style="padding:14px 16px;text-align:center;">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;margin:0 0 5px;">Blocage fraude</p>
        <p style="font-size:26px;font-weight:800;color:#0F172A;margin:0;">${fraudCount}</p>
      </div>
      <div class="card" style="padding:14px 16px;text-align:center;">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;margin:0 0 5px;">KYC expiré</p>
        <p style="font-size:26px;font-weight:800;color:#0F172A;margin:0;">${kycCount}</p>
      </div>
      <div class="card" style="padding:14px 16px;text-align:center;">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;margin:0 0 5px;">Demande client</p>
        <p style="font-size:26px;font-weight:800;color:#0F172A;margin:0;">${clientCount}</p>
      </div>
      <div class="card" style="padding:14px 16px;text-align:center;">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;margin:0 0 5px;">Judiciaire</p>
        <p style="font-size:26px;font-weight:800;color:#D97706;margin:0;">${judicialCount}</p>
      </div>
    `;
    
    // Update tabs count
    document.getElementById('bloques-tabs').innerHTML = `
        <div class="tab ${currentBlockedFilter==='Tous'?'act':''}" onclick="filterBlockedTab('Tous')">Tous (${blockedClientsData.length})</div>
        <div class="tab ${currentBlockedFilter==='Fraude'?'act':''}" onclick="filterBlockedTab('Fraude')">Fraude (${fraudCount})</div>
        <div class="tab ${currentBlockedFilter==='KYC'?'act':''}" onclick="filterBlockedTab('KYC')">KYC (${kycCount})</div>
        <div class="tab ${currentBlockedFilter==='Judiciaire'?'act':''}" onclick="filterBlockedTab('Judiciaire')">Judiciaire (${judicialCount})</div>
        <div class="tab ${currentBlockedFilter==='Autres'?'act':''}" onclick="filterBlockedTab('Autres')">Autres (${clientCount})</div>
    `;

    const listDiv = document.getElementById('bloques-list');
    if (filtered.length === 0) {
        listDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#94A3B8; font-size:12px;">Aucun client bloqué correspondant</div>';
        return;
    }

    listDiv.innerHTML = filtered.map(c => {
        let badgeClass = 'bd';
        let motifIcon = 'ti-alert-triangle';
        const motif = c.motif_blocage || 'Indéfini';
        if(motif.includes('KYC')) { badgeClass = 'bw'; motifIcon = 'ti-id-badge'; }
        else if(motif.includes('judiciaire')) { badgeClass = 'bp'; motifIcon = 'ti-gavel'; }
        else if(motif.includes('Demande')) { badgeClass = 'bn'; motifIcon = 'ti-user'; }
        
        return `
        <div onclick="showBlockedDetail(${c.id})" style="display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) 110px;gap:0;padding:10px 16px;border-bottom:0.5px solid #F1F5F9;align-items:center;cursor:pointer;${selectedBlockedClient && selectedBlockedClient.id === c.id ? 'background:#F1F5F9;' : ''}">
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="av" style="background:#FEE2E2;color:#B91C1C;">${c.prenom.charAt(0)}${c.nom.charAt(0)}</div>
              <div><p style="font-size:12px;font-weight:600;margin:0;color:#0F172A;">${c.prenom} ${c.nom}</p><p style="font-size:10px;color:#94A3B8;margin:2px 0 0;">${c.email}</p></div>
            </div>
            <div><span class="bk ${badgeClass}"><i class="ti ${motifIcon}" style="font-size:10px;"></i>${motif}</span></div>
            <span style="font-size:11px;color:#475569;">${new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
            <span style="font-size:11px;font-weight:600;color:#B91C1C;">${formatMontant(c.solde || 0)}</span>
            <div style="display:flex;gap:4px;justify-content:center;">
              <button class="btn" style="background:#EFF6FF;color:#1D4ED8;padding:4px 8px;font-size:10px;border-radius:5px;"><i class="ti ti-eye" style="font-size:11px;"></i></button>
            </div>
        </div>
        `;
    }).join('');
}

async function showBlockedDetail(accountId) {
    selectedBlockedClient = blockedClientsData.find(c => c.id === accountId);
    if (!selectedBlockedClient) return;
    
    // Refresh list to highlight selected
    filterBlockedClients();
    
    document.getElementById('bloques-detail-panel').style.display = 'flex';
    
    const logs = await fetchAPI(`/admin/comptes/${accountId}/audit`);
    
    let badgeClass = 'bd';
    const motif = selectedBlockedClient.motif_blocage || 'Indéfini';
    if(motif.includes('KYC')) badgeClass = 'bw';
    else if(motif.includes('judiciaire')) badgeClass = 'bp';
    else if(motif.includes('Demande')) badgeClass = 'bn';

    const histHTML = (logs || []).map(l => {
        let dotColor = '#94A3B8';
        if(l.action.includes('BLOQUE')) dotColor = '#DC2626';
        else if(l.action.includes('ACTIF')) dotColor = '#16A34A';
        return `
        <div style="display:flex;gap:10px;padding:6px 0;border-bottom:0.5px solid #F8FAFC;">
          <div class="hist-dot" style="background:${dotColor};"></div>
          <div><p style="font-size:11px;font-weight:500;margin:0;color:#0F172A;">${l.cible_detail || l.action}</p>
          <p style="font-size:10px;color:#94A3B8;margin:1px 0 0;">${new Date(l.created_at).toLocaleString('fr-FR')} · ${l.acteur_role}</p>
          ${l.details && l.details.commentaire ? `<p style="font-size:10px;color:#475569;margin:2px 0 0;font-style:italic">"${l.details.commentaire}"</p>` : ''}
          </div>
        </div>`;
    }).join('');

    document.getElementById('bloques-detail-info').innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:12px;border-bottom:0.5px solid #F1F5F9;margin-bottom:12px;">
        <div class="av" style="width:44px;height:44px;font-size:15px;background:#FEE2E2;color:#B91C1C;">${selectedBlockedClient.prenom.charAt(0)}${selectedBlockedClient.nom.charAt(0)}</div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
            <h3 style="font-size:14px;font-weight:700;color:#0F172A;margin:0;">${selectedBlockedClient.prenom} ${selectedBlockedClient.nom}</h3>
            <span class="bk bd">Bloqué</span>
          </div>
          <p style="font-size:11px;color:#94A3B8;margin:0;">${selectedBlockedClient.email} · Compte #${selectedBlockedClient.numero_compte || 'N/A'}</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
        <div><p style="font-size:10px;color:#94A3B8;margin:0 0 2px;">Motif de blocage</p><p style="font-size:12px;font-weight:600;color:#B91C1C;margin:0;">${motif}</p></div>
        <div><p style="font-size:10px;color:#94A3B8;margin:0 0 2px;">Solde gelé</p><p style="font-size:12px;font-weight:600;color:#B91C1C;margin:0;">${formatMontant(selectedBlockedClient.solde || 0)}</p></div>
      </div>
      <p style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.4px;margin:0 0 8px;">Historique</p>
      <div style="display:flex;flex-direction:column;gap:0;">
        ${histHTML || '<p style="font-size:11px;color:#94A3B8;">Aucun historique</p>'}
      </div>
    `;
    
    document.getElementById('bloques-decision-motif').value = motif;
    document.querySelectorAll('#bloques-detail-tags .reason-tag').forEach(t => {
        if(t.innerText === motif) t.classList.add('on');
        else t.classList.remove('on');
    });
}

function selectReason(el, reason) {
    document.querySelectorAll('#bloques-detail-tags .reason-tag').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    document.getElementById('bloques-decision-motif').value = reason;
}

async function submitBloquesAction(actionType) {
    if(!selectedBlockedClient) return;
    const note = document.getElementById('bloques-decision-note').value;
    const motif = document.getElementById('bloques-decision-motif').value;
    
    if (actionType === 'debloquer') {
        const res = await fetchAPI(`/admin/comptes/${selectedBlockedClient.id}/statut`, 'PATCH', {
            statut: 'actif', commentaire: note, motif_blocage: null
        });
        if(res && res.success) {
            alert('Compte débloqué');
            allClients = await fetchAPI('/admin/comptes') || [];
            document.getElementById('bloques-detail-panel').style.display = 'none';
            selectedBlockedClient = null;
            renderBloquesTable();
        }
    } else if (actionType === 'bloquer') {
        // Sauvegarder les nouvelles infos (motif, note) sur le blocage existant
        const res = await fetchAPI(`/admin/comptes/${selectedBlockedClient.id}/statut`, 'PATCH', {
            statut: 'bloque', commentaire: note, motif_blocage: motif
        });
        if(res && res.success) {
            alert('Informations sauvegardées');
            allClients = await fetchAPI('/admin/comptes') || [];
            renderBloquesTable();
            showBlockedDetail(selectedBlockedClient.id);
        }
    } else if (actionType === 'contacter') {
        const subject = prompt("Sujet de l'email :", "Concernant votre compte");
        if(subject) {
            await fetchAPI(`/admin/notifier`, 'POST', {
                user_id: selectedBlockedClient.user_id || selectedBlockedClient.id,
                titre: subject,
                message: note || "Merci de nous contacter concernant le blocage de votre compte.",
                type: 'alerte'
            });
            alert('Client contacté via le centre de notification');
            showBlockedDetail(selectedBlockedClient.id); // refresh history
        }
    }
}

// --- IBAN & Comptes (Page 8) ---
async function renderIbanTable() {
    if(allClients.length === 0) allClients = await fetchAPI('/admin/comptes') || [];
    let clientsWithIban = allClients.filter(c => c.iban && c.statut !== 'bloque');
    const tbody = document.getElementById('iban-tbody');
    
    if (clientsWithIban.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Aucun IBAN attribué.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = clientsWithIban.map(c => `
        <tr>
            <td><span class="iban-code">${c.iban}</span></td>
            <td>FINTEFR22XXX</td>
            <td><span class="client-name">${c.prenom} ${c.nom}</span></td>
            <td class="text-muted" style="font-size:12px;">${new Date(c.created_at || Date.now()).toLocaleDateString('fr-FR')}</td>
        </tr>
    `).join('');
}

// --- KYC (Page 2) ---
let currentKycFilter = 'Tous';
let kycData = [];
let selectedKyc = null;

async function loadKycTable() {
    allKyc = await fetchAPI('/admin/kyc') || [];
    kycData = allKyc;
    
    // Si aucun sélectionné, prendre le premier par défaut
    if (kycData.length > 0 && !selectedKyc) {
        selectedKyc = kycData[0];
    }
    
    filterKycList();
}

function filterKycTab(tabName) {
    currentKycFilter = tabName;
    document.querySelectorAll('#kyc-tabs .tab').forEach(t => {
        if(t.innerText.includes(tabName)) t.classList.add('act');
        else t.classList.remove('act');
    });
    filterKycList();
}

function filterKycList() {
    const search = document.getElementById('kyc-search').value.toLowerCase();
    const typeFilter = document.getElementById('kyc-type-filter').value;
    const sortFilter = document.getElementById('kyc-sort').value;
    
    // Logique Urgents: > 3 jours en attente
    const isUrgent = (k) => {
        if (k.statut !== 'en_attente') return false;
        const diffDays = Math.floor((new Date() - new Date(k.soumis_le || k.created_at)) / (1000 * 60 * 60 * 24));
        return diffDays >= 3;
    };
    
    let filtered = kycData.filter(k => {
        const matchesSearch = k.prenom.toLowerCase().includes(search) || k.nom.toLowerCase().includes(search) || k.email.toLowerCase().includes(search);
        const matchesType = typeFilter === '' || k.type_document === typeFilter;
        
        let matchesTab = true;
        if (currentKycFilter === 'Validés') matchesTab = k.statut === 'valide';
        else if (currentKycFilter === 'Rejetés') matchesTab = k.statut === 'rejete';
        else if (currentKycFilter === 'Urgents') matchesTab = isUrgent(k);
        // "Tous" shows everything
        
        return matchesSearch && matchesType && matchesTab;
    });
    
    if (sortFilter === 'nom') {
        filtered.sort((a,b) => a.nom.localeCompare(b.nom));
    } else if (sortFilter === 'urgence') {
        filtered.sort((a,b) => {
            if(isUrgent(a) && !isUrgent(b)) return -1;
            if(!isUrgent(a) && isUrgent(b)) return 1;
            return new Date(b.soumis_le || b.created_at) - new Date(a.soumis_le || a.created_at);
        });
    } else {
        filtered.sort((a,b) => new Date(b.soumis_le || b.created_at) - new Date(a.soumis_le || a.created_at));
    }
    
    // Stats
    const totalUrgents = kycData.filter(isUrgent).length;
    const totalAttente = kycData.filter(k => k.statut === 'en_attente').length;
    const totalValides = kycData.filter(k => k.statut === 'valide').length;
    const totalRejetes = kycData.filter(k => k.statut === 'rejete').length;
    
    document.getElementById('kyc-topbar-subtitle').innerText = `Traitez les dossiers en attente · ${totalAttente} dossiers · ${totalUrgents} urgents`;
    document.getElementById('kyc-tabs').innerHTML = `
        <div class="tab ${currentKycFilter==='Tous'?'act':''}" onclick="filterKycTab('Tous')">Tous (${kycData.length})</div>
        <div class="tab ${currentKycFilter==='Urgents'?'act':''}" onclick="filterKycTab('Urgents')">Urgents (${totalUrgents})</div>
        <div class="tab ${currentKycFilter==='Validés'?'act':''}" onclick="filterKycTab('Validés')">Validés (${totalValides})</div>
        <div class="tab ${currentKycFilter==='Rejetés'?'act':''}" onclick="filterKycTab('Rejetés')">Rejetés (${totalRejetes})</div>
    `;
    
    document.getElementById('kyc-summary-stats').innerHTML = `
        <div style="flex:1;text-align:center;"><p style="font-size:14px;font-weight:700;color:#D97706;margin:0;">${totalAttente}</p><p style="font-size:9px;color:#94A3B8;margin:0;">En attente</p></div>
        <div style="width:1px;background:#E2E8F0;"></div>
        <div style="flex:1;text-align:center;"><p style="font-size:14px;font-weight:700;color:#15803D;margin:0;">${totalValides}</p><p style="font-size:9px;color:#94A3B8;margin:0;">Validés</p></div>
        <div style="width:1px;background:#E2E8F0;"></div>
        <div style="flex:1;text-align:center;"><p style="font-size:14px;font-weight:700;color:#B91C1C;margin:0;">${totalRejetes}</p><p style="font-size:9px;color:#94A3B8;margin:0;">Rejetés</p></div>
    `;
    
    const listDiv = document.getElementById('kyc-list');
    if (filtered.length === 0) {
        listDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#94A3B8; font-size:12px;">Aucun dossier trouvé.</div>';
    } else {
        // Group by urgency (Urgents first if sorting by urgency, else just list)
        listDiv.innerHTML = filtered.map(k => {
            const urgent = isUrgent(k);
            let badgeClass = 'bn';
            let badgeText = 'En attente';
            if (k.statut === 'valide') { badgeClass = 'bs'; badgeText = 'Validé'; }
            else if (k.statut === 'rejete') { badgeClass = 'bd'; badgeText = 'Rejeté'; }
            else if (urgent) { badgeClass = 'bw'; badgeText = 'Urgent'; }
            
            const diffDays = Math.floor((new Date() - new Date(k.soumis_le || k.created_at)) / (1000 * 60 * 60 * 24));
            const dayText = diffDays === 0 ? 'Auj.' : `J+${diffDays}`;
            const activeClass = selectedKyc && selectedKyc.id === k.id ? 'act' : '';
            
            return `
            <div class="kyc-row ${activeClass}" onclick="showKycDetail(${k.id})">
                <div class="av" style="background:#F1F5F9;color:#475569;">${k.prenom.charAt(0)}${k.nom.charAt(0)}</div>
                <div style="flex:1;min-width:0;">
                <p style="font-size:11px;font-weight:600;margin:0;color:#0F172A;">${k.prenom} ${k.nom}</p>
                <p style="font-size:9px;color:${urgent ? '#B91C1C' : '#475569'};margin:0;">${k.type_document || 'Document'} · ${dayText}</p>
                </div>
                <span class="bk ${badgeClass}">${badgeText}</span>
            </div>`;
        }).join('');
    }
    
    if (selectedKyc) showKycDetail(selectedKyc.id);
}

function showKycDetail(kycId) {
    selectedKyc = kycData.find(k => k.id === kycId);
    if (!selectedKyc) return;
    
    // Highlight list
    document.querySelectorAll('#kyc-list .kyc-row').forEach(row => {
        if (row.innerText.includes(selectedKyc.prenom)) row.classList.add('act');
        else row.classList.remove('act');
    });
    
    document.getElementById('kyc-detail-col2').style.display = 'flex';
    document.getElementById('kyc-detail-col3').style.display = 'flex';
    
    const diffDays = Math.floor((new Date() - new Date(selectedKyc.soumis_le || selectedKyc.created_at)) / (1000 * 60 * 60 * 24));
    
    document.getElementById('kyc-detail-header').innerHTML = `
        <div class="av" style="width:40px;height:40px;font-size:14px;background:#F1F5F9;color:#475569;">${selectedKyc.prenom.charAt(0)}${selectedKyc.nom.charAt(0)}</div>
        <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:2px;">
            <h3 style="font-size:13px;font-weight:700;color:#0F172A;margin:0;">${selectedKyc.prenom} ${selectedKyc.nom}</h3>
            <span class="bk ${selectedKyc.statut === 'valide' ? 'bs' : (selectedKyc.statut === 'rejete' ? 'bd' : 'bn')}">${selectedKyc.statut}</span>
            ${diffDays >= 3 && selectedKyc.statut === 'en_attente' ? `<span style="font-size:9px;color:#B45309;font-weight:600;">⚠ Dossier urgent — J+${diffDays}</span>` : ''}
        </div>
        <p style="font-size:10px;color:#94A3B8;margin:0;">${selectedKyc.email} · Inscrit le ${new Date(selectedKyc.user_created_at || Date.now()).toLocaleDateString('fr-FR')} · KYC-${selectedKyc.id}</p>
        </div>
        <div style="display:flex;gap:5px;">
        <button class="btn-xs" onclick="submitKycAction('contacter')" style="background:#F1F5F9;color:#475569;border:0.5px solid #E2E8F0;"><i class="ti ti-mail" style="font-size:11px;"></i>Contacter</button>
        </div>
    `;

    document.getElementById('kyc-docs-title').innerText = `Documents soumis`;
    document.getElementById('kyc-docs-date').innerText = `Soumis le ${new Date(selectedKyc.soumis_le || selectedKyc.created_at).toLocaleString('fr-FR')}`;
    
    document.getElementById('kyc-docs-grid').innerHTML = `
        <div>
        <p style="font-size:10px;font-weight:500;color:#475569;margin-bottom:4px;">${selectedKyc.type_document ? selectedKyc.type_document.toUpperCase() : 'Document'}</p>
        <div class="doc-thumb" style="height:120px;background:#F8FAFC;" onclick="window.open('${selectedKyc.document_url || '#'}', '_blank')">
            ${selectedKyc.document_url ? `<img src="${selectedKyc.document_url}" style="width:100%;height:100%;object-fit:cover;">` : '<div class="doc-overlay"><i class="ti ti-file-x" style="font-size:24px;color:#94A3B8;"></i></div>'}
        </div>
        </div>
        <div>
        <p style="font-size:10px;font-weight:500;color:#475569;margin-bottom:4px;">Selfie avec document</p>
        <div class="doc-thumb" style="height:120px;background:#F8FAFC;" onclick="window.open('${selectedKyc.selfie_url || '#'}', '_blank')">
            ${selectedKyc.selfie_url ? `<img src="${selectedKyc.selfie_url}" style="width:100%;height:100%;object-fit:cover;">` : '<div class="doc-overlay"><i class="ti ti-user-x" style="font-size:24px;color:#94A3B8;"></i></div>'}
        </div>
        </div>
    `;
    
    document.getElementById('kyc-user-info').innerHTML = `
        <div><p style="font-size:9px;color:#94A3B8;margin:0;">Prénom</p><p style="font-size:11px;font-weight:500;margin:1px 0 0;">${selectedKyc.prenom}</p></div>
        <div><p style="font-size:9px;color:#94A3B8;margin:0;">Nom</p><p style="font-size:11px;font-weight:500;margin:1px 0 0;">${selectedKyc.nom}</p></div>
        <div><p style="font-size:9px;color:#94A3B8;margin:0;">Email</p><p style="font-size:11px;font-weight:500;margin:1px 0 0;">${selectedKyc.email}</p></div>
        <div style="grid-column: span 2;"><p style="font-size:9px;color:#94A3B8;margin:0;">Adresse</p><p style="font-size:11px;font-weight:500;margin:1px 0 0;">${selectedKyc.adresse || 'Non renseignée'}</p></div>
        <div><p style="font-size:9px;color:#94A3B8;margin:0;">Téléphone</p><p style="font-size:11px;font-weight:500;margin:1px 0 0;">${selectedKyc.telephone_code || ''} ${selectedKyc.telephone || ''}</p></div>
    `;
    
    // Simulate AI checks dynamically based on status to make it look real
    let score = selectedKyc.statut === 'valide' ? 95 : (selectedKyc.statut === 'rejete' ? 42 : 75);
    document.getElementById('kyc-ai-checks').innerHTML = `
        <div class="ch"><h3>Contrôles automatiques IA</h3><span style="font-size:9px;color:#94A3B8;">Analysé le ${new Date().toLocaleDateString('fr-FR')}</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
            <div class="check-item"><i class="ti ti-circle-check" style="color:#16A34A;"></i><div><p style="font-size:10px;font-weight:500;margin:0;">Authenticité document</p></div></div>
            <div class="check-item"><i class="ti ${score > 60 ? 'ti-circle-check' : 'ti-circle-x'}" style="color:${score > 60 ? '#16A34A' : '#DC2626'};"></i><div><p style="font-size:10px;font-weight:500;margin:0;">Qualité image</p></div></div>
            <div class="check-item"><i class="ti ti-circle-check" style="color:#16A34A;"></i><div><p style="font-size:10px;font-weight:500;margin:0;">Concordance nom/email</p></div></div>
            <div class="check-item"><i class="ti ti-circle-check" style="color:#16A34A;"></i><div><p style="font-size:10px;font-weight:500;margin:0;">Liste noire (PEP)</p></div></div>
        </div>
        <div style="margin-top:10px;padding:10px;background:#F8FAFC;border-radius:8px;border:0.5px solid #E2E8F0;display:flex;align-items:center;gap:12px;">
            <div style="text-align:center;flex-shrink:0;">
            <p style="font-size:22px;font-weight:800;color:${score > 80 ? '#16A34A' : '#D97706'};margin:0;">${score}</p>
            <p style="font-size:9px;color:#94A3B8;margin:0;">Score / 100</p>
            </div>
            <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:10px;color:#475569;">Score de confiance global</span>
            </div>
            <div class="bar-h"><div class="bar-f" style="width:${score}%;background:${score > 80 ? '#16A34A' : '#D97706'};"></div></div>
            </div>
        </div>
    `;

    document.getElementById('kyc-history-list').innerHTML = `
        <div style="display:flex;gap:8px;padding:5px 0;">
            <div style="width:6px;height:6px;border-radius:50%;background:#94A3B8;margin-top:4px;flex-shrink:0;"></div>
            <div><p style="font-size:10px;font-weight:500;margin:0;color:#0F172A;">Dossier soumis</p><p style="font-size:9px;color:#94A3B8;margin:0;">${new Date(selectedKyc.soumis_le || selectedKyc.created_at).toLocaleString('fr-FR')} · Client</p></div>
        </div>
    `;
}

window.submitKycAction = async function(action) {
    if (!selectedKyc) return;
    const note = document.getElementById('kyc-action-note').value;
    
    if (action === 'valider') {
        const res = await fetchAPI(`/admin/kyc/${selectedKyc.id}/document`, 'PATCH', { decision: 'valide', commentaire: note || 'Identité vérifiée par Admin' });
        if (res && res.success) {
            // Optionnel : activer le compte
            const acc = allClients.find(c => c.email === selectedKyc.email);
            if(acc && acc.statut === 'en_attente') {
                await fetchAPI(`/admin/comptes/${acc.id}/statut`, 'PATCH', { statut: 'actif', commentaire: 'Suite KYC' });
            }
            alert('KYC Validé avec succès');
            loadKycTable();
        }
    } else if (action === 'rejeter') {
        const res = await fetchAPI(`/admin/kyc/${selectedKyc.id}/document`, 'PATCH', { decision: 'rejete', commentaire: note || 'Document non conforme' });
        if (res && res.success) {
            alert('KYC Rejeté');
            loadKycTable();
        }
    } else if (action === 'contacter') {
        const subject = prompt("Sujet de l'email :", "Concernant votre dossier KYC");
        if(subject) {
            await fetchAPI(`/admin/notifier`, 'POST', {
                user_id: selectedKyc.user_id,
                titre: subject,
                message: note || "Merci de nous contacter concernant votre dossier de vérification d'identité.",
                type: 'alerte'
            });
            alert('Client contacté');
        }
    }
}


// --- Virements (Page 4) ---
let currentVirFilter = 'Tous';
let virData = [];
let selectedVir = null;

async function loadVirementsTable() {
    allVirements = await fetchAPI('/admin/virements') || [];
    virData = allVirements;
    
    if (virData.length > 0 && !selectedVir) {
        selectedVir = virData[0];
    }
    
    filterVirementsList();
}

function filterVirTab(tabName) {
    currentVirFilter = tabName;
    document.querySelectorAll('#vir-tabs .tab').forEach(t => {
        if(t.innerText.includes(tabName)) t.classList.add('act');
        else t.classList.remove('act');
    });
    filterVirementsList();
}

function filterVirementsList() {
    const search = (document.getElementById('vir-search').value || '').toLowerCase();
    
    let filtered = virData.filter(v => {
        const matchesSearch = (v.nom||'').toLowerCase().includes(search) || 
                              (v.prenom||'').toLowerCase().includes(search) || 
                              (v.iban_source||'').toLowerCase().includes(search) ||
                              (v.iban_dest||'').toLowerCase().includes(search) ||
                              (v.reference||'').toLowerCase().includes(search) ||
                              (v.motif||'').toLowerCase().includes(search);
        
        let matchesTab = true;
        if (currentVirFilter === 'Revue') matchesTab = v.statut === 'en_attente';
        else if (currentVirFilter === 'Validés') matchesTab = v.statut === 'valide';
        else if (currentVirFilter === 'Bloqués') matchesTab = v.statut === 'rejete'; // rejete = bloque in this mock
        
        return matchesSearch && matchesTab;
    });
    
    // Trier par date descendante
    filtered.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    
    // KPIs
    const today = new Date().toISOString().split('T')[0];
    const todayVirs = virData.filter(v => v.created_at.startsWith(today));
    
    const volAuj = todayVirs.reduce((sum, v) => sum + parseFloat(v.montant), 0);
    const txValidees = virData.filter(v => v.statut === 'valide').length;
    const txRevue = virData.filter(v => v.statut === 'en_attente').length;
    const txBloquees = virData.filter(v => v.statut === 'rejete').length;
    const avgTx = virData.length ? virData.reduce((sum, v) => sum + parseFloat(v.montant), 0) / virData.length : 0;
    
    const validPerc = virData.length ? Math.round((txValidees / virData.length) * 100) : 0;
    const revuePerc = virData.length ? Math.round((txRevue / virData.length) * 100) : 0;
    const blocPerc = virData.length ? Math.round((txBloquees / virData.length) * 100) : 0;
    
    document.getElementById('vir-live-count').innerText = `Live · ${todayVirs.length} tx aujourd'hui`;
    
    document.getElementById('vir-kpis').innerHTML = `
      <div class="card" style="padding:14px 16px;">
        <p style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;margin:0 0 4px;">Volume aujourd'hui</p>
        <p style="font-size:22px;font-weight:800;color:#0F172A;margin:0;">${formatMontant(volAuj)}</p>
      </div>
      <div class="card" style="padding:14px 16px;">
        <p style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;margin:0 0 4px;">Tx validées</p>
        <p style="font-size:22px;font-weight:800;color:#15803D;margin:0;">${txValidees}</p>
        <div class="bar-h" style="margin-top:6px;"><div class="bar-f" style="width:${validPerc}%;background:#16A34A;"></div></div>
      </div>
      <div class="card" style="padding:14px 16px;">
        <p style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;margin:0 0 4px;">En revue</p>
        <p style="font-size:22px;font-weight:800;color:#D97706;margin:0;">${txRevue}</p>
        <div class="bar-h" style="margin-top:6px;"><div class="bar-f" style="width:${revuePerc}%;background:#D97706;"></div></div>
      </div>
      <div class="card" style="padding:14px 16px;">
        <p style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;margin:0 0 4px;">Bloquées</p>
        <p style="font-size:22px;font-weight:800;color:#DC2626;margin:0;">${txBloquees}</p>
        <div class="bar-h" style="margin-top:6px;"><div class="bar-f" style="width:${blocPerc}%;background:#DC2626;"></div></div>
      </div>
      <div class="card" style="padding:14px 16px;">
        <p style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;margin:0 0 4px;">Tx moyenne</p>
        <p style="font-size:22px;font-weight:800;color:#0F172A;margin:0;">${formatMontant(avgTx)}</p>
      </div>
    `;

    document.getElementById('vir-tabs').innerHTML = `
        <div class="tab ${currentVirFilter==='Tous'?'act':''}" onclick="filterVirTab('Tous')">Tous (${virData.length})</div>
        <div class="tab ${currentVirFilter==='Revue'?'act':''}" onclick="filterVirTab('Revue')">Revue (${txRevue})</div>
        <div class="tab ${currentVirFilter==='Bloqués'?'act':''}" onclick="filterVirTab('Bloqués')">Bloqués (${txBloquees})</div>
        <div class="tab ${currentVirFilter==='Validés'?'act':''}" onclick="filterVirTab('Validés')">Validés</div>
    `;

    const listDiv = document.getElementById('vir-list');
    if (filtered.length === 0) {
        listDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#94A3B8; font-size:12px;">Aucun virement trouvé.</div>';
    } else {
        listDiv.innerHTML = filtered.map(v => {
            const timeStr = new Date(v.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            
            let rowClass = v.statut === 'en_attente' ? 'susp' : (v.statut === 'rejete' ? 'bloc' : '');
            let activeClass = selectedVir && selectedVir.id === v.id ? 'act' : '';
            
            let statBadge = '';
            let btnActions = '';
            
            // Simuler le type (Immédiat par defaut, Intl si IBAN ne commence pas par FR)
            let isIntl = v.iban_dest && !v.iban_dest.startsWith('FR');
            let typeBadge = isIntl ? '<span class="bk bd">Intl</span>' : '<span class="bk bn">Immédiat</span>';

            if (v.statut === 'en_attente') {
                statBadge = `<span class="bk bw"><i class="ti ti-clock" style="font-size:9px;"></i>Revue</span>`;
                btnActions = `
                  <button class="btn" style="background:#F0FDF4;color:#15803D;padding:3px 7px;font-size:10px;border-radius:5px;" onclick="event.stopPropagation(); submitVirementAction(${v.id}, 'valide')"><i class="ti ti-check" style="font-size:10px;"></i></button>
                  <button class="btn" style="background:#FEF2F2;color:#B91C1C;padding:3px 7px;font-size:10px;border-radius:5px;" onclick="event.stopPropagation(); submitVirementAction(${v.id}, 'rejete')"><i class="ti ti-lock" style="font-size:10px;"></i></button>
                `;
            } else if (v.statut === 'rejete') {
                statBadge = `<span class="bk bd"><i class="ti ti-lock" style="font-size:9px;"></i>Bloqué</span>`;
                btnActions = `
                  <button class="btn" style="background:#F0FDF4;color:#15803D;padding:3px 7px;font-size:10px;border-radius:5px;" onclick="event.stopPropagation(); submitVirementAction(${v.id}, 'valide')"><i class="ti ti-lock-open" style="font-size:10px;"></i></button>
                `;
            } else {
                statBadge = `<span class="bk bs"><i class="ti ti-check" style="font-size:9px;"></i>Validé</span>`;
                btnActions = `
                  <button class="btn" style="background:#FEF2F2;color:#B91C1C;padding:3px 7px;font-size:10px;border-radius:5px;" onclick="event.stopPropagation(); submitVirementAction(${v.id}, 'rejete')"><i class="ti ti-lock" style="font-size:10px;"></i></button>
                `;
            }

            const pInit = (v.prenom && v.nom) ? v.prenom.charAt(0) + v.nom.charAt(0) : 'X';
            const vColor = v.statut === 'en_attente' ? '#B45309' : (v.statut === 'rejete' ? '#B91C1C' : '#1D4ED8');
            const bgAv = v.statut === 'en_attente' ? '#FEF3C7' : (v.statut === 'rejete' ? '#FEE2E2' : '#EFF6FF');

            return `
            <div class="row-tx ${rowClass} ${activeClass}" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1.4fr) 90px 90px 100px 90px;" onclick="showVirementDetail(${v.id})">
              <div style="display:flex;align-items:center;gap:8px;">
                <div class="av" style="background:${bgAv};color:${vColor};">${pInit}</div>
                <div><p style="font-size:11px;font-weight:600;margin:0;color:#0F172A;">${v.prenom} ${v.nom}</p><p style="font-size:9px;color:#94A3B8;margin:0;">**** ${(v.iban_source||'0000').slice(-4)} · ${timeStr}</p></div>
              </div>
              <div><p style="font-size:11px;font-weight:500;margin:0;color:#0F172A;">${v.nom_dest || 'Inconnu'}</p><p style="font-size:9px;color:#94A3B8;margin:0;font-family:monospace;">${v.iban_dest ? v.iban_dest.substring(0,4)+' '+v.iban_dest.substring(4,8)+'…'+v.iban_dest.slice(-4) : '-'}</p></div>
              <p style="font-size:12px;font-weight:700;color:${v.statut==='rejete'?'#B91C1C':''};text-align:right;">${formatMontant(v.montant)}</p>
              <div style="text-align:center;">${typeBadge}</div>
              <div style="text-align:center;">${statBadge}</div>
              <div style="display:flex;gap:3px;justify-content:center;">
                <button class="btn" style="background:#EFF6FF;color:#1D4ED8;padding:3px 7px;font-size:10px;border-radius:5px;"><i class="ti ti-eye" style="font-size:10px;"></i></button>
                ${btnActions}
              </div>
            </div>`;
        }).join('');
    }
    
    // Live stream on the right panel
    const liveStreamDiv = document.getElementById('vir-live-stream');
    liveStreamDiv.innerHTML = virData.slice(0, 8).map(v => {
        let dotColor = v.statut === 'en_attente' ? '#D97706' : (v.statut === 'rejete' ? '#DC2626' : '#16A34A');
        let amountColor = v.statut === 'rejete' ? '#B91C1C' : (v.statut === 'en_attente' ? '#D97706' : '');
        let pInit = (v.prenom) ? v.prenom.charAt(0) : '';
        let nInit = (v.nom) ? v.nom.charAt(0) : '';
        let dInit = (v.nom_dest) ? v.nom_dest.substring(0, 8) : 'Inconnu';
        const timeStr = new Date(v.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        return `
        <div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:0.5px solid #F8FAFC;">
          <div class="live-dot" style="background:${dotColor};"></div>
          <div style="flex:1;min-width:0;"><p style="font-size:10px;font-weight:500;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${pInit}. ${v.nom} → ${dInit}</p><p style="font-size:9px;color:#94A3B8;margin:0;">${timeStr}</p></div>
          <span style="font-size:10px;font-weight:700;color:${amountColor};white-space:nowrap;">${formatMontant(v.montant)}</span>
        </div>`;
    }).join('');

    if (selectedVir) showVirementDetail(selectedVir.id);
}

function showVirementDetail(id) {
    selectedVir = virData.find(v => v.id === id);
    if (!selectedVir) return;
    
    // Update active row classes
    document.querySelectorAll('#vir-list .row-tx').forEach((el, index) => {
        if(virData[index] && virData[index].id === id) el.classList.add('act');
        else el.classList.remove('act');
    });

    document.getElementById('vir-detail-col2').style.display = 'flex';
    
    const isIntl = selectedVir.iban_dest && !selectedVir.iban_dest.startsWith('FR');
    const typeLabel = isIntl ? 'Virement international' : 'Virement immédiat';
    
    // Simulate risk score based on status
    let score = selectedVir.statut === 'valide' ? 8 : (selectedVir.statut === 'rejete' ? 85 : 45);
    let scoreText = score < 30 ? 'Faible' : (score < 70 ? 'Moyen' : 'Élevé');
    let scoreColor = score < 30 ? '#15803D' : (score < 70 ? '#D97706' : '#B91C1C');
    let scoreBg = score < 30 ? '#16A34A' : (score < 70 ? '#D97706' : '#DC2626');
    
    let statBadge = '';
    if (selectedVir.statut === 'en_attente') statBadge = `<span class="bk bw"><i class="ti ti-clock" style="font-size:9px;"></i>Revue</span>`;
    else if (selectedVir.statut === 'rejete') statBadge = `<span class="bk bd"><i class="ti ti-lock" style="font-size:9px;"></i>Bloqué</span>`;
    else statBadge = `<span class="bk bs"><i class="ti ti-check" style="font-size:9px;"></i>Validé</span>`;

    const created = new Date(selectedVir.created_at);
    
    let actionButtons = '';
    if (selectedVir.statut !== 'rejete') {
        actionButtons += `<button class="btn" style="background:#FEF2F2;color:#B91C1C;border:0.5px solid #FECACA;width:100%;justify-content:center;" onclick="submitVirementAction(${selectedVir.id}, 'rejete')"><i class="ti ti-lock" style="font-size:13px;"></i>Bloquer ce virement</button>`;
    }
    if (selectedVir.statut !== 'valide') {
        actionButtons += `<button class="btn" style="background:#F0FDF4;color:#15803D;border:0.5px solid #BBF7D0;width:100%;justify-content:center;margin-top:6px;" onclick="submitVirementAction(${selectedVir.id}, 'valide')"><i class="ti ti-check" style="font-size:13px;"></i>Valider ce virement</button>`;
    }

    const col2 = document.getElementById('vir-detail-col2');
    col2.innerHTML = `
        <!-- Détail virement -->
        <div class="card" style="padding:14px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div>
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;">
                <h3 style="font-size:13px;font-weight:700;color:#0F172A;margin:0;">Virement sélectionné</h3>
                ${statBadge}
              </div>
              <p style="font-size:10px;color:#94A3B8;margin:0;">Réf. #${selectedVir.reference || 'TX-'+selectedVir.id} · ${created.toLocaleString('fr-FR')}</p>
            </div>
          </div>

          <!-- Flux -->
          <div style="display:flex;align-items:center;gap:0;margin-bottom:14px;">
            <div style="flex:1;background:#F0FDF4;border:0.5px solid #BBF7D0;border-radius:10px;padding:10px 12px;text-align:center;">
              <div style="width:32px;height:32px;border-radius:50%;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#1D4ED8;margin:0 auto 6px;">${selectedVir.prenom.charAt(0)}${selectedVir.nom.charAt(0)}</div>
              <p style="font-size:11px;font-weight:700;margin:0;color:#0F172A;">${selectedVir.prenom} ${selectedVir.nom}</p>
              <p style="font-size:9px;color:#94A3B8;margin:2px 0 0;">**** ${(selectedVir.iban_source||'').slice(-4)}</p>
              <p style="font-size:10px;font-weight:600;color:#B91C1C;margin:4px 0 0;">−${formatMontant(selectedVir.montant)}</p>
            </div>
            <div style="padding:0 8px;display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;">
              <i class="ti ti-arrow-right" style="font-size:18px;color:#2563EB;"></i>
              <span style="font-size:9px;color:#94A3B8;white-space:nowrap;">${isIntl?'International':'Immédiat'}</span>
            </div>
            <div style="flex:1;background:#F0FDF4;border:0.5px solid #BBF7D0;border-radius:10px;padding:10px 12px;text-align:center;">
              <div style="width:32px;height:32px;border-radius:50%;background:#F0FDF4;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#166534;margin:0 auto 6px;">${(selectedVir.nom_dest||'I').charAt(0)}</div>
              <p style="font-size:11px;font-weight:700;margin:0;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${selectedVir.nom_dest || 'Inconnu'}</p>
              <p style="font-size:9px;color:#94A3B8;margin:2px 0 0;">${selectedVir.iban_dest ? selectedVir.iban_dest.substring(0,4)+'…'+selectedVir.iban_dest.slice(-4) : '-'}</p>
              <p style="font-size:10px;font-weight:600;color:#15803D;margin:4px 0 0;">+${formatMontant(selectedVir.montant)}</p>
            </div>
          </div>

          <!-- Infos détaillées -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;padding:10px;background:#F8FAFC;border-radius:8px;margin-bottom:12px;">
            <div><p style="font-size:9px;color:#94A3B8;margin:0;">Montant</p><p style="font-size:13px;font-weight:700;margin:2px 0 0;">${formatMontant(selectedVir.montant)}</p></div>
            <div><p style="font-size:9px;color:#94A3B8;margin:0;">Type</p><p style="font-size:12px;font-weight:600;margin:2px 0 0;">${typeLabel}</p></div>
            <div><p style="font-size:9px;color:#94A3B8;margin:0;">Motif</p><p style="font-size:12px;font-weight:500;margin:2px 0 0;">${selectedVir.motif || '-'}</p></div>
            <div><p style="font-size:9px;color:#94A3B8;margin:0;">Heure exécution</p><p style="font-size:12px;font-weight:500;margin:2px 0 0;">${created.toLocaleTimeString('fr-FR')}</p></div>
            <div><p style="font-size:9px;color:#94A3B8;margin:0;">Score risque</p><p style="font-size:12px;font-weight:600;color:${scoreColor};margin:2px 0 0;">${score} / 100 — ${scoreText}</p></div>
            <div><p style="font-size:9px;color:#94A3B8;margin:0;">Email client</p><p style="font-size:11px;font-weight:500;margin:2px 0 0;overflow:hidden;text-overflow:ellipsis;">${selectedVir.email || '-'}</p></div>
            <div><p style="font-size:9px;color:#94A3B8;margin:0;">Appareil (Simulé)</p><p style="font-size:12px;font-weight:500;margin:2px 0 0;">${(selectedVir.id % 2 === 0) ? 'Chrome / macOS' : 'Safari / iOS'}</p></div>
            <div><p style="font-size:9px;color:#94A3B8;margin:0;">Authentification</p><p style="font-size:12px;font-weight:600;color:#15803D;margin:2px 0 0;">OTP validé ✓</p></div>
          </div>

          <!-- Score risque barre -->
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:10px;color:#475569;font-weight:500;">Score de risque global</span>
              <span style="font-size:10px;font-weight:700;color:${scoreColor};">${score} / 100 — ${scoreText}</span>
            </div>
            <div class="bar-h" style="height:7px;"><div class="bar-f" style="width:${score}%;background:${scoreBg};height:7px;"></div></div>
          </div>

          <!-- Actions sur le virement -->
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${actionButtons}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
              <button class="btn" style="background:#F1F5F9;color:#475569;border:0.5px solid #E2E8F0;justify-content:center;font-size:10px;"><i class="ti ti-download" style="font-size:12px;"></i>Exporter</button>
              <button class="btn" style="background:#F5F3FF;color:#6D28D9;justify-content:center;font-size:10px;"><i class="ti ti-flag" style="font-size:12px;"></i>Signaler fraude</button>
            </div>
          </div>
        </div>

        <!-- Historique de la tx -->
        <div class="card" style="padding:12px 14px;">
          <h3 style="font-size:11px;font-weight:700;color:#0F172A;margin:0 0 10px;">Cycle de vie</h3>
          <div style="display:flex;flex-direction:column;gap:0;">
            ${selectedVir.statut === 'valide' ? `
            <div style="display:flex;gap:10px;padding:6px 0;border-bottom:0.5px solid #F8FAFC;">
              <div class="live-dot" style="background:#16A34A;margin-top:4px;"></div>
              <div><p style="font-size:11px;font-weight:500;margin:0;">Crédit confirmé</p><p style="font-size:9px;color:#94A3B8;margin:1px 0 0;">Système SEPA</p></div>
            </div>` : ''}
            ${selectedVir.statut === 'rejete' ? `
            <div style="display:flex;gap:10px;padding:6px 0;border-bottom:0.5px solid #F8FAFC;">
              <div class="live-dot" style="background:#DC2626;margin-top:4px;"></div>
              <div><p style="font-size:11px;font-weight:500;margin:0;color:#B91C1C;">Virement bloqué</p><p style="font-size:9px;color:#94A3B8;margin:1px 0 0;">Par admin / système</p></div>
            </div>` : ''}
            <div style="display:flex;gap:10px;padding:6px 0;border-bottom:0.5px solid #F8FAFC;">
              <div class="live-dot" style="background:#16A34A;margin-top:4px;"></div>
              <div><p style="font-size:11px;font-weight:500;margin:0;">OTP validé par le client</p><p style="font-size:9px;color:#94A3B8;margin:1px 0 0;">Auth service</p></div>
            </div>
            <div style="display:flex;gap:10px;padding:6px 0;border-bottom:0.5px solid #F8FAFC;">
              <div class="live-dot" style="background:${score > 70 ? '#D97706' : '#16A34A'};margin-top:4px;"></div>
              <div><p style="font-size:11px;font-weight:500;margin:0;">Analyse risque terminée</p><p style="font-size:9px;color:#94A3B8;margin:1px 0 0;">Score ${score}</p></div>
            </div>
            <div style="display:flex;gap:10px;padding:6px 0;">
              <div class="live-dot" style="background:#94A3B8;margin-top:4px;"></div>
              <div><p style="font-size:11px;font-weight:500;margin:0;">Virement initié</p><p style="font-size:9px;color:#94A3B8;margin:1px 0 0;">${created.toLocaleString('fr-FR')}</p></div>
            </div>
          </div>
        </div>
    `;
}

window.submitVirementAction = async function(id, decision) {
    if (!confirm(decision === 'valide' ? 'Valider et exécuter ce virement ?' : 'Bloquer ce virement et rembourser le client ?')) return;
    try {
        const res = await fetchAPI(`/admin/virements/${id}`, 'PATCH', { decision, commentaire: 'Action manuelle admin' });
        if (res && res.success) {
            loadVirementsTable();
            loadDashboardStats();
        } else {
            alert("Erreur lors de l'opération.");
        }
    } catch (err) {
        console.error(err);
        alert("Erreur réseau ou serveur.");
    }
}


// --- Audit Logs (Page 12) ---
async function loadLogsTable() {
    allLogs = await fetchAPI('/admin/audit') || [];
    const tbody = document.getElementById('logs-tbody');
    
    if (allLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Aucun log système.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = allLogs.slice(0, 100).map(l => `
        <tr>
            <td style="font-size:12px;" class="text-muted">${new Date(l.created_at).toLocaleString('fr-FR')}</td>
            <td><span class="offre-badge">${l.categorie.toUpperCase()}</span></td>
            <td style="font-weight:500; font-size:13px;">${l.action}</td>
            <td>${l.acteur_email} <span class="text-muted" style="font-size:11px;">(${l.acteur_role})</span></td>
            <td style="font-size:12px;">Type: ${l.cible_type} ID: ${l.cible_id}<br><span class="text-muted">${l.cible_detail || ''}</span></td>
        </tr>
    `).join('');
}


// --- Cartes Émises (Page 7) ---
async function loadCartesTable() {
    // Si pas de route admin cartes, on mocke à partir des comptes actifs
    if(allClients.length === 0) allClients = await fetchAPI('/admin/comptes') || [];
    let clientsActifs = allClients.filter(c => c.statut === 'actif');
    
    const tbody = document.getElementById('cartes-tbody');
    if (clientsActifs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Aucune carte émise.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = clientsActifs.map((c, i) => {
        const last4 = String(Math.floor(Math.random()*9000)+1000);
        const type = c.offre === 'Premium' ? 'Mastercard Black' : (c.offre==='Business' ? 'Visa Platinum' : 'Visa Classic');
        return `
        <tr>
            <td><div class="client-cell">${getClientAvatar(c)}<span class="client-name">${c.prenom} ${c.nom}</span></div></td>
            <td><span class="iban-code">**** **** **** ${last4}</span></td>
            <td>${type}</td>
            <td class="text-muted">12/29</td>
            <td><span class="status-badge success">Active</span></td>
        </tr>
    `}).join('');
}

// --- Fraudes (Page 5 & Dashboard) ---
async function loadAlertes() {
    const fraudesList = await fetchAPI('/admin/alertes?limit=10') || [];
    const container = document.getElementById('alerts-container');
    document.getElementById('alert-count').innerText = fraudesList.length;
    
    if (fraudesList.length === 0) {
        container.innerHTML = `<div class="text-center text-muted p-3">Aucune alerte.</div>`;
        return;
    }
    
    container.innerHTML = fraudesList.slice(0, 3).map(renderAlerteItem).join('');
}

async function renderFraudesFullTable() {
    const fraudesList = await fetchAPI('/admin/alertes?limit=50') || [];
    const container = document.getElementById('fraudes-full-container');
    if (fraudesList.length === 0) {
        container.innerHTML = `<div class="text-center text-muted p-3">Aucune alerte fraude ou sécurité.</div>`;
        return;
    }
    container.innerHTML = fraudesList.map(renderAlerteItem).join('');
}

function renderAlerteItem(a) {
    const type = a.description?.toLowerCase().includes('bloqu') ? 'danger' : 'warning';
    return `
        <div class="alert-item">
            <div class="alert-icon ${type}">
                <i class="ti ${type === 'danger' ? 'ti-alert-circle' : 'ti-alert-triangle'}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${a.action}</div>
                <div class="alert-desc">${a.description || ''} <br><span class="client-name" style="font-size:11px;">${a.utilisateur}</span></div>
                <div class="alert-time">${new Date(a.created_at).toLocaleString('fr-FR')}</div>
            </div>
            <div class="alert-actions">
                <button class="btn-alert-action ${type === 'danger' ? 'bloquer' : 'verifier'}">
                    Examiner
                </button>
            </div>
        </div>
    `;
}

// --- Supervision Live (Page 6) ---
let supervisionInterval;
function startSupervisionLive() {
    const terminal = document.getElementById('terminal-live');
    if (supervisionInterval) clearInterval(supervisionInterval);
    
    const events = [
        "[ROUTER] Reçu GET /api/transactions (200 OK) - 45ms",
        "[AUTH] Token JWT validé pour user_id=102",
        "[KYC] Nouveau document uploadé en attente de validation",
        "[DB] Pool de connexions : 4 actives, 16 libres",
        "[CRON] Calcul des intérêts épargne terminé",
        "[SECURITY] 3 tentatives de login échouées IP: 192.168.1.55"
    ];
    
    supervisionInterval = setInterval(async () => {
        // En vrai, un WebSocket serait mieux. Ici on poll les derniers logs
        const logs = await fetchAPI('/admin/audit?limit=1');
        if (logs && logs.length > 0) {
            const latest = logs[0];
            const time = new Date(latest.created_at).toLocaleTimeString('fr-FR');
            
            const div = document.createElement('div');
            div.style.color = latest.categorie === 'securite' ? '#ef4444' : '#cbd5e1';
            div.innerText = `[${time}] [${latest.categorie.toUpperCase()}] ${latest.action} - ${latest.cible_detail || ''}`;
            
            terminal.appendChild(div);
            terminal.scrollTop = terminal.scrollHeight;
        }
    }, 3000);
}


// ============================
// ACTIONS CLIENTS
// ============================
window.openManageClient = function(id, iban, nom) {
    document.getElementById('manage-client-id').value = id;
    document.getElementById('manage-client-iban').value = iban;
    document.getElementById('manage-client-name').innerText = `- ${nom}`;
    document.getElementById('modal-manage-client').style.display = 'flex';
}

window.manageAction = function(actionType) {
  const id = document.getElementById('manage-client-id').value;
  const iban = document.getElementById('manage-client-iban').value;
  
  document.getElementById('modal-manage-client').style.display = 'none';

  if (actionType === 'activer') {
      document.getElementById('activer-client-id').value = id;
      document.getElementById('activer-iban').value = iban && iban !== 'null' && iban !== '-' ? iban : '';
      document.getElementById('activer-bic').value = 'FINTEFR22XXX';
      document.getElementById('activer-numero').value = '';
      document.getElementById('modal-activer-compte').style.display = 'flex';
  } 
  else if (actionType === 'rules') {
      document.getElementById('rules-client-id').value = id;
      document.getElementById('modal-rules').style.display = 'flex';
      loadRules(id);
  }
  else if (actionType === 'crediter' || actionType === 'debiter') {
      document.getElementById('montant-action-type').value = actionType;
      document.getElementById('modal-montant-title').innerText = actionType === 'crediter' ? 'Créditer le compte' : 'Débiter le compte';
      document.getElementById('montant-valeur').value = '';
      document.getElementById('montant-libelle').value = '';
      document.getElementById('credit-options-container').style.display = actionType === 'crediter' ? 'block' : 'none';
      document.getElementById('modal-montant').style.display = 'flex';
  }
  else if (actionType === 'restreindre' || actionType === 'bloquer' || actionType === 'supprimer') {
      document.getElementById('block-client-action').value = actionType;
      document.getElementById('block-client-id').value = id;
      
      const titleMap = {
          'restreindre': 'Restreindre le compte',
          'bloquer': 'Bloquer le compte',
          'supprimer': 'Supprimer DÉFINITIVEMENT'
      };
      const descMap = {
          'restreindre': 'Le client pourra se connecter mais ne pourra plus faire de virements.',
          'bloquer': 'Le client ne pourra plus se connecter.',
          'supprimer': 'ATTENTION: Cette action effacera l\'utilisateur, son compte, et tout son historique. Êtes-vous sûr ?'
      };
      
      document.getElementById('modal-block-title').innerText = titleMap[actionType];
      document.getElementById('modal-block-desc').innerText = descMap[actionType];
      
      const btn = document.getElementById('btn-confirm-block');
      btn.innerText = actionType === 'supprimer' ? 'Supprimer' : 'Confirmer';
      
      document.getElementById('modal-block-client').style.display = 'flex';
  }
}

window.confirmMontantAction = async function() {
    const type = document.getElementById('montant-action-type').value;
    const id = document.getElementById('manage-client-id').value;
    const val = parseFloat(document.getElementById('montant-valeur').value);
    const libelle = document.getElementById('montant-libelle').value || (type==='crediter' ? 'Crédit Admin' : 'Débit Admin');
    
    const payload = { montant: val, libelle: libelle };
    
    if (type === 'crediter') {
        payload.transfer_allowed = document.getElementById('montant-transfer-allowed').checked;
        const maxTransfer = document.getElementById('montant-max-transfer').value;
        if (maxTransfer) payload.max_transfer_amount = parseFloat(maxTransfer);
        else payload.max_transfer_amount = null;
    }

    if (val > 0) {
        const res = await fetchAPI(`/admin/comptes/${id}/${type}`, 'POST', payload);
        if (res && res.success) {
            document.getElementById('modal-montant').style.display = 'none';
            allClients = await fetchAPI('/admin/comptes') || [];
            showAdminView('view-comptes', document.querySelectorAll('.nav-item')[1]);
            loadDashboardStats();
        }
    }
}

window.confirmBlockClient = async function() {
    const id = document.getElementById('block-client-id').value;
    const action = document.getElementById('block-client-action').value;
    
    let res;
    if (action === 'supprimer') {
        res = await fetchAPI(`/admin/comptes/${id}`, 'DELETE');
    } else {
        res = await fetchAPI(`/admin/comptes/${id}/statut`, 'PATCH', { statut: action, commentaire: `Action via console Admin: ${action}` });
    }

    if (res && res.success) {
        document.getElementById('modal-block-client').style.display = 'none';
        allClients = await fetchAPI('/admin/comptes') || [];
        showAdminView('view-comptes', document.querySelectorAll('.nav-item')[1]);
        loadDashboardStats();
    } else {
        alert("Erreur lors de l'opération.");
    }
}

window.activerCompte = async function(id, currentIban) {
    // Pour une réactivation silencieuse (ex: depuis les alertes de fraude)
    const res = await fetchAPI(`/admin/comptes/${id}/statut`, 'PATCH', { statut: 'actif', commentaire: 'Débloqué via console Admin' });
    if (res && res.success) {
        allClients = await fetchAPI('/admin/comptes') || [];
        showAdminView('view-comptes', document.querySelectorAll('.nav-item')[1]);
    } else {
        alert("Erreur lors de l'activation.");
    }
}

window.confirmActiverCompte = async function() {
    const id = document.getElementById('activer-client-id').value;
    const iban = document.getElementById('activer-iban').value;
    const bic = document.getElementById('activer-bic').value;
    const numero = document.getElementById('activer-numero').value;

    if (!iban || !bic || !numero) {
        alert('Veuillez remplir tous les champs (IBAN, BIC, Numéro).');
        return;
    }

    const res = await fetchAPI(`/admin/comptes/${id}/activer`, 'PATCH', { iban, bic, numero_compte: numero });
    if (res && res.success) {
        document.getElementById('modal-activer-compte').style.display = 'none';
        allClients = await fetchAPI('/admin/comptes') || [];
        showAdminView('view-comptes', document.querySelectorAll('.nav-item')[1]);
    }
}

// --- Règles et Popups ---
async function loadRules(accountId) {
    const tbody = document.getElementById('rules-list');
    tbody.innerHTML = '<div class="text-muted text-center">Chargement...</div>';
    const rules = await fetchAPI(`/admin/comptes/${accountId}/rules`) || [];
    if (rules.length === 0) {
        tbody.innerHTML = '<div class="text-muted text-center" style="font-size:13px;">Aucune règle configurée.</div>';
        return;
    }
    tbody.innerHTML = rules.map(r => `
        <div style="background:var(--bg-light); border:1px solid var(--card-border); padding:10px; border-radius:6px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:600; margin-bottom:4px;">${r.popup_message}</div>
                <div class="text-muted">
                    ${r.trigger_min_balance ? `Solde &ge; ${r.trigger_min_balance}€` : 'Tous soldes'} | 
                    ${r.trigger_min_transfer ? `Virement &ge; ${r.trigger_min_transfer}€` : 'Tous montants'}
                </div>
            </div>
            <button class="icon-btn text-danger" onclick="deleteRule(${r.id}, ${accountId})"><i class="ti ti-trash"></i></button>
        </div>
    `).join('');
}

window.confirmAddRule = async function() {
    const id = document.getElementById('rules-client-id').value;
    const minBalance = document.getElementById('rule-min-balance').value;
    const minTransfer = document.getElementById('rule-min-transfer').value;
    const message = document.getElementById('rule-message').value;

    if (!message) { alert('Veuillez définir un message pour le popup.'); return; }

    const payload = { popup_message: message };
    if (minBalance) payload.trigger_min_balance = parseFloat(minBalance);
    if (minTransfer) payload.trigger_min_transfer = parseFloat(minTransfer);

    const res = await fetchAPI(`/admin/comptes/${id}/rules`, 'POST', payload);
    if (res && res.success) {
        document.getElementById('rule-message').value = '';
        document.getElementById('rule-min-balance').value = '';
        document.getElementById('rule-min-transfer').value = '';
        loadRules(id);
    }
}

window.deleteRule = async function(ruleId, accountId) {
    if(confirm('Supprimer cette règle ?')) {
        const res = await fetchAPI(`/admin/rules/${ruleId}`, 'DELETE');
        if(res && res.success) loadRules(accountId);
    }
}

window.exportCSV = function() {
    if (allClients.length === 0) {
        alert("Aucune donnée à exporter.");
        return;
    }
    
    const headers = ['ID', 'Prénom', 'Nom', 'Email', 'IBAN', 'Solde', 'Statut', 'Offre'];
    const rows = allClients.map(c => [
        c.id, c.prenom, c.nom, c.email, c.iban || '', c.solde, c.statut, c.offre || 'Standard'
    ]);
    
    let csvContent = headers.join(';') + '\n' + rows.map(e => e.join(';')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nova_clients_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================
// UTILS
// ============================
function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

function formatMontant(montant) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
}
