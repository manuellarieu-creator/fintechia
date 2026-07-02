// releves.js - Logique dynamique de la page des relevés

let allTransactions = [];
let groupedByMonth = {}; // ex: "2026-06": { txs: [], startBalance: 0, endBalance: 0, credits: 0, debits: 0 }
let sortedMonths = [];
let currentAccount = null;
let currentUser = null;

async function loadRelevesData() {
    try {
        // Fetch User / Account Info
        const authData = await apiCall('/auth/me');
        if (!authData || !authData.account) return;
        currentAccount = authData.account;
        currentUser = authData.user;
        
        // Fetch Transactions
        const txs = await apiCall('/transactions?limit=1000');
        allTransactions = txs;
        
        processTransactions();
        renderKPIs();
        renderHistory();
        
        if (sortedMonths.length > 0) {
            selectMonth(sortedMonths[0]); // Select latest month by default
        }
        
        renderExportForm();
        
    } catch (err) {
        console.error("Erreur lors du chargement des relevés :", err);
    }
}

function processTransactions() {
    groupedByMonth = {};
    let runningBalance = parseFloat(currentAccount.solde);
    
    // Sort transactions by date descending
    allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    allTransactions.forEach(tx => {
        const date = new Date(tx.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!groupedByMonth[monthKey]) {
            groupedByMonth[monthKey] = {
                year: date.getFullYear(),
                month: date.getMonth(),
                txs: [],
                credits: 0,
                debits: 0
            };
        }
        
        groupedByMonth[monthKey].txs.push(tx);
        
        // Calculate movements
        const montant = parseFloat(tx.montant);
        const isCredit = montant > 0 && tx.type !== 'virement_emis';
        if (isCredit) {
            groupedByMonth[monthKey].credits += Math.abs(montant);
        } else {
            groupedByMonth[monthKey].debits += Math.abs(montant);
        }
    });
    
    // Calculate balances
    sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));
    
    let currentBal = parseFloat(currentAccount.solde);
    
    sortedMonths.forEach(monthKey => {
        const group = groupedByMonth[monthKey];
        group.endBalance = currentBal;
        
        group.startBalance = group.endBalance - group.credits + group.debits;
        currentBal = group.startBalance;
    });
}

function renderKPIs() {
    document.getElementById('kpi-dispo-val').textContent = sortedMonths.length;
    
    if (sortedMonths.length > 0) {
        const oldest = new Date(groupedByMonth[sortedMonths[sortedMonths.length-1]].year, groupedByMonth[sortedMonths[sortedMonths.length-1]].month);
        const newest = new Date(groupedByMonth[sortedMonths[0]].year, groupedByMonth[sortedMonths[0]].month);
        let diffYears = (newest.getFullYear() - oldest.getFullYear());
        let diffMonths = (newest.getMonth() - oldest.getMonth());
        let totalMonths = diffYears * 12 + diffMonths + 1;
        
        document.getElementById('kpi-dispo-sub').textContent = `${totalMonths} mois d'historique`;
    }
    
    // Prochain relevé (1er du mois suivant)
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextDate.setDate(1);
    document.getElementById('kpi-next-val').textContent = "01";
    document.getElementById('kpi-next-sub').textContent = nextDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    
    document.getElementById('kpi-email-val').textContent = 'Activé';
    document.getElementById('kpi-email-sub').textContent = currentUser.email;
}

