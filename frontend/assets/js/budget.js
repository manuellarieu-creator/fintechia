async function loadBudgetsPage() {
  const container = document.getElementById('budget-page-list');
  const containerMobile = document.getElementById('budget-page-list-mobile');
  
  if(userBudgets.length === 0) {
    if(container) container.innerHTML = '<p style="color:#64748B;">Aucun budget mensuel défini.</p><br><button onclick="openModal(\'modal-budgets\')" class="nb-btn-primary">Créer mon premier budget</button>';
    if(containerMobile) containerMobile.innerHTML = '<p style="color:var(--text-muted); font-size:12px;">Aucun budget mensuel défini.</p>';
    return;
  }
  
  // Reuse the dashboard's rendered content for consistency
  const dashBudget = document.getElementById('budget-list-desktop');
  if(container && dashBudget) {
    container.innerHTML = dashBudget.innerHTML + '<br><br><button onclick="openModal(\'modal-budgets\')" class="nb-btn-primary">Gérer mes enveloppes</button>';
  }

  const dashBudgetMobile = document.getElementById('budget-list-mobile');
  if(containerMobile && dashBudgetMobile) {
    containerMobile.innerHTML = dashBudgetMobile.innerHTML;
  }
}
