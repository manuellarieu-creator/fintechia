
function switchSettingsTab(el, targetId) {
  // Update active styling on the horizontal menu
  const tabsMenu = el.closest('.settings-tabs-menu');
  if (tabsMenu) {
      tabsMenu.querySelectorAll('.tab-side').forEach(t => t.classList.remove('act'));
      el.classList.add('act');
  }
  
  // Hide all contents and show target
  const container = document.querySelector('.settings-content-area');
  if (container) {
      container.querySelectorAll('.settings-tab-content').forEach(content => {
          content.style.display = 'none';
          content.classList.remove('active');
      });
      const target = document.getElementById(targetId);
      if (target) {
          target.style.display = 'flex';
          target.classList.add('active');
      }
  }
}

function saveSettingsMock(msg) {
    alert(msg || 'Paramètres enregistrés avec succès');
}
