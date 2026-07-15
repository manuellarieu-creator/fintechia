const fs = require('fs');
let html = fs.readFileSync('frontend/pages/app.html', 'utf8');

// Use regex to replace the whole function openDesktopViewMobile
html = html.replace(/function openDesktopViewMobile\(viewId\) \{[\s\S]*?\}\s*\}/, `function openDesktopViewMobile(viewId) {
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
      }`);

fs.writeFileSync('frontend/pages/app.html', html);
console.log("Regex replace done");
