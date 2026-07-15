const fs = require('fs');
let html = fs.readFileSync('frontend/pages/app.html', 'utf8');

// 1. Remove m-view-virements
const startIdx = html.indexOf('<div id="m-view-virements"');
if (startIdx !== -1) {
    const nextViewIdx = html.indexOf('<!-- VUE VIREMENTS -->');
    if (nextViewIdx !== -1) {
        html = html.substring(0, startIdx) + html.substring(nextViewIdx);
    }
}

// 2. Replace showMobileView('m-view-virements') with openDesktopViewMobile('view-virements')
html = html.replace(/showMobileView\('m-view-virements'\)/g, "openDesktopViewMobile('view-virements')");

// 3. Replace openSettingsMobile() with openDesktopViewMobile('view-settings')
html = html.replace(/openSettingsMobile\(\)/g, "openDesktopViewMobile('view-settings')");

// 4. Wrap table in view-virements with overflow-x: auto
const tableRegex = /<table class="nb-tx-table">[\s\S]*?<\/table>/g;
// Find the table inside view-virements (it's the first nb-tx-table in the desktop layout, wait, no, the first is in view-dashboard? No, let's just replace the specific one in view-virements)
const viewVirementsStart = html.indexOf('<div id="view-virements"');
const viewVirementsEnd = html.indexOf('<!-- VUE CARTES -->', viewVirementsStart);
let viewVirementsHtml = html.substring(viewVirementsStart, viewVirementsEnd);

viewVirementsHtml = viewVirementsHtml.replace(/<table class="nb-tx-table">[\s\S]*?<\/table>/, match => {
    return `<div style="overflow-x: auto; max-width: 100vw;">\n                ${match}\n              </div>`;
});

// Remove desktop-only from Nouveau virement buttons in view-virements
viewVirementsHtml = viewVirementsHtml.replace(/class="btn-outline desktop-only"/g, 'class="btn-outline"');
html = html.substring(0, viewVirementsStart) + viewVirementsHtml + html.substring(viewVirementsEnd);

// 5. Replace openSettingsMobile implementation with openDesktopViewMobile
const settingsFuncStr = `      function openSettingsMobile() {
        // Hide mobile layout, show desktop layout (which contains settings)
        document.querySelector('.mobile-layout').style.display = 'none';
        const desktopLayout = document.querySelector('.desktop-layout');
        desktopLayout.style.display = 'flex';
        desktopLayout.style.setProperty('display', 'flex', 'important');
        
        // Hide the desktop sidebar since we are on mobile
        const desktopSidebar = document.querySelector('.desktop-layout .nb-sidebar:not(.mobile-sidebar-menu)');
        if (desktopSidebar) desktopSidebar.style.display = 'none';
        
        // Show settings view
        document.querySelectorAll('.nb-nav a').forEach(a=>a.classList.remove('active'));
        showView('view-settings');
        
        // Add a back button to the topbar of settings view for mobile
        const settingsView = document.getElementById('view-settings');
        if (settingsView && !document.getElementById('mobile-back-settings')) {
           const backBtn = document.createElement('div');
           backBtn.id = 'mobile-back-settings';
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
           };
           settingsView.insertBefore(backBtn, settingsView.firstChild);
        }
      }`;

const desktopFuncStr = `      function openDesktopViewMobile(viewId) {
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
           };
           viewEl.insertBefore(backBtn, viewEl.firstChild);
        }
      }`;

html = html.replace(settingsFuncStr, desktopFuncStr);

fs.writeFileSync('frontend/pages/app.html', html);
console.log("Done");
