// admin.js - Logique de l'espace administration

const API_BASE = '/api';
const TOKEN = localStorage.getItem('fintech_token');

// Vérification de sécurité
if (!TOKEN) {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

async function initDashboard() {
    updateDate();
    await loadDashboardStats();
    await loadClientsTable();
    await loadAlertes();
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('fr-FR', options);
    
    // Capitalize first letter
    const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    // Add time (mocking UTC+1 format like screenshot)
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    document.getElementById('admin-date-display').innerText = `${formattedDate} - ${timeStr} UTC+1`;
}

// ============================
// APPELS API
// ============================

async function fetchAPI(endpoint, method = 'GET', body = null) {
    try {
        const headers = {
            'Authorization': `Bearer ${TOKEN}`
        };
        
        if (body) {
            headers['Content-Type'] = 'application/json';
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
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

async function loadDashboardStats() {
    const stats = await fetchAPI('/admin/dashboard');
    if (!stats) return;

    // Remplissage des KPIs
    document.getElementById('kpi-clients-actifs').innerText = formatNumber(stats.comptes_actifs || 0);
    // document.getElementById('kpi-clients-actifs-sub').innerText = "+124"; // Mock pour le moment
    
    document.getElementById('kpi-kyc-attente').innerText = stats.kyc_en_attente || 0;
    document.getElementById('kpi-kyc-attente-sub').innerText = `${stats.kyc_en_attente || 0} urgents`;
    
    // Mocks for data not directly in basic dashboard query
    document.getElementById('kpi-tx-jour').innerText = "3 421";
    document.getElementById('kpi-volume-jour').innerText = "2,4M €";
    document.getElementById('kpi-alertes-fraude').innerText = "8";
    document.getElementById('kpi-alertes-fraude-sub').innerText = "3 nouvelles";
    
    // Répartition Clients Mock
    const total = stats.comptes_actifs || 1;
    const standard = Math.floor(total * 0.65);
    const premium = Math.floor(total * 0.30);
    const business = total - standard - premium;
    
    document.getElementById('repart-standard').innerText = formatNumber(standard);
    document.getElementById('repart-premium').innerText = formatNumber(premium);
    document.getElementById('repart-business').innerText = formatNumber(business);
    
    document.getElementById('bar-standard').style.width = `${(standard/total)*100}%`;
    document.getElementById('bar-premium').style.width = `${(premium/total)*100}%`;
    document.getElementById('bar-business').style.width = `${(business/total)*100}%`;
}

let allClients = [];

async function loadClientsTable() {
    const statutFilter = document.getElementById('filter-statut').value;
    let url = '/admin/comptes';
    if (statutFilter) {
        url += `?statut=${statutFilter}`;
    }
    
    const clients = await fetchAPI(url);
    if (!clients) return;
    
    allClients = clients;
    renderClientsTable(clients);
}

function renderClientsTable(clients) {
    const tbody = document.getElementById('clients-tbody');
    const countSpan = document.getElementById('clients-count');
    
    // Appliquer filtres front-end complémentaires (Offre, Tri)
    const offreFilter = document.getElementById('filter-offre').value;
    const triFilter = document.getElementById('filter-tri').value;
    
    let filtered = [...clients];
    
    // Note: Offre n'est pas nativement dans accounts (c'est souvent type_compte ou mock)
    // On mocke "Premium/Standard" basé sur un hash de l'id pour la démo si non présent
    filtered = filtered.map(c => {
        if (!c.offre) {
            c.offre = (c.id % 3 === 0) ? 'Premium' : ((c.id % 5 === 0) ? 'Business' : 'Standard');
        }
        return c;
    });
    
    if (offreFilter) {
        filtered = filtered.filter(c => c.offre === offreFilter);
    }
    
    if (triFilter === 'date_desc') {
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (triFilter === 'solde_desc') {
        filtered.sort((a, b) => (parseFloat(b.solde) || 0) - (parseFloat(a.solde) || 0));
    }
    
    countSpan.innerText = formatNumber(filtered.length);
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Aucun client trouvé</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(c => {
        const initiales = `${(c.prenom || 'X')[0]}${(c.nom || 'X')[0]}`.toUpperCase();
        let avatarClass = 'mr';
        if (c.offre === 'Standard') avatarClass = 'mb';
        if (c.offre === 'Business') avatarClass = 'kd';
        if (c.statut === 'bloque') avatarClass = 'kd';
        
        return `
            <tr>
                <td>
                    <div class="client-cell">
                        <div class="client-avatar ${avatarClass}">${initiales}</div>
                        <div class="client-info">
                            <span class="client-name">${c.prenom} ${c.nom}</span>
                            <span class="client-email">${c.email}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="iban-cell">
                        <span class="iban-code">${c.iban || 'Non attribué'}</span>
                        <span class="iban-bank">${c.iban ? 'NovaBanque FR' : '-'}</span>
                    </div>
                </td>
                <td>
                    <span class="offre-badge ${c.offre.toLowerCase()}">${c.offre}</span>
                </td>
                <td class="solde-cell">
                    ${formatMontant(c.solde || 0)}
                </td>
                <td style="text-align: right;">
                    ${c.statut !== 'bloque' ? 
                        `<button class="btn-alert-action bloquer" onclick="promptBlockClient(${c.id})">Bloquer</button>` : 
                        `<button class="btn-alert-action verifier" onclick="activerCompte(${c.id}, '${c.iban}')">Activer</button>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

// MOCK ALERTS (as per screenshot)
async function loadAlertes() {
    const container = document.getElementById('alerts-container');
    document.getElementById('alert-count').innerText = 8;
    
    const alertes = [
        {
            type: 'danger',
            title: 'TX suspecte - 4 200 €',
            desc: 'Karim Douiri',
            time: 'Il y a 12 min',
            action: 'Bloquer'
        },
        {
            type: 'warning',
            title: 'Connexion inhabituelle',
            desc: 'Sophie Martin - Maroc',
            time: '14:18',
            action: 'Vérifier'
        },
        {
            type: 'warning',
            title: 'Plafond carte atteint',
            desc: 'Marc Beaumont',
            time: 'Hier',
            action: 'Analyser'
        }
    ];
    
    container.innerHTML = alertes.map(a => `
        <div class="alert-item">
            <div class="alert-icon ${a.type}">
                <i class="ti ${a.type === 'danger' ? 'ti-alert-circle' : 'ti-alert-triangle'}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${a.title}</div>
                <div class="alert-desc">${a.desc}</div>
                <div class="alert-time">${a.time}</div>
            </div>
            <div class="alert-actions">
                <button class="btn-alert-action ${a.action.toLowerCase() === 'bloquer' ? 'bloquer' : 'verifier'}">
                    ${a.action}
                </button>
            </div>
        </div>
    `).join('');
}

// ACTIONS CLIENTS
function promptBlockClient(id) {
    document.getElementById('block-client-id').value = id;
    document.getElementById('modal-block-client').style.display = 'flex';
}

async function confirmBlockClient() {
    const id = document.getElementById('block-client-id').value;
    const res = await fetchAPI(`/admin/comptes/${id}/statut`, 'PATCH', { statut: 'bloque', commentaire: 'Bloqué via console Admin' });
    if (res && res.success) {
        document.getElementById('modal-block-client').style.display = 'none';
        loadClientsTable(); // Refresh
        loadDashboardStats();
    } else {
        alert("Erreur lors du blocage du compte.");
    }
}

async function activerCompte(id, currentIban) {
    // Si pas d'IBAN (en attente), générer un mock IBAN
    let iban = currentIban;
    if (!iban || iban === 'undefined' || iban === 'null') {
        iban = 'FR7630004' + Math.floor(Math.random() * 100000000000);
    }
    
    // Appelle la route : PATCH /api/admin/comptes/:accountId/activer
    const res = await fetchAPI(`/admin/comptes/${id}/activer`, 'PATCH', { iban: iban });
    if (res && res.success) {
        loadClientsTable(); // Refresh
        loadDashboardStats();
    } else {
        // Fallback: si l'API activer échoue (par ex IBAN invalide), on utilise statut actif simple
        const res2 = await fetchAPI(`/admin/comptes/${id}/statut`, 'PATCH', { statut: 'actif', commentaire: 'Débloqué via console Admin' });
        if (res2 && res2.success) {
            loadClientsTable();
            loadDashboardStats();
        } else {
            alert("Erreur lors de l'activation.");
        }
    }
}

function exportCSV() {
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

// UTILS
function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

function formatMontant(montant) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
}
