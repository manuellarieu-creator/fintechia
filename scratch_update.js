const fs = require('fs');
let code = fs.readFileSync('frontend/assets/js/budget.js', 'utf8');

const replacementBlock = `
  let revenus = 0;
  let depenses = 0;
  let revenusPrev = 0;
  let depensesPrev = 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 0) { prevMonth = 11; prevYear--; }
  
  const categoriesDepenses = {};
  
  let monthlyDepenses = {};
  for(let i=5; i>=0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) { m += 12; y--; }
      monthlyDepenses[y+'-'+m] = 0;
  }

  txs.forEach(tx => {
     const txDate = new Date(tx.created_at);
     const m = txDate.getMonth();
     const y = txDate.getFullYear();
     const key = y+'-'+m;
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

  const budgetTotal = userBudgets.reduce((sum, b) => sum + parseFloat(b.limite), 0) || 2880;
  const reste = Math.max(0, budgetTotal - depenses);
  const epargne = revenus - depenses > 0 ? (revenus - depenses) * 0.2 : 0; 
  const epargnePct = Math.min(100, Math.round((epargne/400)*100));

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
      evolDesktopHtml += \`<div class="bdg-bar-col \${isActive}"><div class="bdg-bar-val">\${val.toFixed(0)}€</div><div class="bdg-bar-track"><div class="bdg-bar-fill" style="height:\${pct}%;"></div></div><div class="bdg-bar-lbl">\${monthNames[m]}</div></div>\`;
      evolMobileHtml += \`<div class="bdg-bar-col \${isActive}"><div class="bdg-bar-track" style="height:50px;"><div class="bdg-bar-fill" style="height:\${pct}%;"></div></div><div class="bdg-bar-lbl" style="font-size:0.65rem;">\${monthNames[m]}</div></div>\`;
  });
`;

code = code.replace(/let revenus = 0;[\s\S]*?const epargnePct = Math\.min\(100, Math\.round\(\(epargne\/400\)\*100\)\);/, replacementBlock);

code = code.replace(/<div class="bdg-metric-sub positive">\+8% vs préc\.<\/div>/g, \`<div class="bdg-metric-sub \${revClass}">\${revSign}\${revDiff}% vs préc.</div>\`);
code = code.replace(/<div class="bdg-metric-sub negative">\+12% vs préc\.<\/div>/g, \`<div class="bdg-metric-sub \${depClass}">\${depSign}\${depDiff}% vs préc.</div>\`);
code = code.replace(/<div class="m-bdg-metric-sub pos">\+8% vs préc\.<\/div>/g, \`<div class="m-bdg-metric-sub \${revClass === 'positive' ? 'pos' : 'neg'}">\${revSign}\${revDiff}% vs préc.</div>\`);
code = code.replace(/<div class="m-bdg-metric-sub neg">\+12% vs préc\.<\/div>/g, \`<div class="m-bdg-metric-sub \${depClass === 'negative' ? 'neg' : 'pos'}">\${depSign}\${depDiff}% vs préc.</div>\`);

// Update Desktop Evolution Chart inject
code = code.replace(/const desktopEpargne = document\.getElementById\('bdg-epargne-desktop'\);/, \`const desktopEvol = document.getElementById('bdg-evolution-desktop');
  if(desktopEvol) desktopEvol.innerHTML = evolDesktopHtml;
  const desktopEpargne = document.getElementById('bdg-epargne-desktop');\`);

// Update Mobile Evolution Chart
code = code.replace(/<div class="bdg-bar-col"><div class="bdg-bar-track" style="height:50px;"><div class="bdg-bar-fill" style="height:40%;">[\s\S]*?Juin<\/div><\/div>/, '\${evolMobileHtml}');

fs.writeFileSync('frontend/assets/js/budget.js', code);
