
function $(id) {
    const isMobile = window.innerWidth <= 768;
    const parent = isMobile ? document.getElementById('m-view-releves') : document.getElementById('view-releves');
    if (!parent) return document.getElementById(id);
    const el = parent.querySelector('[id="' + id + '"]');
    return el ? el : document.getElementById(id);
}
// releves.js - Logique dynamique de la page des relevés

let allTransactions = [];
let groupedByMonth = {}; // ex: "2026-06": { txs: [], startBalance: 0, endBalance: 0, credits: 0, debits: 0 }
let sortedMonths = [];
let currentAccount = null;
let currentUser = null;

// Variables pour la modale d'export
let currentExportFormat = 'pdf'; // 'pdf' ou 'csv'
let currentExportPeriod = null; 

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
    document.querySelectorAll(`[id=${'kpi-dispo-val'}]`).forEach(el => el.textContent = sortedMonths.length);
    
    if (sortedMonths.length > 0) {
        const oldest = new Date(groupedByMonth[sortedMonths[sortedMonths.length-1]].year, groupedByMonth[sortedMonths[sortedMonths.length-1]].month);
        const newest = new Date(groupedByMonth[sortedMonths[0]].year, groupedByMonth[sortedMonths[0]].month);
        let diffYears = (newest.getFullYear() - oldest.getFullYear());
        let diffMonths = (newest.getMonth() - oldest.getMonth());
        let totalMonths = diffYears * 12 + diffMonths + 1;
        
        document.querySelectorAll(`[id=${'kpi-dispo-sub'}]`).forEach(el => el.textContent = `${totalMonths} mois d'historique`);
    }
    
    // Prochain relevé (1er du mois suivant)
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextDate.setDate(1);
    document.querySelectorAll(`[id=${'kpi-next-val'}]`).forEach(el => el.textContent = "01");
    document.querySelectorAll(`[id=${'kpi-next-sub'}]`).forEach(el => el.textContent = nextDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
    
    document.querySelectorAll(`[id=${'kpi-email-val'}]`).forEach(el => el.textContent = 'Activé');
    document.querySelectorAll(`[id=${'kpi-email-sub'}]`).forEach(el => el.textContent = currentUser.email);
}

