async function loadBudgetsPage() {
  const container = document.getElementById('budget-page-list');
  const containerMobile = document.getElementById('budget-page-list-mobile');
  
  if(userBudgets.length === 0) {
    if(container) container.innerHTML = '<p style="color:#64748B;">Aucun budget mensuel défini.</p><br><button onclick="openModal(\'modal-budgets\')" class="nb-btn-primary">Créer mon premier budget</button>';
    if(containerMobile) containerMobile.innerHTML = '<p style="color:var(--text-muted); font-size:12px;">Aucun budget mensuel défini.</p>';
    return;
  }
  
  // Comment out the old logic that overwrites the page with the dashboard view
  // const dashBudget = document.getElementById('budget-list-desktop');
  // if(container && dashBudget) {
  //   container.innerHTML = dashBudget.innerHTML + '<br><br><button onclick="openModal(\'modal-budgets\')" class="nb-btn-primary">Gérer mes enveloppes</button>';
  // }

  if(containerMobile) {
    let txs = [];
    try {
      txs = await apiCall('/transactions?limit=100');
    } catch(e) {}

    let revenus = 0;
    let depenses = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const categoriesDepenses = {};

    txs.forEach(tx => {
       const txDate = new Date(tx.created_at);
       if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
           const montant = parseFloat(tx.montant);
           if (montant > 0 && tx.type !== 'virement_emis') revenus += montant;
           else depenses += Math.abs(montant);
           
           if (montant < 0 || tx.type === 'virement_emis') {
               const cat = tx.categorie || 'Divers';
               categoriesDepenses[cat] = (categoriesDepenses[cat] || 0) + Math.abs(montant);
           }
       }
    });

    const budgetTotal = userBudgets.reduce((sum, b) => sum + parseFloat(b.limite), 0) || 2880;
    const reste = Math.max(0, budgetTotal - depenses);
    const epargne = revenus - depenses > 0 ? (revenus - depenses) * 0.2 : 0; // Simulate 20% savings

    const icons = { 'Logement': 'ti-home', 'Courses': 'ti-shopping-cart', 'Transports': 'ti-car', 'Abonnements': 'ti-refresh', 'Loisirs': 'ti-ticket', 'Santé': 'ti-heart', 'Restaurants': 'ti-cutlery', 'Divers': 'ti-wallet' };
    
    let envHtml = '';
    userBudgets.forEach(b => {
       const spent = categoriesDepenses[b.categorie] || 0;
       const limit = parseFloat(b.limite);
       const pct = Math.min(100, Math.round((spent / limit) * 100));
       let color = 'var(--primary)';
       if (pct >= 100) color = 'var(--danger)';
       else if (pct >= 80) color = 'var(--warning)';
       else color = 'var(--success)';
       
       const icon = icons[b.categorie] || 'ti-tag';
       envHtml += `
          <div class="bdg-env-item">
             <div class="bdg-env-icon" style="color:var(--text-main); background:var(--bg-body);"><i class="ti ${icon}"></i></div>
             <div class="bdg-env-details">
                <div class="bdg-env-top">
                   <span class="bdg-env-name">${b.categorie}</span>
                   <span class="bdg-env-amounts">${spent.toFixed(0)} / ${limit.toFixed(0)} €</span>
                   <span class="bdg-env-percent" style="color:${pct >= 100 ? 'var(--danger)' : 'inherit'}">${pct}%</span>
                </div>
                <div class="bdg-progress-bg"><div class="bdg-progress-fill" style="width:${pct}%; background:${color};"></div></div>
             </div>
          </div>
       `;
    });

    if (userBudgets.length === 0) {
       envHtml = '<div style="text-align:center; padding: 20px; color:var(--text-muted);">Aucune enveloppe définie.</div>';
    }

    let recentTxsHtml = txs.slice(0, 4).map(tx => {
        const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis';
        let libelle = tx.description || 'Transaction';
        if(tx.type === 'virement_recu') libelle = 'Virement reçu';
        if(tx.type === 'virement_emis') libelle = 'Virement émis';
        const icon = isCredit ? 'ti-arrow-down-left' : 'ti-shopping-bag';
        const sign = isCredit ? '+' : '';
        const date = new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        
        return `
          <div class="bdg-tx-item">
             <div class="bdg-tx-icon"><i class="ti ${icon}"></i></div>
             <div class="bdg-tx-info">
                <strong>${libelle}</strong><span>${tx.categorie || 'Divers'} - ${date}</span>
             </div>
             <div class="bdg-tx-amt" style="color: ${isCredit ? 'var(--success)' : 'inherit'}">${sign}${parseFloat(tx.montant).toFixed(2).replace('.',',')} €</div>
          </div>
        `;
    }).join('');

    const monthStr = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    const capitalizedMonthStr = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);

    containerMobile.innerHTML = `
      <div class="m-bdg-header">
        <div>
          <div class="m-bdg-title">Budget</div>
          <div class="m-bdg-subtitle">Suivez vos dépenses</div>
        </div>
        <div class="m-bdg-month">
          <button><i class="ti ti-chevron-left"></i></button>
          <span>${capitalizedMonthStr}</span>
          <button><i class="ti ti-chevron-right"></i></button>
        </div>
      </div>

      <div class="m-bdg-grid-2">
        <div class="m-bdg-metric">
          <div class="m-bdg-metric-title">REVENUS MOIS</div>
          <div class="m-bdg-metric-val">${revenus.toFixed(0)} €</div>
          <div class="m-bdg-metric-sub pos">+8% vs préc.</div>
        </div>
        <div class="m-bdg-metric">
          <div class="m-bdg-metric-title">DÉPENSES MOIS</div>
          <div class="m-bdg-metric-val">${depenses.toFixed(0)} €</div>
          <div class="m-bdg-metric-sub neg">+12% vs préc.</div>
        </div>
        <div class="m-bdg-metric">
          <div class="m-bdg-metric-title">ÉPARGNE DU MOIS</div>
          <div class="m-bdg-metric-val">${epargne.toFixed(0)} €</div>
          <div class="m-bdg-metric-sub">Obj. 400 € - ${Math.min(100, Math.round((epargne/400)*100))}%</div>
        </div>
        <div class="m-bdg-metric">
          <div class="m-bdg-metric-title">RESTE À DÉPENSER</div>
          <div class="m-bdg-metric-val">${reste.toFixed(0)} €</div>
          <div class="m-bdg-metric-sub">Budget : ${budgetTotal.toFixed(0)} €</div>
        </div>
      </div>

      <div class="nb-card" style="margin-bottom: 24px; padding: 16px;">
          <div class="bdg-card-header" style="margin-bottom:16px;">
            <h3 style="margin:0; font-size:1.1rem;">Répartition</h3>
            <span style="font-size:0.8rem; color:var(--text-muted);">${capitalizedMonthStr}</span>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
              <div class="bdg-donut-wrap" style="width:100px; height:100px;">
                <svg viewBox="0 0 36 36" class="bdg-donut">
                    <circle class="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="#DC2626" stroke-width="4" stroke-dasharray="40 60" stroke-dashoffset="25"></circle>
                    <circle class="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="#F59E0B" stroke-width="4" stroke-dasharray="20 80" stroke-dashoffset="-15"></circle>
                    <circle class="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="#2563EB" stroke-width="4" stroke-dasharray="15 85" stroke-dashoffset="-35"></circle>
                    <circle class="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="#10B981" stroke-width="4" stroke-dasharray="10 90" stroke-dashoffset="-50"></circle>
                    <circle class="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="#94A3B8" stroke-width="4" stroke-dasharray="15 85" stroke-dashoffset="-60"></circle>
                </svg>
                <div class="bdg-donut-inner">
                    <div class="val" style="font-size:1rem;">${depenses.toFixed(0)}€</div>
                    <div class="lbl" style="font-size:0.65rem;">total</div>
                </div>
              </div>
              <div class="bdg-legend" style="flex:1;">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><div style="display:flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; background:#DC2626; border-radius:2px;"></span>Logement</div><strong>40%</strong></div>
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><div style="display:flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; background:#F59E0B; border-radius:2px;"></span>Courses</div><strong>20%</strong></div>
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><div style="display:flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; background:#2563EB; border-radius:2px;"></span>Transports</div><strong>15%</strong></div>
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;"><div style="display:flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; background:#10B981; border-radius:2px;"></span>Abo.</div><strong>10%</strong></div>
                <div style="display:flex; justify-content:space-between; font-size:0.75rem;"><div style="display:flex; align-items:center; gap:4px;"><span style="width:8px; height:8px; background:#94A3B8; border-radius:2px;"></span>Autres</div><strong>15%</strong></div>
              </div>
          </div>
      </div>

      <div class="nb-card" style="margin-bottom: 24px; padding: 16px;">
          <div class="bdg-card-header" style="margin-bottom:12px;">
            <h3 style="margin:0; font-size:1.1rem;">Alertes budget</h3>
            <a href="#" style="font-size:0.8rem; color:var(--primary); font-weight:600; text-decoration:none;">Configurer</a>
          </div>
          <div class="bdg-alerts">
            <div class="bdg-alert-item">
                <div class="bdg-alert-icon" style="font-size:1rem;"><i class="ti ti-clock"></i></div>
                <div class="bdg-alert-text">
                  <strong style="font-size:0.8rem;">Logement — Plafond atteint</strong>
                  <span style="font-size:0.7rem;">750 € / 750 € consommés</span>
                </div>
            </div>
          </div>
      </div>

      <div class="nb-card" style="margin-bottom: 24px; padding: 16px;">
          <div class="bdg-card-header">
            <h3 style="margin:0; font-size:1.1rem;">Enveloppes</h3>
            <div style="display:flex; background:var(--bg-body); border-radius:8px; padding:2px;">
                <button style="padding:4px 10px; font-size:11px; border:none; border-radius:6px; background:var(--primary); color:white; font-weight:600;">Mois</button>
                <button style="padding:4px 10px; font-size:11px; border:none; background:transparent; color:var(--text-muted);">Année</button>
            </div>
          </div>
          <div class="bdg-env-list">
            ${envHtml}
          </div>
          <button onclick="openModal('modal-budgets')" style="width:100%; padding:12px; margin-top:16px; border:1px dashed var(--border-strong); border-radius:8px; background:transparent; color:var(--text-muted); font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px;">
            <i class="ti ti-plus"></i> Nouvelle enveloppe
          </button>
      </div>

      <div class="nb-card" style="margin-bottom: 24px; padding: 16px;">
          <div class="bdg-card-header" style="margin-bottom:12px;">
            <h3 style="margin:0; font-size:1.1rem;">Objectif épargne</h3>
            <a href="#" style="font-size:0.8rem; color:var(--primary); font-weight:600; text-decoration:none;">Modifier</a>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:8px;">
            <div style="font-size:0.8rem; color:var(--text-muted);">${epargne.toFixed(0)} / 400 € ce mois</div>
            <div style="font-size:0.85rem; font-weight:700;">${Math.min(100, Math.round((epargne/400)*100))}%</div>
          </div>
          <div class="bdg-progress-bg" style="height:8px; margin-bottom:8px;"><div class="bdg-progress-fill" style="width:${Math.min(100, Math.round((epargne/400)*100))}%; background:var(--success);"></div></div>
          
          <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border); padding-top:12px; margin-top:16px;">
            <div>
                <div style="font-size:1.1rem; font-weight:700; margin-bottom:2px;">2 840 €</div>
                <div style="font-size:0.7rem; color:var(--text-muted);">Épargné en ${currentYear}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.1rem; font-weight:700; margin-bottom:2px;">1 960 €</div>
                <div style="font-size:0.7rem; color:var(--text-muted);">Restant à atteindre</div>
            </div>
          </div>
      </div>

      <div class="nb-card" style="margin-bottom: 24px; padding: 16px;">
          <div class="bdg-card-header" style="margin-bottom:12px;">
            <h3 style="margin:0; font-size:1.1rem;">Évolution des dépenses</h3>
            <span style="font-size:0.75rem; color:var(--text-muted);">6 mois</span>
          </div>
          <div class="bdg-chart-mini" style="height:100px; padding:0;">
              <div class="bdg-bar-col"><div class="bdg-bar-track" style="height:50px;"><div class="bdg-bar-fill" style="height:40%;"></div></div><div class="bdg-bar-lbl" style="font-size:0.65rem;">Jan</div></div>
              <div class="bdg-bar-col"><div class="bdg-bar-track" style="height:50px;"><div class="bdg-bar-fill" style="height:55%;"></div></div><div class="bdg-bar-lbl" style="font-size:0.65rem;">Fév</div></div>
              <div class="bdg-bar-col"><div class="bdg-bar-track" style="height:50px;"><div class="bdg-bar-fill" style="height:35%;"></div></div><div class="bdg-bar-lbl" style="font-size:0.65rem;">Mar</div></div>
              <div class="bdg-bar-col"><div class="bdg-bar-track" style="height:50px;"><div class="bdg-bar-fill" style="height:70%;"></div></div><div class="bdg-bar-lbl" style="font-size:0.65rem;">Avr</div></div>
              <div class="bdg-bar-col"><div class="bdg-bar-track" style="height:50px;"><div class="bdg-bar-fill" style="height:50%;"></div></div><div class="bdg-bar-lbl" style="font-size:0.65rem;">Mai</div></div>
              <div class="bdg-bar-col active"><div class="bdg-bar-track" style="height:50px;"><div class="bdg-bar-fill" style="height:75%;"></div></div><div class="bdg-bar-lbl" style="font-size:0.65rem;">Juin</div></div>
          </div>
      </div>

      <div class="nb-card" style="padding: 16px;">
          <div class="bdg-card-header" style="margin-bottom:12px;">
            <h3 style="margin:0; font-size:1.1rem;">Dernières dépenses</h3>
            <a href="#" onclick="showView('view-virements')" style="font-size:0.8rem; color:var(--primary); font-weight:600; text-decoration:none;">Voir tout &rarr;</a>
          </div>
          <div class="bdg-recent-tx">
            ${recentTxsHtml || '<div style="text-align:center;color:var(--text-muted);font-size:0.85rem;">Aucune dépense.</div>'}
          </div>
      </div>
    `;
  }
}
