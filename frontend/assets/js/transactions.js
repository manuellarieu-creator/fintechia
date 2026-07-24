async function loadTransactions() {
  const containerMobile = document.getElementById('tx-tbody-mobile');
  const containerDesktop = document.getElementById('tx-tbody-desktop');
  
  if (!containerMobile && !containerDesktop) return;

  try {
    const txs = await apiCall('/transactions?limit=5');
    
    if (txs.length === 0) {
      if(containerMobile) containerMobile.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:15px;">Aucune transaction récente.</td></tr>';
      if(containerDesktop) containerDesktop.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">Aucune transaction récente.</td></tr>';
    } else {
      // Lignes Mobile (Nouveau design)
      const mobileRows = txs.map(tx => {
        const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis' && tx.type !== 'debit';
        const typeLabel = isCredit ? 'Crédit' : 'Débit';
        const badgeClass = isCredit ? 'badge-success' : 'badge-neutral';
        const amountClass = isCredit ? 'pos' : 'neg';
        const sign = isCredit ? '+' : '-';
        const date = new Date(tx.created_at).toLocaleDateString((typeof window.getCurrentLocale === 'function' ? window.getCurrentLocale() : 'fr-FR'), { day: '2-digit', month: 'short' });
        
        let libelle = tx.libelle || tx.description || 'Transaction';
        if(tx.type === 'virement_recu') libelle = 'Virement reçu — ' + (tx.emetteur || '');
        if(tx.type === 'virement_emis') libelle = 'Virement émis — ' + (tx.destinataire || '');

        const iconClass = isCredit ? 'success' : 'neutral';
        const icon = isCredit ? 'ti-arrow-down-left' : 'ti-arrow-up-right';

        return `
          <div class="tx">
            <div class="tx-icon ${iconClass}"><i class="ti ${icon}"></i></div>
            <div class="tx-body">
              <div class="tx-name">${libelle}</div>
              <div class="tx-meta">${date} <span class="badge ${badgeClass}">${typeLabel}</span></div>
            </div>
            <div class="tx-amount ${amountClass}">${sign}${Math.abs(tx.montant).toFixed(2).replace('.', ',')} €</div>
          </div>
        `;
      }).join('');

      // Lignes Desktop (Format Fintechia)
      const desktopRows = txs.map(tx => {
        const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis' && tx.type !== 'debit';
        const typeLabel = isCredit ? 'Crédit' : 'Débit';
        const catClass = isCredit ? 'badge-green' : 'badge-grey';
        const icon = isCredit ? '<i class="ti ti-arrow-down-left"></i>' : '<i class="ti ti-arrow-up-right"></i>';
        const iconClass = isCredit ? 'icon-green' : 'icon-grey';
        const amountClass = isCredit ? 'text-green' : 'text-black';
        const sign = isCredit ? '+' : '-';
        const date = new Date(tx.created_at).toLocaleDateString((typeof window.getCurrentLocale === 'function' ? window.getCurrentLocale() : 'fr-FR'), { day: '2-digit', month: 'short' });
        
        let libelle = tx.libelle || tx.description || 'Transaction';
        if(tx.type === 'virement_recu') libelle = 'Virement reçu — ' + (tx.emetteur || '');
        if(tx.type === 'virement_emis') libelle = 'Virement émis — ' + (tx.destinataire || '');

        return `
          <tr class="tx-row" data-type="${isCredit ? 'credit' : 'debit'}">
            <td>
              <div class="nb-tx-lib">
                <div class="nb-tx-icon ${iconClass}">${icon}</div>
                <span>${libelle}</span>
              </div>
            </td>
            <td>${date}</td>
            <td><span class="nb-cat-badge ${catClass}">${typeLabel}</span></td>
            <td class="right ${amountClass}">${sign} ${Math.abs(tx.montant).toFixed(2).replace('.', ',')} €</td>
          </tr>
        `;
      }).join('');

      if(containerMobile) containerMobile.innerHTML = mobileRows;
      if(containerDesktop) containerDesktop.innerHTML = desktopRows;
    }

    // Calcul des revenus et dépenses (sur base des transactions chargées)
    let totalRevenus = 0;
    let totalDepenses = 0;
    const revenusGroup = {};
    const depensesGroup = {};

    txs.forEach(tx => {
      const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis' && tx.type !== 'debit';
      const m = Math.abs(parseFloat(tx.montant));
      
      if(isCredit) {
        totalRevenus += m;
        const cat = tx.type === 'virement_recu' ? 'Virement reçu' : 'Dépôt';
        revenusGroup[cat] = (revenusGroup[cat] || 0) + m;
      } else {
        totalDepenses += m;
        let cat = 'Paiement / Retrait';
        if (tx.type === 'virement_emis') cat = 'Virement émis';
        if (tx.type === 'debit') cat = 'Débit';
        depensesGroup[cat] = (depensesGroup[cat] || 0) + m;
      }
    });

    const revenusTotalEl = document.getElementById('revenus-total-desktop');
    if(revenusTotalEl) revenusTotalEl.innerText = `${totalRevenus.toFixed(2).replace('.', ',')} €`;
    
    const depensesTotalEl = document.getElementById('depenses-total-desktop');
    if(depensesTotalEl) depensesTotalEl.innerText = `${totalDepenses.toFixed(2).replace('.', ',')} €`;

    // Mobile stats
    const revenusMobileEl = document.getElementById('revenus-mobile');
    if(revenusMobileEl) revenusMobileEl.innerText = `${totalRevenus.toFixed(2).replace('.', ',')} €`;
    const depensesMobileEl = document.getElementById('depenses-mobile');
    if(depensesMobileEl) depensesMobileEl.innerText = `${totalDepenses.toFixed(2).replace('.', ',')} €`;

    const revenusListEl = document.getElementById('revenus-list-desktop');
    if(revenusListEl) {
      revenusListEl.innerHTML = Object.entries(revenusGroup).map(([k, v]) => `
        <div class="nb-stat-item"><span>${k}</span><b>${v.toFixed(2).replace('.', ',')} €</b></div>
      `).join('');
    }

    const depensesListEl = document.getElementById('depenses-list-desktop');
    if(depensesListEl) {
      depensesListEl.innerHTML = Object.entries(depensesGroup).map(([k, v]) => `
        <div class="nb-stat-item"><span>${k}</span><b>${v.toFixed(2).replace('.', ',')} €</b></div>
      `).join('');
    }

    // Calcul et affichage des budgets
    const budgetListEl = document.getElementById('budget-list-desktop');
    const budgetListMobileEl = document.getElementById('budget-list-mobile');
    
    if(typeof userBudgets !== 'undefined') {
      if(userBudgets.length === 0) {
        if(budgetListEl) budgetListEl.innerHTML = '<p style="font-size:13px; color:#64748B;">Aucun budget défini. Cliquez sur Gérer pour commencer.</p>';
        if(budgetListMobileEl) budgetListMobileEl.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">Aucun budget.</p>';
      } else {
        const desktopBudgets = userBudgets.map(b => {
          const spent = txs.filter(tx => {
            const isDebit = parseFloat(tx.montant) < 0 || tx.type === 'virement_emis' || tx.type === 'debit';
            if(!isDebit) return false;
            let lib = tx.libelle || tx.description || 'Transaction';
            if(tx.type === 'virement_emis') lib = 'Virement émis — ' + (tx.destinataire || '');
            return lib.toLowerCase().includes(b.categorie.toLowerCase());
          }).reduce((acc, curr) => acc + Math.abs(parseFloat(curr.montant)), 0);

          const limit = parseFloat(b.limite);
          let pct = (spent / limit) * 100;
          if(pct > 100) pct = 100;
          
          let colorClass = 'fill-green';
          if(pct > 75) colorClass = 'fill-orange';
          if(pct > 90) colorClass = 'fill-red';

          return `
            <div class="nb-budget-item">
              <div class="nb-budget-head">
                <span>${b.categorie}</span>
                <span>${spent.toFixed(2).replace('.',',')} / ${limit.toFixed(2).replace('.',',')} €</span>
              </div>
              <div class="nb-budget-bar">
                <div class="nb-budget-fill ${colorClass}" style="width:${pct}%"></div>
              </div>
            </div>
          `;
        }).join('');

        const mobileBudgets = userBudgets.map(b => {
          const spent = txs.filter(tx => {
            const isDebit = parseFloat(tx.montant) < 0 || tx.type === 'virement_emis' || tx.type === 'debit';
            if(!isDebit) return false;
            let lib = tx.description || 'Transaction';
            if(tx.type === 'virement_emis') lib = 'Virement émis — ' + (tx.destinataire || '');
            return lib.toLowerCase().includes(b.categorie.toLowerCase());
          }).reduce((acc, curr) => acc + Math.abs(parseFloat(curr.montant)), 0);

          const limit = parseFloat(b.limite);
          let pct = (spent / limit) * 100;
          if(pct > 100) pct = 100;
          
          let color = 'var(--success)';
          if(pct > 75) color = 'var(--warning)';
          if(pct > 90) color = 'var(--danger)';

          return `
            <div class="budget-row">
              <div class="budget-labels"><span>${b.categorie}</span><span>${spent.toFixed(0)} / ${limit.toFixed(0)} €</span></div>
              <div class="budget-track"><div class="budget-fill" style="width:${pct}%;background:${color};"></div></div>
            </div>
          `;
        }).join('');

        if(budgetListEl) budgetListEl.innerHTML = desktopBudgets;
        if(budgetListMobileEl) budgetListMobileEl.innerHTML = mobileBudgets;
      }
    }

  } catch (err) {
    console.error('Erreur chargement transactions:', err);
  }
}

