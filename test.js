
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
  

  <script src="../assets/js/notifications.js">
  <script src="../assets/js/i18n.js">
  <script src="../assets/js/chat-widget.js">

  <!-- GLOBAL CAMERA VIEW (Overlay plein écran) -->
  <div id="kyc-camera-view" style="display:none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000; z-index: 9999; flex-direction: column; align-items: center; justify-content: center;">
    <h3 style="color: white; margin-top: 20px; position: absolute; top: 20px;">Positionnez le document / votre visage</h3>
    <video id="kyc-video" style="width: 100%; max-width: 600px; height: auto; max-height: 80vh; background: #111; border-radius: 12px;" playsinline autoplay></video>
    
    <div style="position: absolute; bottom: 40px; display: flex; gap: 20px;">
      <button class="btn" style="background: white; color: black; border-radius: 30px; padding: 15px 30px; font-weight: bold;" onclick="closeCameraView()">Annuler</button>
      <button class="btn" style="background: #2563EB; color: white; border-radius: 30px; padding: 15px 40px; font-weight: bold;" onclick="captureImage()"><i class="ti ti-camera" style="margin-right:8px;"></i> Capturer</button>
    </div>
  </div>

</body>
</html>