function renderHistory() {
    const listContainer = document.getElementById('releves-history-list');
    const selectDesktop = document.getElementById('history-select-desktop');
    const pillsMobile = document.getElementById('history-pills-mobile');
    
    listContainer.innerHTML = '';
    selectDesktop.innerHTML = '';
    pillsMobile.innerHTML = '';
    
    if(sortedMonths.length === 0) {
        listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Aucun relevé disponible.</div>';
        return;
    }
    
    // Group months by year
    const byYear = {};
    sortedMonths.forEach(mKey => {
        const year = groupedByMonth[mKey].year;
        if (!byYear[year]) byYear[year] = [];
        byYear[year].push(mKey);
    });
    
    const years = Object.keys(byYear).sort((a,b) => b - a);
    let selectedYear = years[0];
    
    // Render years for mobile/desktop selection
    years.forEach(year => {
        const opt = document.createElement('option');
        opt.value = year;
        opt.textContent = year;
        selectDesktop.appendChild(opt);
        
        const pill = document.createElement('div');
        pill.className = `pill-tab ${year == selectedYear ? 'active' : ''}`;
        pill.textContent = year;
        pill.onclick = () => {
            document.querySelectorAll('.pill-tab').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            renderHistoryListForYear(year, byYear);
        };
        pillsMobile.appendChild(pill);
    });
    
    selectDesktop.addEventListener('change', (e) => {
        renderHistoryListForYear(e.target.value, byYear);
    });
    
    // Render list for selected year
    renderHistoryListForYear(selectedYear, byYear);
}

function renderHistoryListForYear(year, byYearMap) {
    const listContainer = document.getElementById('releves-history-list');
    listContainer.innerHTML = `<div class="history-year">${year}</div><div class="history-list" id="active-history-list"></div>`;
    
    const ul = document.getElementById('active-history-list');
    
    byYearMap[year].forEach((mKey, index) => {
        const group = groupedByMonth[mKey];
        const monthName = new Date(group.year, group.month).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        
        const isCurrent = (index === 0 && year == Object.keys(byYearMap).sort((a,b)=>b-a)[0]);
        const statusText = isCurrent ? `En cours - ${group.txs.length} tx` : `Clôturé - ${group.txs.length} tx`;
        
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
          <div class="history-icon"><i class="ti ti-file-text"></i></div>
          <div class="history-info">
            <div class="history-month">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</div>
            <div class="history-status">${statusText}</div>
          </div>
          <div class="history-action"><i class="ti ti-download"></i></div>
        `;
        
        item.onclick = () => {
            document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            selectMonth(mKey);
        };
        
        ul.appendChild(item);
    });
    
    if (ul.firstChild) {
        ul.firstChild.classList.add('active');
    }
}

function selectMonth(mKey) {
    const group = groupedByMonth[mKey];
    if (!group) return;
    
    const monthNameFull = new Date(group.year, group.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const isCurrent = mKey === sortedMonths[0];
    
    document.getElementById('center-title').innerHTML = `Relevé — ${monthNameFull.charAt(0).toUpperCase() + monthNameFull.slice(1)} <span id="center-status-badge" style="font-size: 11px; padding: 2px 8px; background: var(--primary-light); color: var(--primary); border-radius: 12px; font-weight: 600; display:${isCurrent ? 'inline-block' : 'none'};">En cours</span>`;
    
    const lastDay = new Date(group.year, group.month + 1, 0).getDate();
    document.getElementById('center-meta').textContent = `Compte courant • **** ${currentAccount.id.toString().slice(-4) || '4821'} • Du 01 au ${lastDay} ${monthNameFull}`;
    
    const balancesHtml = `
        <div class="balance-item">
          <div class="balance-label">INITIAL</div>
          <div class="balance-value">${group.startBalance.toFixed(2).replace('.', ',')} €</div>
          <div class="balance-date">01/${String(group.month+1).padStart(2,'0')}</div>
        </div>
        <div class="balance-item">
          <div class="balance-label">MVTS</div>
          <div class="movements-list">
            <div style="color:var(--text-main);">+${group.credits.toFixed(2).replace('.', ',')} €</div>
            <div style="color:var(--text-main);">${group.debits > 0 ? '-' : ''}${group.debits.toFixed(2).replace('.', ',')} €</div>
          </div>
        </div>
        <div class="balance-item">
          <div class="balance-label">ACTUEL</div>
          <div class="balance-value blue">${group.endBalance.toFixed(2).replace('.', ',')} €</div>
          <div class="balance-date">${lastDay}/${String(group.month+1).padStart(2,'0')}</div>
        </div>
    `;
    document.getElementById('releves-balances').innerHTML = balancesHtml;
    
    const txContainer = document.getElementById('releves-tx-list');
    
    if (group.txs.length === 0) {
        txContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 14px;">Aucune transaction sur cette période.</div>';
    } else {
        let txHtml = '';
        let runningTxBal = group.endBalance; 
        
        group.txs.forEach((tx) => {
            const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis';
            let libelle = tx.description || 'Transaction';
            if(tx.type === 'virement_recu') libelle = 'Virement reçu — ' + (tx.emetteur || '');
            if(tx.type === 'virement_emis') libelle = 'Virement émis — ' + (tx.destinataire || '');

            const typeLabel = isCredit ? 'Crédit' : 'Débit';
            const icon = isCredit ? 'ti-arrow-down' : 'ti-shopping-cart'; 
            const amountClass = isCredit ? 'credit' : 'debit';
            const sign = isCredit ? '+' : '';
            
            const date = new Date(tx.created_at);
            const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth()+1).padStart(2, '0')}`;
            
            txHtml += `
                <div class="tx-item">
                  <div class="tx-icon" style="${isCredit ? 'transform: rotate(45deg);' : ''}"><i class="ti ${icon}" style="${isCredit ? 'transform: rotate(-45deg);' : ''}"></i></div>
                  <div class="tx-info">
                    <div class="tx-name">${libelle}</div>
                    <div class="tx-type">${typeLabel}</div>
                  </div>
                  <div class="tx-date desktop-only">${dateStr}</div>
                  <div class="tx-amount-col">
                    <div class="tx-amount ${amountClass}">${sign}${Math.abs(tx.montant).toFixed(2).replace('.', ',')} €</div>
                    <div class="tx-balance-after mobile-only">${runningTxBal.toFixed(2).replace('.', ',')} €</div>
                  </div>
                </div>
            `;
            
            if (isCredit) {
                runningTxBal -= Math.abs(tx.montant);
            } else {
                runningTxBal += Math.abs(tx.montant);
            }
        });
        
        txContainer.innerHTML = txHtml;
    }
}

