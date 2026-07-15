const fs = require('fs');
let html = fs.readFileSync('frontend/pages/app.html', 'utf8');

// 1. Replace usages
html = html.replace(/showMobileView\('m-view-virements'\)/g, "openDesktopViewMobile('view-virements')");

// 2. Wrap table in view-virements and remove desktop-only
const startVirements = html.indexOf('<div id="view-virements"');
const endVirements = html.indexOf('<!-- VUE CARTES -->', startVirements);

if (startVirements !== -1 && endVirements !== -1) {
    let virementsHtml = html.substring(startVirements, endVirements);
    
    // Wrap the table
    virementsHtml = virementsHtml.replace(
        /<table class="nb-tx-table">[\s\S]*?<\/table>/, 
        match => `<div style="overflow-x: auto; max-width: 100vw;">\n                ${match}\n              </div>`
    );
    
    // Remove desktop-only class
    virementsHtml = virementsHtml.replace(/class="btn-outline desktop-only"/g, 'class="btn-outline"');
    
    html = html.substring(0, startVirements) + virementsHtml + html.substring(endVirements);
}

// 3. Add openDesktopViewMobile correctly by replacing openSettingsMobile (which is already there in HEAD~2)
// In HEAD~2, the function was openSettingsMobile().
const startSettingsFunc = html.indexOf("function openSettingsMobile() {");
const endSettingsFunc = html.indexOf("           settingsView.insertBefore(backBtn, settingsView.firstChild);\n        }\n      }", startSettingsFunc);

if (startSettingsFunc !== -1 && endSettingsFunc !== -1) {
    const fullSettingsFunc = html.substring(startSettingsFunc, endSettingsFunc + 87);
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
      
    html = html.replace(fullSettingsFunc, newFuncs);
}

// Also update the sidebar links that I added previously for Virements
html = html.replace(/<a href="#" onclick="updateMobileNav\(this\); showMobileView\('m-view-virements'\); toggleMobileSidebar\(\)">/g, `<a href="#" onclick="updateMobileNav(this); openDesktopViewMobile('view-virements'); toggleMobileSidebar()">`);

fs.writeFileSync('frontend/pages/app.html', html);
console.log("Safe patch done");
