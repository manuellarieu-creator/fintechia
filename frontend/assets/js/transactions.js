async function loadTransactions() {
  const containerMobile = document.getElementById('tx-tbody-mobile');
  const containerDesktop = document.getElementById('tx-tbody-desktop');
  
  if (!containerMobile && !containerDesktop) return;

  try {
    const txs = await apiCall('/transactions?limit=10');
    
    if (txs.length === 0) {
      if(containerMobile) containerMobile.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:15px;">Aucune transaction récente.</td></tr>';
      if(containerDesktop) containerDesktop.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">Aucune transaction récente.</td></tr>';
      return;
    }

    // Lignes Mobile
    const mobileRows = txs.map(tx => {
      const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis';
      const typeLabel = isCredit ? 'Crédit' : 'Débit';
      const badgeClass = isCredit ? 'badge-credit' : 'badge-debit';
      const amountClass = isCredit ? 'amount-pos' : 'amount-neg';
      const sign = isCredit ? '+' : '';
      const date = new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const soldeDisplay = tx.solde_apres ? `€${parseFloat(tx.solde_apres).toFixed(2)}` : '-';

      return `
        <tr class="tx-row" data-type="${isCredit ? 'credit' : 'debit'}">
          <td>${date}</td>
          <td><span class="badge ${badgeClass}">${typeLabel}</span></td>
          <td class="${amountClass}">${sign}€${Math.abs(tx.montant).toFixed(2)}</td>
          <td>${soldeDisplay}</td>
        </tr>
      `;
    }).join('');

    // Lignes Desktop (Format NovaBanque)
    const desktopRows = txs.map(tx => {
      const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis';
      const typeLabel = isCredit ? 'Crédit' : 'Débit';
      const catClass = isCredit ? 'badge-green' : 'badge-grey';
      const icon = isCredit ? '↙' : '📤';
      const iconClass = isCredit ? 'icon-green' : 'icon-grey';
      const amountClass = isCredit ? 'text-green' : 'text-black';
      const sign = isCredit ? '+' : '-';
      const date = new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      
      let libelle = tx.description || 'Transaction';
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

  } catch (err) {
    console.error('Erreur chargement transactions:', err);
  }
}
