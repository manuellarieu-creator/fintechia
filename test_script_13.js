
    function toggleMobileSidebar() {
      const sidebar = document.querySelector('.mobile-sidebar-menu');
      const overlay = document.querySelector('.mobile-sidebar-overlay');
      if (sidebar && overlay) {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
      }
    }
    
    function updateMobileNav(clickedEl) {
      document.querySelectorAll('.mobile-nav-item, .nb-nav a').forEach(el => el.classList.remove('active'));
      if (clickedEl) clickedEl.classList.add('active');
    }
    
    function openDesktopViewMobile(viewId) {
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
    }
  