const fs = require('fs');
const path = 'c:/Users/ariol/.gemini/fintechia/frontend/pages/app.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Change toggleMobileSidebar script
const scriptOld = `function toggleMobileSidebar() {
      const sidebar = document.querySelector('.nb-sidebar');`;
const scriptNew = `function toggleMobileSidebar() {
      const sidebar = document.querySelector('.mobile-sidebar-menu');`;

if (content.includes(scriptOld)) {
  content = content.replace(scriptOld, scriptNew);
}

// 2. Add Mobile Sidebar HTML before the overlay
const overlayHtml = `<div class="mobile-sidebar-overlay" onclick="toggleMobileSidebar()"></div>`;
const mobileSidebarHtml = `
  <!-- Mobile Sidebar Menu -->
  <aside class="nb-sidebar mobile-sidebar-menu" style="display:none;">
    <div class="nb-logo" style="padding: 24px;">
      <div class="nb-logo-icon">N</div>
      <span>NovaBanque</span>
    </div>
    <nav class="nb-nav">
      <a href="#" class="active" onclick="updateMobileNav(this); showMobileView('m-view-dashboard'); toggleMobileSidebar()"><span class="nb-icon">🏠</span> Accueil</a>
      <a href="#" onclick="updateMobileNav(this); showMobileView('m-view-virements'); toggleMobileSidebar()"><span class="nb-icon">💸</span> Virements</a>
      <a href="#" onclick="updateMobileNav(this); showMobileView('m-view-cartes'); toggleMobileSidebar()"><span class="nb-icon">💳</span> Cartes</a>
      <a href="#" onclick="updateMobileNav(this); showMobileView('m-view-budget'); toggleMobileSidebar()"><span class="nb-icon">📊</span> Budget</a>
      <a href="#" onclick="updateMobileNav(this); showMobileView('m-view-releves'); toggleMobileSidebar()"><span class="nb-icon">📄</span> Relevés</a>
    </nav>
  </aside>
  
  <style>
    @media (max-width: 900px) {
      .mobile-sidebar-menu {
        display: flex !important;
        flex-direction: column;
        background: white;
        width: 280px;
      }
    }
  </style>

  <div class="mobile-sidebar-overlay" onclick="toggleMobileSidebar()"></div>`;

if (content.includes(overlayHtml) && !content.includes('mobile-sidebar-menu')) {
  content = content.replace(overlayHtml, mobileSidebarHtml);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Mobile sidebar injected.');
