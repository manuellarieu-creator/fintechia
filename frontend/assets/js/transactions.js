async function loadTransactions() {
  const container = document.getElementById('tx-container');
  if (!container) return;

  try {
    const txs = await apiCall('/transactions?limit=10');
    
    if (txs.length === 0) {
      container.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:15px;">Aucune transaction récente.</td></tr>';
      return;
    }

    container.innerHTML = txs.map(tx => {
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
  } catch (err) {
    console.error('Erreur chargement transactions:', err);
  }
}