function renderHistory() {
    const listContainer = $('releves-history-list');
    const selectDesktop = $('history-select-desktop');
    const pillsMobile = $('history-pills-mobile');
    
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
    const listContainer = $('releves-history-list');
    listContainer.innerHTML = `<div class="history-year">${year}</div><div class="history-list" id="active-history-list"></div>`;
    
    const ul = $('active-history-list');
    
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
    currentExportPeriod = mKey;
    const group = groupedByMonth[mKey];
    if (!group) return;
    
    const monthNameFull = new Date(group.year, group.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const isCurrent = mKey === sortedMonths[0];
    
    document.querySelectorAll(`[id=${'center-title'}]`).forEach(el => el.innerHTML = `Relevé — ${monthNameFull.charAt(0).toUpperCase() + monthNameFull.slice(1)} <span id="center-status-badge" style="font-size: 11px; padding: 2px 8px; background: var(--primary-light); color: var(--primary); border-radius: 12px; font-weight: 600; display:${isCurrent ? 'inline-block' : 'none'};">En cours</span>`);
    
    const lastDay = new Date(group.year, group.month + 1, 0).getDate();
    document.querySelectorAll(`[id=${'center-meta'}]`).forEach(el => el.textContent = `Compte courant • ${currentAccount.iban || ('**** ' + currentAccount.id.toString().slice(-4))} • Du 01 au ${lastDay} ${monthNameFull}`);
    
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
    document.querySelectorAll(`[id=${'releves-balances'}]`).forEach(el => el.innerHTML = balancesHtml);
    
    const txContainer = $('releves-tx-list');
    
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
    const selPeriode = $('export-periode-select');
    const selCompte = $('export-compte-select');
    
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


/* --- Logique d'Export (PDF et CSV) --- */

function openExportModal(format, period) {
    currentExportFormat = format;
    currentExportPeriod = period || (sortedMonths.length > 0 ? sortedMonths[0] : null);
    
    document.querySelectorAll(`[id=${'export-email-input'}]`).forEach(el => el.value = currentUser ? currentUser.email : '');
    $('modal-export-settings').style.display = 'flex';
}

function handleExportConfirm() {
    const action = $('export-action').value;
    const email = $('export-email-input').value;
    
    if (action === 'email' && !email) {
        alert("Veuillez saisir une adresse email.");
        return;
    }
    
    if (currentExportFormat === 'csv') {
        generateCSV(currentExportPeriod, action, email);
    } else {
        generatePDF(currentExportPeriod, action, email);
    }
    
    $('modal-export-settings').style.display = 'none';
}

function generateCSV(mKey, action, email) {
    const group = groupedByMonth[mKey];
    if (!group) return;
    
    let csvContent = "Date,Libellé,Catégorie,Montant\n";
    
    group.txs.forEach(tx => {
        const date = new Date(tx.created_at).toLocaleDateString('fr-FR');
        const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis';
        let libelle = tx.description || 'Transaction';
        if(tx.type === 'virement_recu') libelle = 'Virement reçu - ' + (tx.emetteur || '');
        if(tx.type === 'virement_emis') libelle = 'Virement émis - ' + (tx.destinataire || '');
        
        const typeLabel = isCredit ? 'Crédit' : 'Débit';
        const sign = isCredit ? '+' : '';
        const montant = `${sign}${Math.abs(tx.montant).toFixed(2).replace('.', ',')}`;
        
        // Escape quotes if needed
        csvContent += `"${date}","${libelle}","${typeLabel}","${montant}"\n`;
    });
    
    if (action === 'download') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Releve_Fintechia_${mKey}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        alert(`Le fichier CSV a bien été envoyé à ${email}.`);
    }
}

function generatePDF(mKey, action, email) {
    const group = groupedByMonth[mKey];
    if (!group) return;
    
    // 1. Fill the template
    const monthNameFull = new Date(group.year, group.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const lastDay = new Date(group.year, group.month + 1, 0).getDate();
    
    document.querySelectorAll(`[id=${'pdf-month-title'}]`).forEach(el => el.textContent = `Relevé ${monthNameFull.charAt(0).toUpperCase() + monthNameFull.slice(1)}`);
    document.querySelectorAll(`[id=${'pdf-date-range'}]`).forEach(el => el.textContent = `Période du 01 au ${lastDay} ${monthNameFull}`);
    
    document.querySelectorAll(`[id=${'pdf-user-name'}]`).forEach(el => el.textContent = `${currentUser.prenom} ${currentUser.nom}`);
    document.querySelectorAll(`[id=${'pdf-user-email'}]`).forEach(el => el.textContent = currentUser.email);
    document.querySelectorAll(`[id=${'pdf-account-id'}]`).forEach(el => el.textContent = `IBAN: ${currentAccount.iban || ('**** ' + currentAccount.id.toString().slice(-4))}`);
    
    document.querySelectorAll(`[id=${'pdf-balance-start'}]`).forEach(el => el.textContent = `${group.startBalance.toFixed(2).replace('.', ',')} €`);
    document.querySelectorAll(`[id=${'pdf-balance-credits'}]`).forEach(el => el.textContent = `+${group.credits.toFixed(2).replace('.', ',')} €`);
    document.querySelectorAll(`[id=${'pdf-balance-debits'}]`).forEach(el => el.textContent = `-${group.debits.toFixed(2).replace('.', ',')} €`);
    document.querySelectorAll(`[id=${'pdf-balance-end'}]`).forEach(el => el.textContent = `${group.endBalance.toFixed(2).replace('.', ',')} €`);
    
    const tbody = $('pdf-tx-tbody');
    tbody.innerHTML = '';
    
    group.txs.forEach((tx, idx) => {
        const date = new Date(tx.created_at).toLocaleDateString('fr-FR');
        const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis';
        let libelle = tx.description || 'Transaction';
        if(tx.type === 'virement_recu') libelle = 'Virement reçu - ' + (tx.emetteur || '');
        if(tx.type === 'virement_emis') libelle = 'Virement émis - ' + (tx.destinataire || '');
        
        const typeLabel = isCredit ? 'Crédit' : 'Débit';
        const sign = isCredit ? '+' : '';
        const color = isCredit ? '#16a34a' : '#dc2626';
        
        const tr = document.createElement('tr');
        if (idx !== group.txs.length - 1) {
            tr.style.borderBottom = '1px solid #E2E8F0';
        }
        
        tr.innerHTML = `
          <td style="padding: 12px 8px;">${date}</td>
          <td style="padding: 12px 8px; font-weight: 500;">${libelle}</td>
          <td style="padding: 12px 8px;">${typeLabel}</td>
          <td style="text-align: right; padding: 12px 8px; color: ${color}; font-weight: 600;">${sign}${Math.abs(tx.montant).toFixed(2).replace('.', ',')} €</td>
        `;
        tbody.appendChild(tr);
    });
    
    // 2. Generate PDF
    const element = $('pdf-content');
    element.parentElement.style.display = 'block'; // Make it visible temporarily for rendering
    
    const opt = {
      margin:       0.5,
      filename:     `Releve_Fintechia_${mKey}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    if (action === 'download') {
        html2pdf().set(opt).from(element).save().then(() => {
            element.parentElement.style.display = 'none';
        });
    } else {
        // Just simulate creation
        html2pdf().set(opt).from(element).output('blob').then((pdfBlob) => {
            element.parentElement.style.display = 'none';
            alert(`Le relevé PDF a bien été généré et envoyé à ${email}.`);
        });
    }
}


// --- Initialisation DOM ---

document.addEventListener('DOMContentLoaded', () => {
    // Si apiCall n'est pas défini
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
    
    if (localStorage.getItem('fintech_token')) {
        loadRelevesData();
    }
    
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

    // Export button (Form)
    const btnExport = $('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const periode = $('export-periode-select').value;
            const format = $('export-format-select').value;
            openExportModal(format, periode);
        });
    }
    
    // Column buttons
    const btnDownloadCsv = $('btn-download-csv');
    if (btnDownloadCsv) {
        btnDownloadCsv.addEventListener('click', () => openExportModal('csv', currentExportPeriod));
    }
    
    const btnDownloadPdf = $('btn-download-pdf');
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', () => openExportModal('pdf', currentExportPeriod));
    }
    
    // Modal events
    const actionSelect = $('export-action');
    if (actionSelect) {
        actionSelect.addEventListener('change', (e) => {
            if (e.target.value === 'email') {
                $('export-email-group').style.display = 'block';
            } else {
                $('export-email-group').style.display = 'none';
            }
        });
    }
    
    const btnConfirmExport = $('btn-confirm-export');
    if (btnConfirmExport) {
        btnConfirmExport.addEventListener('click', handleExportConfirm);
    }
});
