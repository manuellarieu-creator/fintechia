const fs = require('fs');
const path = 'c:/Users/ariol/.gemini/fintechia/frontend/pages/app.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Inject Styles
const styleToAdd = `
  <style>
    /* Mobile Navbar Styles */
    .mobile-bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 65px;
      background: white;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
      z-index: 1000;
      justify-content: space-around;
      align-items: center;
      padding-bottom: env(safe-area-inset-bottom, 10px);
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
    }
    
    @media (max-width: 900px) {
      .mobile-bottom-nav {
        display: flex;
      }
      
      .nb-sidebar {
        position: fixed;
        left: -100%;
        top: 0;
        bottom: 0;
        z-index: 2000;
        transition: left 0.3s ease;
      }
      
      .nb-sidebar.mobile-open {
        left: 0;
        box-shadow: 4px 0 24px rgba(0,0,0,0.1);
      }
      
      .mobile-sidebar-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 1999;
        backdrop-filter: blur(2px);
      }
      
      .mobile-sidebar-overlay.active {
        display: block;
      }
      
      .scroll-area {
        padding-bottom: 80px !important;
      }
    }
    
    .mobile-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted, #64748B);
      text-decoration: none;
      font-size: 11px;
      font-weight: 600;
      gap: 4px;
      flex: 1;
      height: 100%;
      transition: color 0.2s;
    }
    
    .mobile-nav-item i {
      font-size: 22px;
    }
    
    .mobile-nav-item.active {
      color: var(--primary, #4F46E5);
    }
    
    .mobile-nav-item.active i {
      transform: translateY(-2px);
    }
    
    .mobile-hamburger {
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--bg-body, #F8FAFC);
      color: var(--text-main, #1E293B);
      transition: all 0.2s;
    }
    
    .mobile-hamburger:active {
      background: #E2E8F0;
    }
  </style>
`;

if (!content.includes('.mobile-bottom-nav {')) {
  content = content.replace('</head>', styleToAdd + '\n</head>');
}

// 2. Inject Mobile Hamburger
const topbarMatch = /<div class="topbar">\s*<div>\s*<div class="topbar-greeting">/g;
const topbarReplacement = `<div class="topbar">
        <div style="display:flex; align-items:center;">
          <div class="mobile-hamburger" onclick="toggleMobileSidebar()">
            <i class="ti ti-menu-2"></i>
          </div>
          <div>
            <div class="topbar-greeting">`;

if (content.includes('<div class="topbar-greeting">') && !content.includes('toggleMobileSidebar()')) {
  content = content.replace(topbarMatch, topbarReplacement);
}

// 3. Inject Bottom Navbar & Overlay
const bottomNavHtml = `
  <!-- Mobile Bottom Nav -->
  <nav class="mobile-bottom-nav">
    <a href="#" class="mobile-nav-item active" onclick="showMobileView('m-view-dashboard'); updateMobileNav(this)">
      <i class="ti ti-home"></i>
      <span>Accueil</span>
    </a>
    <a href="#" class="mobile-nav-item" onclick="showMobileView('m-view-releves'); updateMobileNav(this)">
      <i class="ti ti-bell"></i>
      <span>Notifs</span>
    </a>
    <a href="#" class="mobile-nav-item" onclick="document.querySelectorAll('.nb-nav a').forEach(a=>a.classList.remove('active')); showView('view-settings'); updateMobileNav(this)">
      <i class="ti ti-settings"></i>
      <span>Paramètres</span>
    </a>
  </nav>
  
  <div class="mobile-sidebar-overlay" onclick="toggleMobileSidebar()"></div>
  
  <script>
    function toggleMobileSidebar() {
      const sidebar = document.querySelector('.nb-sidebar');
      const overlay = document.querySelector('.mobile-sidebar-overlay');
      if (sidebar && overlay) {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
      }
    }
    
    function updateMobileNav(clickedEl) {
      document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
      if (clickedEl) clickedEl.classList.add('active');
    }
  </script>
`;

if (!content.includes('mobile-bottom-nav')) {
  content = content.replace('</body>', bottomNavHtml + '\n</body>');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Mobile nav and hamburger menu successfully injected.');
