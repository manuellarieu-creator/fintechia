const fs = require('fs');
const path = 'c:/Users/ariol/.gemini/fintechia/frontend/pages/index.html';
let content = fs.readFileSync(path, 'utf8');

const headerMatch = /<div class="nb-header">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

// Build the new header. Logo | Demander un crédit | User Icon | Hamburger Menu
const newHeader = `<div class="nb-header">
    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:10px; cursor: pointer;" onclick="window.scrollTo({top:0, behavior:'smooth'})">
      <div style="width:30px;height:30px;border:1px solid #C99A3B;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;color:#C99A3B;">N</div>
      <span class="nb-serif" style="font-size:18px;font-weight:500;letter-spacing:.2px;">Fintechia</span>
    </div>
    
    <!-- Actions -->
    <div style="display:flex; align-items:center; gap:16px;">
      <button class="nb-btn" style="background:#C99A3B;color:#0F1B33;font-weight:600;padding:9px 18px;border-radius:6px;font-size:13px;font-family:inherit;" onclick="document.getElementById('nbCredit').scrollIntoView({behavior:'smooth'})">Demander un crédit</button>
      
      <div style="cursor:pointer; display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:50%; border:1px solid rgba(233,230,221,0.25); color:#E9E6DD; transition:background 0.2s;" onclick="window.location.href='app.html'" title="Espace Client" onmouseover="this.style.background='rgba(233,230,221,0.1)'" onmouseout="this.style.background='transparent'">
        <i class="ti ti-user" style="font-size:18px;"></i>
      </div>
      
      <div style="cursor:pointer; display:flex; align-items:center; justify-content:center; width:38px; height:38px; color:#E9E6DD;" onclick="document.querySelector('.nb-landing-sidebar').classList.add('open')">
        <i class="ti ti-menu-2" style="font-size:24px;"></i>
      </div>
    </div>
  </div>
  
  <!-- Landing Sidebar Overlay & Menu -->
  <div class="nb-landing-sidebar-overlay" onclick="document.querySelector('.nb-landing-sidebar').classList.remove('open')"></div>
  <aside class="nb-landing-sidebar">
    <div style="padding: 24px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(233,230,221,0.1);">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:30px;height:30px;border:1px solid #C99A3B;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;color:#C99A3B;">N</div>
        <span class="nb-serif" style="font-size:18px;font-weight:500;color:#E9E6DD;">Fintechia</span>
      </div>
      <i class="ti ti-x" style="font-size:24px; color:#B9B4A6; cursor:pointer;" onclick="document.querySelector('.nb-landing-sidebar').classList.remove('open')"></i>
    </div>
    <div style="display:flex; flex-direction:column; padding: 24px; gap: 24px; font-size:16px; color:#E9E6DD;">
      <span style="cursor:pointer;" onclick="document.querySelector('.nb-landing-sidebar').classList.remove('open'); document.getElementById('nbOffres').scrollIntoView({behavior:'smooth'})">Comptes</span>
      <span style="cursor:pointer;" onclick="document.querySelector('.nb-landing-sidebar').classList.remove('open'); document.getElementById('nbCredit').scrollIntoView({behavior:'smooth'})">Crédits</span>
      <span style="cursor:pointer;">Tarifs</span>
      <span style="cursor:pointer;">Sécurité</span>
      <div style="height:1px; background:rgba(233,230,221,0.1); margin: 8px 0;"></div>
      <button class="nb-btn" style="background:transparent;border:1px solid rgba(233,230,221,0.25);color:#E9E6DD;font-weight:600;padding:12px;border-radius:6px;width:100%;" onclick="window.location.href='app.html'">Se connecter</button>
      <button class="nb-btn" style="background:#C99A3B;color:#0F1B33;font-weight:600;padding:12px;border-radius:6px;width:100%;" onclick="window.location.href='app.html?action=register'">Ouvrir un compte</button>
    </div>
  </aside>
  
  <style>
    .nb-landing-sidebar {
      position: fixed;
      top: 0;
      right: -100%;
      width: 300px;
      height: 100vh;
      background: #0B1428;
      z-index: 3000;
      transition: right 0.3s ease;
      box-shadow: -4px 0 24px rgba(0,0,0,0.5);
    }
    .nb-landing-sidebar.open {
      right: 0;
    }
    .nb-landing-sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.6);
      z-index: 2999;
      display: none;
      backdrop-filter: blur(2px);
    }
    .nb-landing-sidebar.open ~ .nb-landing-sidebar-overlay, 
    .nb-landing-sidebar.open + .nb-landing-sidebar-overlay,
    .nb-landing-sidebar-overlay:has(~ .nb-landing-sidebar.open) {
      /* Hack since overlay is above, better to just use JS to toggle class on overlay */
    }
  </style>
  <script>
    // To handle overlay correctly
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isOpen = mutation.target.classList.contains('open');
          document.querySelector('.nb-landing-sidebar-overlay').style.display = isOpen ? 'block' : 'none';
        }
      });
    });
    window.addEventListener('DOMContentLoaded', () => {
       const sidebar = document.querySelector('.nb-landing-sidebar');
       if(sidebar) observer.observe(sidebar, { attributes: true });
    });
  </script>
`;

// It's safer to just replace `.nb-header` and its contents exactly
// We can use string indexOf to find <div class="nb-header"> and its closing tag
const headerStart = content.indexOf('<div class="nb-header">');
let headerEnd = content.indexOf('<div class="nb-hero">');

if (headerStart !== -1 && headerEnd !== -1) {
  content = content.substring(0, headerStart) + newHeader + '\n\n  ' + content.substring(headerEnd);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Landing page header updated successfully.');
} else {
  console.log('Could not find header boundaries.');
}
