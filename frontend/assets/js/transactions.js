async function loadTransactions() {
  const container = document.getElementById('tx-container');
  if (!container) return;

  try {
    const txs = await apiCall('/transactions?limit=10');
    
    if (txs.length === 0) {
      container.innerHTML = '<p style="font-size:13px;color:var(--text3);text-align:center;padding:1rem;">Aucune transaction récente.</p>';
      return;
    }

    container.innerHTML = txs.map(tx => {
      const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis';
      const sign = isCredit ? '+' : '-';
      const cssClass = isCredit ? 'credit' : 'debit';
      const date = new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

      return `
        <div class="tx-item">
          <div class="tx-info">
            <h4>${tx.libelle}</h4>
            <p>${date} • ${tx.statut}</p>
          </div>
          <div class="tx-amount ${cssClass}">
            ${sign}€ ${Math.abs(tx.montant).toFixed(2)}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Erreur chargement transactions:', err);
  }
}