// Logique de pagination spécifique à la page Virements
let currentVirementPage = 1;
const VIREMENT_PAGE_SIZE = 10;

async function loadVirementHistory(page = 1) {
  currentVirementPage = page;
  const tbody = document.getElementById('virement-tx-tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">Chargement...</td></tr>';

  try {
    const offset = (page - 1) * VIREMENT_PAGE_SIZE;
    const txs = await apiCall(`/transactions?limit=${VIREMENT_PAGE_SIZE}&offset=${offset}`);

    if (txs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">Aucune transaction trouvée.</td></tr>';
      document.getElementById('virement-btn-next').disabled = true;
    } else {
      tbody.innerHTML = txs.map(tx => {
        const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis' && tx.type !== 'debit';
        const date = new Date(tx.created_at).toLocaleDateString((typeof window.getCurrentLocale === 'function' ? window.getCurrentLocale() : 'fr-FR'));
        
        let libelle = tx.description || 'Transaction';
        if(tx.type === 'virement_recu') libelle = 'Virement reçu — ' + (tx.emetteur || '');
        if(tx.type === 'virement_emis') libelle = 'Virement émis — ' + (tx.destinataire || '');

        const color = isCredit ? 'var(--success)' : 'var(--text-main)';
        const sign = isCredit ? '+' : '';

        return `
          <tr>
            <td><div style="display:flex; align-items:center; gap:12px;">
              <div style="width:32px; height:32px; border-radius:50%; background:var(--bg-body); display:flex; align-items:center; justify-content:center;">
                <i class="${isCredit ? 'ti ti-arrow-down-left' : 'ti ti-shopping-bag'}" style="color:${isCredit ? 'var(--success)' : 'var(--text-muted)'}"></i>
              </div>
              <span style="font-weight:600; color:var(--text-main);">${libelle}</span>
            </div></td>
            <td style="color:var(--text-muted);">${date}</td>
            <td><span class="badge ${isCredit ? 'badge-success' : 'badge-neutral'}">${tx.categorie || 'Divers'}</span></td>
            <td style="text-align:right; font-weight:700; color:${color};">${sign}${parseFloat(tx.montant).toFixed(2)} €</td>
          </tr>
        `;
      }).join('');

      // Gestion des boutons
      document.getElementById('virement-btn-prev').disabled = (page === 1);
      document.getElementById('virement-btn-next').disabled = (txs.length < VIREMENT_PAGE_SIZE);
      document.getElementById('virement-tx-info').innerText = 'Page ' + page;
    }
  } catch (err) {
    console.error('Erreur loadVirementHistory:', err);
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:red;">Erreur lors du chargement.</td></tr>';
  }
}

function changeVirementPage(dir) {
  loadVirementHistory(currentVirementPage + dir);
}
