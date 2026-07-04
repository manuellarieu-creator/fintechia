window.changeBudgetMonth = function(dir) {
    window.currentMonthOffset = (window.currentMonthOffset || 0) + dir;
    loadBudgetsPage();
};

async function loadBudgetsPage() {
  const container = document.getElementById('budget-page-list');
  const containerMobile = document.getElementById('budget-page-list-mobile');
  
  // On affiche le message vide dans l'enveloppe, mais on ne return pas pour pouvoir calculer le reste.
  if(userBudgets.length === 0) {
    if(container) container.innerHTML = '<p style="color:#64748B;">Aucun budget mensuel défini.</p><br><button onclick="openModal(\'modal-budgets\')" class="nb-btn-primary">Créer mon premier budget</button>';
    if(containerMobile) containerMobile.innerHTML = '<p style="color:var(--text-muted); font-size:12px;">Aucun budget mensuel défini.</p>';
  }
  
  // Desktop & Mobile logic
  let txs = [];
  try {
    txs = await apiCall('/transactions?limit=100');
  } catch(e) {}

  let revenus = 0;
  let depenses = 0;
  let revenusPrev = 0;
  let depensesPrev = 0;
  
  const offset = window.currentMonthOffset || 0;
  
  let targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + offset);
  const currentMonth = targetDate.getMonth();
  const currentYear = targetDate.getFullYear();
  
  let prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() + offset - 1);
  let prevMonth = prevDate.getMonth();
  let prevYear = prevDate.getFullYear();
  
  const categoriesDepenses = {};
  
  let monthlyDepenses = {};
  for(let i=5; i>=0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) { m += 12; y--; }
      monthlyDepenses[`${y}-${m}`] = 0;
  }

  txs.forEach(tx => {
     const txDate = new Date(tx.created_at);
     const m = txDate.getMonth();
     const y = txDate.getFullYear();
     const key = `${y}-${m}`;
     const montant = parseFloat(tx.montant);
     
     if (m === currentMonth && y === currentYear) {
         if (montant > 0 && tx.type !== 'virement_emis') revenus += montant;
         else depenses += Math.abs(montant);
         
         if (montant < 0 || tx.type === 'virement_emis') {
             const cat = tx.categorie || 'Divers';
             categoriesDepenses[cat] = (categoriesDepenses[cat] || 0) + Math.abs(montant);
         }
     } else if (m === prevMonth && y === prevYear) {
         if (montant > 0 && tx.type !== 'virement_emis') revenusPrev += montant;
         else depensesPrev += Math.abs(montant);
     }
     
     if (monthlyDepenses[key] !== undefined) {
         if (montant < 0 || tx.type === 'virement_emis') {
             monthlyDepenses[key] += Math.abs(montant);
         }
     }
  });

  // Dynamic Epargne logic
  let totalEpargne = 0;
  let currentYearEpargne = 0;
  let epargneCurrentMonth = 0;
  
  txs.forEach(tx => {
     if (tx.categorie === 'Epargne' || (tx.description && tx.description.toLowerCase().includes('épargne'))) {
         let amt = Math.abs(parseFloat(tx.montant));
         if (tx.type === 'virement_emis' || parseFloat(tx.montant) < 0) {
             totalEpargne += amt;
             const txDate = new Date(tx.created_at);
             if (txDate.getFullYear() === currentYear) {
                 currentYearEpargne += amt;
             }
             if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                 epargneCurrentMonth += amt;
             }
         }
     }
  });

  const budgetTotal = userBudgets.reduce((sum, b) => sum + parseFloat(b.limite), 0);
  const reste = Math.max(0, budgetTotal - depenses);
  const epargneObjMensuel = 400; 
  const epargneObjAnnuel = epargneObjMensuel * 12;
  const epargnePct = Math.min(100, Math.round((epargneCurrentMonth/epargneObjMensuel)*100));

  let revDiff = 0;
  if (revenusPrev > 0) revDiff = Math.round(((revenus - revenusPrev) / revenusPrev) * 100);
  let revClass = revDiff >= 0 ? 'positive' : 'negative';
  let revSign = revDiff > 0 ? '+' : '';

  let depDiff = 0;
  if (depensesPrev > 0) depDiff = Math.round(((depenses - depensesPrev) / depensesPrev) * 100);
  let depClass = depDiff > 0 ? 'negative' : 'positive';
  let depSign = depDiff > 0 ? '+' : '';

  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  let chartMax = Math.max(...Object.values(monthlyDepenses));
  if(chartMax === 0) chartMax = 1;
  let evolDesktopHtml = '';
  let evolMobileHtml = '';
  Object.keys(monthlyDepenses).forEach((key, idx) => {
      let [y, mStr] = key.split('-');
      let m = parseInt(mStr);
      let val = monthlyDepenses[key];
      let pct = (val / chartMax) * 100;
      let isActive = (idx === 5) ? 'active' : '';
      evolDesktopHtml += `
          <div class="bdg-bar-col ${isActive}">
             <div class="bdg-bar-val">${val.toFixed(0)}€</div>
             <div class="bdg-bar-track"><div class="bdg-bar-fill" style="height:${pct}%;"></div></div>
             <div class="bdg-bar-lbl">${monthNames[m]}</div>
          </div>
      `;
      evolMobileHtml += `
          <div class="bdg-bar-col ${isActive}">
             <div class="bdg-bar-track" style="height:50px;"><div class="bdg-bar-fill" style="height:${pct}%;"></div></div>
             <div class="bdg-bar-lbl" style="font-size:0.65rem;">${monthNames[m]}</div>
          </div>
      `;
  });

  const icons = { 'Logement': 'ti-home', 'Courses': 'ti-shopping-cart', 'Transports': 'ti-car', 'Abonnements': 'ti-refresh', 'Loisirs': 'ti-ticket', 'Santé': 'ti-heart', 'Restaurants': 'ti-cutlery', 'Divers': 'ti-wallet' };
  const chartColors = ['#DC2626', '#F59E0B', '#2563EB', '#10B981', '#94A3B8', '#8B5CF6', '#EC4899'];
  
  let envHtml = '';
  let envHtmlDesktop = '';
  let alertsHtmlDesktop = '';
  
  // Array for donut chart
  let chartData = [];
  let otherSpent = 0;
  let usedCategories = new Set(userBudgets.map(b => b.categorie));
  usedCategories.add('Epargne');
  
  Object.keys(categoriesDepenses).forEach(cat => {
      if (!usedCategories.has(cat)) {
          otherSpent += categoriesDepenses[cat];
      }
  });

  if(userBudgets.length === 0) {
    if(container) container.innerHTML = '<p style="color:#64748B;">Aucun budget mensuel défini.</p><br><button onclick="openModal(\'modal-budgets\')" class="nb-btn-primary">Créer mon premier budget</button>';
    if(containerMobile) containerMobile.innerHTML = '<p style="color:var(--text-muted); font-size:12px;">Aucun budget mensuel défini.</p>';
  }

  userBudgets.forEach((b, idx) => {
     const spent = categoriesDepenses[b.categorie] || 0;
     const limit = parseFloat(b.limite);
     const pct = Math.min(100, Math.round((spent / limit) * 100));
     let color = 'var(--primary)';
     if (pct >= 100) color = 'var(--danger)';
     else if (pct >= 80) color = 'var(--warning)';
     else color = 'var(--success)';
     
     chartData.push({ category: b.categorie, amount: spent, color: spent > 0 ? chartColors[idx % chartColors.length] : '#E2E8F0' });
     
     const icon = icons[b.categorie] || 'ti-tag';
     
     const itemHtml = `
        <div class="bdg-env-item">
           <div class="bdg-env-icon" style="color:var(--text-main); background:var(--bg-body);"><i class="ti ${icon}"></i></div>
           <div class="bdg-env-details">
              <div class="bdg-env-top">
                 <span class="bdg-env-name">${b.categorie}</span>
                 <span class="bdg-env-amounts">${spent.toFixed(0)} / ${limit.toFixed(0)} €</span>
                 <span class="bdg-env-percent" style="color:${pct >= 100 ? 'var(--danger)' : (pct >= 80 ? 'var(--warning)' : 'inherit')}">${pct >= 100 ? 'Atteint' : pct + '%'}</span>
              </div>
              <div class="bdg-progress-bg"><div class="bdg-progress-fill" style="width:${pct}%; background:${color};"></div></div>
           </div>
        </div>
     `;
     envHtml += itemHtml;
     envHtmlDesktop += itemHtml;
     
     // Generate alerts
     if (pct >= 100) {
        alertsHtmlDesktop += `
           <div class="bdg-alert-item">
              <div class="bdg-alert-icon" style="color:var(--danger); background:#FEF2F2;"><i class="ti ti-alert-triangle"></i></div>
              <div class="bdg-alert-text">
                 <strong style="color:var(--danger);">${b.categorie} — Plafond dépassé</strong>
                 <span>${spent.toFixed(0)} € / ${limit.toFixed(0)} € consommés</span>
              </div>
           </div>
        `;
     } else if (pct >= 80) {
        alertsHtmlDesktop += `
           <div class="bdg-alert-item">
              <div class="bdg-alert-icon" style="color:var(--warning); background:#FFFBEB;"><i class="ti ti-clock"></i></div>
              <div class="bdg-alert-text">
                 <strong style="color:var(--warning);">${b.categorie} — Bientôt atteint (${pct}%)</strong>
                 <span>Il reste ${(limit - spent).toFixed(0)} €</span>
              </div>
           </div>
        `;
     }
  });

  if (otherSpent > 0) {
      chartData.push({ category: 'Autre', amount: otherSpent, color: '#94A3B8' });
  }

  if (userBudgets.length === 0) {
     envHtml = '<div style="text-align:center; padding: 20px; color:var(--text-muted);">Aucune enveloppe définie.</div>';
     envHtmlDesktop = envHtml;
  }
  
  if (alertsHtmlDesktop === '') {
      alertsHtmlDesktop = '<div style="padding:16px; color:var(--text-muted); text-align:center;">Aucune alerte ce mois-ci.</div>';
  }

  // --- Generate Donut Chart ---
  let donutSvg = '';
  let donutLegend = '';
  const totalRealSpent = chartData.reduce((sum, d) => sum + d.amount, 0);

  if (chartData.length > 0) {
     let currentOffset = 25; 
     let drawTotal = totalRealSpent === 0 ? chartData.length : totalRealSpent;
     
     donutSvg = '<svg viewBox="0 0 36 36" class="bdg-donut">';
     chartData.forEach(d => {
         let drawAmt = totalRealSpent === 0 ? 1 : (d.amount === 0 ? (drawTotal * 0.01) : d.amount);
         let drawTotalWithMin = totalRealSpent === 0 ? chartData.length : (drawTotal + (chartData.filter(x => x.amount===0).length * (drawTotal * 0.01)));
         const percentage = (drawAmt / drawTotalWithMin) * 100;
         
         const spacing = 0.5;
         const visiblePct = Math.max(0, percentage - spacing);
         const dashArray = `${visiblePct} ${100 - visiblePct}`;
         
         donutSvg += `<circle class="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="${d.color}" stroke-width="4" stroke-dasharray="${dashArray}" stroke-dashoffset="${currentOffset}"></circle>`;
         currentOffset -= percentage;
         
         donutLegend += `<div class="leg-item"><span class="dot" style="background:${d.color};"></span>${d.category}</div>`;
     });
     donutSvg += '</svg>';
  } else {
     donutSvg = '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#F1F5F9; border-radius:50%;"><i class="ti ti-wallet" style="color:#94A3B8; font-size:24px;"></i></div>';
     donutLegend = '<div style="color:var(--text-muted); font-size:12px;">Aucune dépense.</div>';
  }

  // --- Recent Txs ---
  const filteredDépenses = txs.filter(tx => parseFloat(tx.montant) < 0 || tx.type === 'virement_emis').slice(0, 4);
  let recentTxsHtml = filteredDépenses.map(tx => {
      let libelle = tx.description || 'Transaction';
      if(tx.type === 'virement_emis') libelle = 'Virement émis - ' + (tx.destinataire || '');
      const date = new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      
      return `
        <div class="bdg-tx-item">
           <div class="bdg-tx-icon"><i class="ti ti-shopping-bag"></i></div>
           <div class="bdg-tx-info">
              <strong>${libelle}</strong><span>${tx.categorie || 'Divers'} - ${date}</span>
           </div>
           <div class="bdg-tx-amt" style="color: inherit">${parseFloat(tx.montant).toFixed(2).replace('.',',')} €</div>
        </div>
      `;
  }).join('');

  if (filteredDépenses.length === 0) {
      recentTxsHtml = '<div style="text-align:center; padding: 20px; color:var(--text-muted);">Aucune dépense récente.</div>';
  }

  const monthStr = targetDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const capitalizedMonthStr = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
  
  /* --- UPDATE DESKTOP DOM --- */
  const desktopMonthLabel = document.getElementById('bdg-month-selector-text');
  if (desktopMonthLabel) desktopMonthLabel.textContent = capitalizedMonthStr;
  
  const desktopRepartMonth = document.getElementById('bdg-repartition-month');
  if (desktopRepartMonth) desktopRepartMonth.textContent = capitalizedMonthStr;

  const desktopMetrics = document.getElementById('bdg-metrics-desktop');
  if (desktopMetrics) {
      desktopMetrics.innerHTML = `
        <div class="bdg-metric-card">
          <div class="bdg-metric-title">REVENUS MOIS</div>
          <div class="bdg-metric-val">${revenus.toFixed(0)} €</div>
          <div class="bdg-metric-sub ${revClass}">${revSign}${revDiff}% vs préc.</div>
        </div>
        <div class="bdg-metric-card">
          <div class="bdg-metric-title">DÉPENSES MOIS</div>
          <div class="bdg-metric-val">${depenses.toFixed(0)} €</div>
          <div class="bdg-metric-sub ${depClass}">${depSign}${depDiff}% vs préc.</div>
        </div>
        <div class="bdg-metric-card">
          <div class="bdg-metric-title">ÉPARGNE DU MOIS</div>
          <div class="bdg-metric-val">${epargneCurrentMonth.toFixed(0)} €</div>
          <div class="bdg-metric-sub">Obj. ${epargneObjMensuel} € - ${epargnePct}%</div>
        </div>
        <div class="bdg-metric-card">
          <div class="bdg-metric-title">RESTE À DÉPENSER</div>
          <div class="bdg-metric-val">${reste.toFixed(0)} €</div>
          <div class="bdg-metric-sub">Budget total: ${budgetTotal.toFixed(0)} €</div>
        </div>
      `;
  }
  
  const desktopEnvList = document.getElementById('bdg-env-list-desktop');
  if (desktopEnvList) desktopEnvList.innerHTML = envHtmlDesktop;
  
  const desktopChart = document.getElementById('bdg-repartition-chart');
  if (desktopChart) {
      desktopChart.innerHTML = donutSvg + `
      <div class="bdg-donut-inner">
         <div class="val">${depenses.toFixed(0)}€</div>
         <div class="lbl">total</div>
      </div>`;
  }
  
  const desktopLegend = document.getElementById('bdg-repartition-legend');
  if (desktopLegend) desktopLegend.innerHTML = donutLegend;
  
  const desktopAlerts = document.getElementById('bdg-alerts-desktop');
  if (desktopAlerts) desktopAlerts.innerHTML = alertsHtmlDesktop;
  
  const desktopRecentTx = document.getElementById('bdg-recent-tx-desktop');
  if (desktopRecentTx) desktopRecentTx.innerHTML = recentTxsHtml;
  const desktopEvol = document.getElementById('bdg-evolution-desktop');
  if (desktopEvol) desktopEvol.innerHTML = evolDesktopHtml;
  
  const desktopEpargne = document.getElementById('bdg-epargne-desktop');
  if (desktopEpargne) {
      desktopEpargne.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:8px;">
           <div style="font-size:13px; color:var(--text-muted);">${epargneCurrentMonth.toFixed(0)} / ${epargneObjMensuel} € ce mois</div>
           <div style="font-size:14px; font-weight:700;">${epargnePct}%</div>
        </div>
        <div class="bdg-progress-bg" style="height:8px; margin-bottom:8px;"><div class="bdg-progress-fill" style="width:${epargnePct}%; background:var(--success);"></div></div>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); margin-bottom:20px;">
           <span>Il reste ${(epargneObjMensuel - epargneCurrentMonth).toFixed(0)} €<br>à épargner</span>
           <span style="text-align:right;">Objectif<br>annuel: ${epargneObjAnnuel} €</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border); padding-top:16px;">
           <div>
              <div style="font-size:16px; font-weight:700; margin-bottom:2px;">${currentYearEpargne} €</div>
              <div style="font-size:11px; color:var(--text-muted);">Épargné en ${currentYear}</div>
           </div>
           <div style="text-align:right;">
              <div style="font-size:16px; font-weight:700; margin-bottom:2px;">${epargneObjAnnuel - currentYearEpargne} €</div>
              <div style="font-size:11px; color:var(--text-muted);">Restant à atteindre</div>
           </div>
        </div>
      `;
  }

  /* --- UPDATE MOBILE DOM --- */
  if(containerMobile) {
    containerMobile.innerHTML = `
      <div class="m-bdg-header">
        <div>
          <div class="m-bdg-title">Budget</div>
          <div class="m-bdg-subtitle">Suivez vos dépenses</div>
        </div>
        <div class="m-bdg-month">
          <button onclick="changeBudgetMonth(-1)"><i class="ti ti-chevron-left"></i></button>
          <span>${capitalizedMonthStr}</span>
          <button onclick="changeBudgetMonth(1)"><i class="ti ti-chevron-right"></i></button>
        </div>
      </div>

      <div class="m-bdg-grid-2">
        <div class="m-bdg-metric">
          <div class="m-bdg-metric-title">REVENUS MOIS</div>
          <div class="m-bdg-metric-val">${revenus.toFixed(0)} €</div>
          <div class="m-bdg-metric-sub ${revClass === 'positive' ? 'pos' : 'neg'}">${revSign}${revDiff}% vs préc.</div>
        </div>
        <div class="m-bdg-metric">
          <div class="m-bdg-metric-title">DÉPENSES MOIS</div>
          <div class="m-bdg-metric-val">${depenses.toFixed(0)} €</div>
          <div class="m-bdg-metric-sub ${depClass === 'negative' ? 'neg' : 'pos'}">${depSign}${depDiff}% vs préc.</div>
        </div>
        <div class="m-bdg-metric">
          <div class="m-bdg-metric-title">ÉPARGNE DU MOIS</div>
          <div class="m-bdg-metric-val">${epargneCurrentMonth.toFixed(0)} €</div>
          <div class="m-bdg-metric-sub">Obj. ${epargneObjMensuel} € - ${epargnePct}%</div>
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
                ${donutSvg}
                <div class="bdg-donut-inner">
                    <div class="val" style="font-size:1rem;">${depenses.toFixed(0)}€</div>
                    <div class="lbl" style="font-size:0.65rem;">total</div>
                </div>
              </div>
              <div class="bdg-legend" style="flex:1;">
                ${donutLegend}
              </div>
          </div>
      </div>

      <div class="nb-card" style="margin-bottom: 24px; padding: 16px;">
          <div class="bdg-card-header" style="margin-bottom:12px;">
            <h3 style="margin:0; font-size:1.1rem;">Alertes budget</h3>
            <a href="#" onclick="openModal('modal-budgets')" style="font-size:0.8rem; color:var(--primary); font-weight:600; text-decoration:none;">Configurer</a>
          </div>
          <div class="bdg-alerts">
            ${alertsHtmlDesktop}
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
            <a href="#" onclick="openModal('modal-budgets')" style="font-size:0.8rem; color:var(--primary); font-weight:600; text-decoration:none;">Modifier</a>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:8px;">
            <div style="font-size:0.8rem; color:var(--text-muted);">${epargneCurrentMonth.toFixed(0)} / ${epargneObjMensuel} € ce mois</div>
            <div style="font-size:0.85rem; font-weight:700;">${epargnePct}%</div>
          </div>
          <div class="bdg-progress-bg" style="height:8px; margin-bottom:8px;"><div class="bdg-progress-fill" style="width:${epargnePct}%; background:var(--success);"></div></div>
          
          <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border); padding-top:12px; margin-top:16px;">
            <div>
                <div style="font-size:1.1rem; font-weight:700; margin-bottom:2px;">${currentYearEpargne} €</div>
                <div style="font-size:0.7rem; color:var(--text-muted);">Épargné en ${currentYear}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.1rem; font-weight:700; margin-bottom:2px;">${epargneObjAnnuel - currentYearEpargne} €</div>
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
              ${evolMobileHtml}
          </div>
      </div>

      <div class="nb-card" style="padding: 16px;">
          <div class="bdg-card-header" style="margin-bottom:12px;">
            <h3 style="margin:0; font-size:1.1rem;">Dernières dépenses</h3>
            <a href="#" onclick="showView('view-virements')" style="font-size:0.8rem; color:var(--primary); font-weight:600; text-decoration:none;">Voir tout &rarr;</a>
          </div>
          <div class="bdg-recent-tx">
            ${recentTxsHtml}
          </div>
      </div>
    `;
  }
}
