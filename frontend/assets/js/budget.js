async function loadBudgetsPage() {
  const container = document.getElementById('budget-page-list');
  if(!container) return;
  
  if(userBudgets.length === 0) {
    container.innerHTML = '<p style="color:#64748B;">Aucun budget mensuel défini.</p><br><button onclick="openModal(\'modal-budgets\')" class="nb-btn-primary">Créer mon premier budget</button>';
    return;
  }
  
  // Reuse the dashboard's rendered content for consistency
  const dashBudget = document.getElementById('budget-list-desktop');
  if(dashBudget) {
    container.innerHTML = dashBudget.innerHTML + '<br><br><button onclick="openModal(\'modal-budgets\')" class="nb-btn-primary">Gérer mes enveloppes</button>';
  }
}
