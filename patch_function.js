const fs = require('fs');
let html = fs.readFileSync('frontend/pages/app.html', 'utf8');

// Replace openSettingsMobile entirely with openDesktopViewMobile and the openSettingsMobile stub
const regex = /function openSettingsMobile\(\)\s*\{[\s\S]*?settingsView\.insertBefore\(backBtn,\s*settingsView\.firstChild\);\s*\}\s*\}/;

const newFuncs = `function openDesktopViewMobile(viewId) {
      document.querySelector('.mobile-layout').style.display = 'none';
      const desktopLayout = document.querySelector('.desktop-layout');
      desktopLayout.style.display = 'flex';
      desktopLayout.style.setProperty('display', 'flex', 'important');
      
      const desktopSidebar = document.querySelector('.desktop-layout .nb-sidebar:not(.mobile-sidebar-menu)');
      if (desktopSidebar) desktopSidebar.style.display = 'none';
      
      document.querySelectorAll('.nb-nav a').forEach(a=>a.classList.remove('active'));
      showView(viewId);
      
      const viewEl = document.getElementById(viewId);
      if (viewEl && !document.getElementById('mobile-back-' + viewId)) {
         const backBtn = document.createElement('div');
         backBtn.id = 'mobile-back-' + viewId;
         backBtn.innerHTML = '<i class="ti ti-arrow-left"></i> Retour';
         backBtn.style.padding = '16px';
         backBtn.style.cursor = 'pointer';
         backBtn.style.color = '#4F46E5';
         backBtn.style.fontWeight = '600';
         backBtn.onclick = function() {
            document.querySelector('.mobile-layout').style.display = '';
            document.querySelector('.desktop-layout').style.display = '';
            desktopLayout.style.removeProperty('display');
            if (desktopSidebar) desktopSidebar.style.display = '';
            if(viewId === 'view-virements') {
                document.querySelectorAll('.bottom-nav .nb-item').forEach(i=>i.classList.remove('active'));
            }
         };
         viewEl.insertBefore(backBtn, viewEl.firstChild);
      }
    }
    
    function openSettingsMobile() {
        openDesktopViewMobile('view-settings');
    }`;

if (regex.test(html)) {
    html = html.replace(regex, newFuncs);
    fs.writeFileSync('frontend/pages/app.html', html);
    console.log("Successfully replaced");
} else {
    console.log("Regex didn't match");
}