function renderExportForm() {
    const selPeriode = document.getElementById('export-periode-select');
    const selCompte = document.getElementById('export-compte-select');
    
    if (selPeriode) {
        selPeriode.innerHTML = '';
        sortedMonths.forEach(mKey => {
            const group = groupedByMonth[mKey];
            const name = new Date(group.year, group.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            selPeriode.innerHTML += `<option value="${mKey}">${name.charAt(0).toUpperCase() + name.slice(1)}</option>`;
        });
    }
    
    if (selCompte && currentAccount) {
        selCompte.innerHTML = `<option value="${currentAccount.id}">Compte courant **** ${currentAccount.id.toString().slice(-4) || '4821'}</option>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Si apiCall n'est pas défini (car app.js n'est pas importé ou importé après)
    if (typeof window.apiCall === 'undefined') {
        window.apiCall = async function(endpoint, method = 'GET', body = null) {
            const token = localStorage.getItem('fintech_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const options = { method, headers };
            if (body) options.body = JSON.stringify(body);
            const res = await fetch(`/api${endpoint}`, options);
            if (res.status === 401 && endpoint !== '/auth/login') {
                localStorage.removeItem('fintech_token');
                window.location.href = 'index.html'; 
                return null;
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur API');
            return data;
        };
    }
    
    loadRelevesData();
    
    const searchInput = document.querySelector('.search-input input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const txItems = document.querySelectorAll('.tx-item');
            
            txItems.forEach(tx => {
                const text = tx.textContent.toLowerCase();
                if (text.includes(term)) {
                    tx.style.display = 'flex';
                } else {
                    tx.style.display = 'none';
                }
            });
        });
    }

    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const periode = document.getElementById('export-periode-select').value;
            const format = document.getElementById('export-format-select').value;
            alert(\`Génération du relevé pour la période \${periode} au format \${format.toUpperCase()} réussie.\`);
        });
    }
});
