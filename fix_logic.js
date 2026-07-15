const fs = require('fs');
let html = fs.readFileSync('frontend/pages/app.html', 'utf8');

const brokenStart = "function openDesktopViewMobile(viewId) {";
const endStr = "           settingsView.insertBefore(backBtn, settingsView.firstChild);\n        }\n      }";
const startIdx = html.indexOf(brokenStart);
if (startIdx !== -1) {
    const endIdx = html.indexOf(endStr, startIdx);
    if (endIdx !== -1) {
        const fullBrokenFunc = html.substring(startIdx, endIdx + endStr.length);
        
        const correctFunc = `function openDesktopViewMobile(viewId) {
        // Hide mobile layout, show desktop layout
        document.querySelector('.mobile-layout').style.display = 'none';
        const desktopLayout = document.querySelector('.desktop-layout');
        desktopLayout.style.display = 'flex';
        desktopLayout.style.setProperty('display', 'flex', 'important');
        
        // Hide the desktop sidebar since we are on mobile
        const desktopSidebar = document.querySelector('.desktop-layout .nb-sidebar:not(.mobile-sidebar-menu)');
        if (desktopSidebar) desktopSidebar.style.display = 'none';
        
        // Show target view
        document.querySelectorAll('.nb-nav a').forEach(a=>a.classList.remove('active'));
        showView(viewId);
        
        // Add a back button to the topbar of target view for mobile
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
      }`;
      
        html = html.replace(fullBrokenFunc, correctFunc);
        fs.writeFileSync('frontend/pages/app.html', html);
        console.log("Successfully replaced function");
    } else {
        console.log("Could not find end of function");
    }
} else {
    console.log("Could not find start of function");
}
