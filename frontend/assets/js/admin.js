// admin.js - Logique SPA de l'espace administration

const API_BASE = '/api';
const TOKEN = localStorage.getItem('fintech_token');

if (!TOKEN) {
    window.location.href = 'index.html';
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
            window.location.href = 'index.html';
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
async function renderBloquesTable() {
    if(allClients.length === 0) allClients = await fetchAPI('/admin/comptes') || [];
    let blocked = allClients.filter(c => c.statut === 'bloque');
    const tbody = document.getElementById('bloques-tbody');
    
    if (blocked.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Aucun client bloqué.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = blocked.map(c => `
        <tr>
            <td>
                <div class="client-cell">
                    ${getClientAvatar(c)}
                    <span class="client-name">${c.prenom} ${c.nom}</span>
                </div>
            </td>
            <td class="text-muted">${c.email}</td>
            <td>Suspicion de fraude / Violation CGU</td>
            <td class="solde-cell danger-text">${formatMontant(c.solde || 0)}</td>
            <td style="text-align: right;">
                <button class="btn-alert-action verifier" onclick="activerCompte(${c.id}, '${c.iban}')">Réactiver le compte</button>
            </td>
        </tr>
    `).join('');
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
async function loadKycTable() {
    allKyc = await fetchAPI('/admin/kyc') || [];
    
    const attente = allKyc.filter(k => k.statut === 'en_attente').length;
    const valides = allKyc.filter(k => k.statut === 'valide').length;
    const rejetes = allKyc.filter(k => k.statut === 'rejete').length;
    
    document.getElementById('kyc-stats-attente').innerText = attente;
    document.getElementById('kyc-stats-valides').innerText = valides;
    document.getElementById('kyc-stats-rejetes').innerText = rejetes;
    
    const tbody = document.getElementById('kyc-tbody');
    const pendingList = allKyc.filter(k => k.statut === 'en_attente');
    
    if (pendingList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4"><i class="ti ti-check" style="font-size:32px;color:#10b981;"></i><br>Aucun dossier en attente</td></tr>`;
        return;
    }
    
    tbody.innerHTML = pendingList.map(k => {
        return `
        <tr>
            <td><span class="client-name">${k.prenom} ${k.nom}</span><br><span class="text-muted" style="font-size:11px;">${k.email}</span></td>
            <td><a href="${k.document_url || '#'}" target="_blank" class="export-link"><i class="ti ti-id"></i> CNI / Passeport</a></td>
            <td><a href="${k.selfie_url || '#'}" target="_blank" class="export-link"><i class="ti ti-camera"></i> Selfie</a></td>
            <td class="text-muted" style="font-size:12px;">${new Date(k.created_at).toLocaleDateString('fr-FR')}</td>
            <td><span class="status-badge warning">En attente</span></td>
            <td style="text-align: right;">
                <button class="btn-primary" onclick="openKycModal(${k.id})">Examiner</button>
            </td>
        </tr>
    `}).join('');
}

function openKycModal(kycId) {
    const kyc = allKyc.find(k => k.id === kycId);
    if (!kyc) return;
    
    document.getElementById('verify-kyc-id').value = kycId;
    document.getElementById('kyc-details').innerHTML = `
        <div style="display:flex; gap:16px; margin-bottom:16px;">
            <div style="flex:1; border:1px solid #e2e8f0; padding:8px; border-radius:8px;">
                <p style="font-size:12px; font-weight:600; margin:0 0 8px 0;">Pièce d'identité</p>
                ${kyc.document_url ? `<img src="${kyc.document_url}" style="width:100%; max-height:200px; object-fit:contain; background:#f8fafc;">` : '<p class="text-muted">Aucun doc</p>'}
            </div>
            <div style="flex:1; border:1px solid #e2e8f0; padding:8px; border-radius:8px;">
                <p style="font-size:12px; font-weight:600; margin:0 0 8px 0;">Selfie Vidéo</p>
                ${kyc.selfie_url ? `<img src="${kyc.selfie_url}" style="width:100%; max-height:200px; object-fit:contain; background:#f8fafc;">` : '<p class="text-muted">Aucun selfie</p>'}
            </div>
        </div>
        <p><strong>Utilisateur :</strong> ${kyc.prenom} ${kyc.nom} (${kyc.email})</p>
    `;
    
    document.getElementById('modal-verify-kyc').style.display = 'flex';
}

window.validateKyc = async function() {
    const id = document.getElementById('verify-kyc-id').value;
    const res = await fetchAPI(`/admin/kyc/${id}/document`, 'PATCH', { decision: 'valide', commentaire: 'Identité vérifiée par Admin' });
    if (res && res.success) {
        document.getElementById('modal-verify-kyc').style.display = 'none';
        
        // Trouver le account_id lié pour l'activer
        const kyc = allKyc.find(k => k.id == id);
        if(kyc) {
            const acc = allClients.find(c => c.email === kyc.email);
            if(acc) {
                await activerCompte(acc.id, null); // Genère un IBAN auto et active
            }
        }
        
        loadKycTable();
        loadDashboardStats();
    }
}

window.rejectKyc = async function() {
    const id = document.getElementById('verify-kyc-id').value;
    const res = await fetchAPI(`/admin/kyc/${id}/document`, 'PATCH', { decision: 'rejete', commentaire: 'Document non conforme ou selfie illisible' });
    if (res && res.success) {
        document.getElementById('modal-verify-kyc').style.display = 'none';
        loadKycTable();
    }
}


// --- Virements (Page 4) ---
async function loadVirementsTable() {
    allVirements = await fetchAPI('/admin/virements') || [];
    renderVirementsTable();
}

function renderVirementsTable() {
    const tbody = document.getElementById('virements-tbody');
    const filter = document.getElementById('filter-virement-type').value;
    
    let filtered = [...allVirements];
    
    // Mock types for demo if API doesn't specify deeply
    filtered = filtered.map((v, i) => {
        if(!v.categorie) v.categorie = (i % 4 === 0) ? 'recharge' : (i % 2 === 0 ? 'interne' : 'virement');
        return v;
    });
    
    if(filter) {
        filtered = filtered.filter(v => v.categorie === filter);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Aucune transaction trouvée.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.slice(0, 50).map(v => {
        let typeBadge = '';
        if(v.type === 'credit') typeBadge = `<span class="status-badge success"><i class="ti ti-arrow-down-left"></i> Crédit</span>`;
        else typeBadge = `<span class="status-badge danger"><i class="ti ti-arrow-up-right"></i> Débit</span>`;
        
        let statBadge = `<span class="status-badge success">Exécuté</span>`;
        if(v.statut === 'en_attente') statBadge = `<span class="status-badge warning">En cours</span>`;
        if(v.statut === 'rejete') statBadge = `<span class="status-badge danger">Rejeté</span>`;
        
        return `
        <tr>
            <td style="font-size:12px;" class="text-muted">${new Date(v.created_at).toLocaleString('fr-FR')}</td>
            <td><span class="client-name">Compte #${v.account_id}</span></td>
            <td>${typeBadge}</td>
            <td><span class="text-muted">${v.motif || v.libelle || '-'}</span></td>
            <td class="solde-cell ${v.type==='credit' ? 'success-text' : 'danger-text'}">
                ${v.type==='credit'?'+':'-'}${formatMontant(v.montant)}
            </td>
            <td>${statBadge}</td>
        </tr>
    `}).join('');
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
        activerCompte(id, iban);
    } 
    else if (actionType === 'crediter' || actionType === 'debiter') {
        document.getElementById('montant-action-type').value = actionType;
        document.getElementById('modal-montant-title').innerText = actionType === 'crediter' ? 'Créditer le compte' : 'Débiter le compte';
        document.getElementById('montant-valeur').value = '';
        document.getElementById('montant-libelle').value = '';
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
    const actionType = document.getElementById('montant-action-type').value;
    const id = document.getElementById('manage-client-id').value;
    const montant = document.getElementById('montant-valeur').value;
    const libelle = document.getElementById('montant-libelle').value;

    if(!montant || montant <= 0) return alert('Montant invalide');

    const endpoint = `/admin/comptes/${id}/${actionType}`;
    const res = await fetchAPI(endpoint, 'POST', { montant, libelle });
    
    if (res && res.success) {
        document.getElementById('modal-montant').style.display = 'none';
        allClients = await fetchAPI('/admin/comptes') || []; 
        showAdminView('view-comptes', document.querySelectorAll('.nav-item')[1]);
    } else {
        alert("Erreur lors de l'opération : " + (res?.error || "Inconnue"));
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
    let iban = currentIban;
    if (!iban || iban === 'undefined' || iban === 'null' || iban === '-') {
        iban = 'FR7630004' + Math.floor(Math.random() * 100000000000);
    }
    
    const res = await fetchAPI(`/admin/comptes/${id}/activer`, 'PATCH', { iban: iban });
    if (res && res.success) {
        allClients = await fetchAPI('/admin/comptes') || [];
        showAdminView('view-comptes', document.querySelectorAll('.nav-item')[1]);
    } else {
        const res2 = await fetchAPI(`/admin/comptes/${id}/statut`, 'PATCH', { statut: 'actif', commentaire: 'Débloqué via console Admin' });
        if (res2 && res2.success) {
            allClients = await fetchAPI('/admin/comptes') || [];
            showAdminView('view-comptes', document.querySelectorAll('.nav-item')[1]);
        } else {
            alert("Erreur lors de l'activation.");
        }
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
