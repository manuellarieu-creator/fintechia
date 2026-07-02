const fs = require('fs');
let code = fs.readFileSync('frontend/assets/js/budget.js', 'utf8');

// Replace mobile month buttons
code = code.replace(/<button><i class="ti ti-chevron-left"><\/i><\/button>\s*<span>\$\{capitalizedMonthStr\}<\/span>\s*<button><i class="ti ti-chevron-right"><\/i><\/button>/g, 
  '<button onclick="changeBudgetMonth(-1)"><i class="ti ti-chevron-left"></i></button>\\n          <span>${capitalizedMonthStr}</span>\\n          <button onclick="changeBudgetMonth(1)"><i class="ti ti-chevron-right"></i></button>');

// Replace mobile epargne and alertes 'Modifier'/'Configurer' buttons
code = code.replace(/<a href="#" style="font-size:0.8rem; color:var\(--primary\); font-weight:600; text-decoration:none;">Configurer<\/a>/g, 
  '<a href="#" onclick="openModal(\\'modal-budgets\\')" style="font-size:0.8rem; color:var(--primary); font-weight:600; text-decoration:none;">Configurer</a>');
code = code.replace(/<a href="#" style="font-size:0.8rem; color:var\(--primary\); font-weight:600; text-decoration:none;">Modifier<\/a>/g, 
  '<a href="#" onclick="openModal(\\'modal-budgets\\')" style="font-size:0.8rem; color:var(--primary); font-weight:600; text-decoration:none;">Modifier</a>');

// Dynamic Epargne logic
const epargneReplacement = `
  let totalEpargne = 0;
  let currentYearEpargne = 0;
  let epargneCurrentMonth = 0;
  
  txs.forEach(tx => {
     if (tx.categorie === 'Epargne' || (tx.libelle && tx.libelle.toLowerCase().includes('épargne'))) {
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

  const budgetTotal = userBudgets.reduce((sum, b) => sum + parseFloat(b.limite), 0) || 2880;
  const reste = Math.max(0, budgetTotal - depenses);
  const epargneObjMensuel = 400;
  const epargneObjAnnuel = epargneObjMensuel * 12;
  const epargnePct = Math.min(100, Math.round((epargneCurrentMonth/epargneObjMensuel)*100));
`;

code = code.replace(/const budgetTotal = userBudgets[\s\S]*?const epargnePct = Math\.min\(100, Math\.round\(\(epargne\/400\)\*100\)\);/, epargneReplacement);

// Donut logic
const donutReplacement = `
  let envHtml = '';
  let envHtmlDesktop = '';
  let alertsHtmlDesktop = '';
  
  let chartData = [];
  let otherSpent = 0;
  let usedCategories = new Set(userBudgets.map(b => b.categorie));
  usedCategories.add('Epargne'); // Exclude epargne from budget donut ? Yes
  Object.keys(categoriesDepenses).forEach(cat => {
      if (!usedCategories.has(cat)) {
          otherSpent += categoriesDepenses[cat];
      }
  });

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
     
     const itemHtml = \`
        <div class="bdg-env-item">
           <div class="bdg-env-icon" style="color:var(--text-main); background:var(--bg-body);"><i class="ti \${icon}"></i></div>
           <div class="bdg-env-details">
              <div class="bdg-env-top">
                 <span class="bdg-env-name">\${b.categorie}</span>
                 <span class="bdg-env-amounts">\${spent.toFixed(0)} / \${limit.toFixed(0)} €</span>
                 <span class="bdg-env-percent" style="color:\${pct >= 100 ? 'var(--danger)' : (pct >= 80 ? 'var(--warning)' : 'inherit')}">\${pct >= 100 ? 'Atteint' : pct + '%'}</span>
              </div>
              <div class="bdg-progress-bg"><div class="bdg-progress-fill" style="width:\${pct}%; background:\${color};"></div></div>
           </div>
        </div>
     \`;
     envHtml += itemHtml;
     envHtmlDesktop += itemHtml;
     
     if (pct >= 100) {
        alertsHtmlDesktop += \`
           <div class="bdg-alert-item">
              <div class="bdg-alert-icon" style="color:var(--danger); background:#FEF2F2;"><i class="ti ti-alert-triangle"></i></div>
              <div class="bdg-alert-text">
                 <strong style="color:var(--danger);">\${b.categorie} — Plafond dépassé</strong>
                 <span>\${spent.toFixed(0)} € / \${limit.toFixed(0)} € consommés</span>
              </div>
           </div>
        \`;
     } else if (pct >= 80) {
        alertsHtmlDesktop += \`
           <div class="bdg-alert-item">
              <div class="bdg-alert-icon" style="color:var(--warning); background:#FFFBEB;"><i class="ti ti-clock"></i></div>
              <div class="bdg-alert-text">
                 <strong style="color:var(--warning);">\${b.categorie} — Bientôt atteint (\${pct}%)</strong>
                 <span>Il reste \${(limit - spent).toFixed(0)} €</span>
              </div>
           </div>
        \`;
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
         const dashArray = \`\${percentage} \${100 - percentage}\`;
         const spacing = 0.5;
         const dashArraySpaced = \`\${Math.max(0, percentage - spacing)} \${100 - Math.max(0, percentage - spacing) + spacing}\`;
         donutSvg += \`<circle class="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="\${d.color}" stroke-width="4" stroke-dasharray="\${dashArraySpaced}" stroke-dashoffset="\${currentOffset}"></circle>\`;
         currentOffset -= percentage;
         
         donutLegend += \`<div class="leg-item"><span class="dot" style="background:\${d.color};"></span>\${d.category}</div>\`;
     });
     donutSvg += '</svg>';
  } else {
     donutSvg = '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#F1F5F9; border-radius:50%;"><i class="ti ti-wallet" style="color:#94A3B8; font-size:24px;"></i></div>';
     donutLegend = '<div style="color:var(--text-muted); font-size:12px;">Aucune dépense.</div>';
  }
`;

code = code.replace(/let envHtml = '';[\s\S]*?(?=\/\/ --- Recent Txs ---)/, donutReplacement + '\\n  ');

// Update UI Epargne vars
code = code.replace(/\$\{epargne\.toFixed\(0\)\}/g, '${epargneCurrentMonth.toFixed(0)}');
code = code.replace(/\(400 - epargne\)/g, '(epargneObjMensuel - epargneCurrentMonth)');
code = code.replace(/4 800 €/g, '${epargneObjAnnuel} €');
code = code.replace(/2 840 €/g, '${currentYearEpargne} €');
code = code.replace(/1 960 €/g, '${(epargneObjAnnuel - currentYearEpargne)} €');
code = code.replace(/400 € ce mois/g, '${epargneObjMensuel} € ce mois');

fs.writeFileSync('frontend/assets/js/budget.js', code);
