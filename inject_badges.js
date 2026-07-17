const fs = require('fs');

function injectApp() {
  let c = fs.readFileSync('./frontend/pages/app.html', 'utf8');

  c = c.replace(
    '<button class="nb-btn-icon">🔔</button>',
    `<button class="nb-btn-icon" style="position:relative;" id="btn-notifications-desktop" onclick="toggleNotificationDropdown(event)">
              🔔
              <div class="notif-badge" style="display:none; position:absolute; top:-2px; right:-2px; background:#ef4444; color:#fff; font-size:9px; font-weight:bold; width:16px; height:16px; border-radius:50%; align-items:center; justify-content:center;"></div>
            </button>`
  );

  c = c.replace(
    /<a href="#" class="mobile-nav-item" onclick="showMobileView\('m-view-releves'\); updateMobileNav\(this\)">(?:\r\n|\n|\r)\s*<i class="ti ti-bell"><\/i>(?:\r\n|\n|\r)\s*<span>Notifs<\/span>(?:\r\n|\n|\r)\s*<\/a>/,
    `<a href="#" class="mobile-nav-item" id="mobile-bell-icon" onclick="toggleNotificationDropdown(event)">
      <div style="position:relative;">
        <i class="ti ti-bell"></i>
        <div class="notif-badge" style="display:none; position:absolute; top:-4px; right:-8px; background:#ef4444; color:#fff; font-size:9px; font-weight:bold; width:16px; height:16px; border-radius:50%; align-items:center; justify-content:center;"></div>
      </div>
      <span>Notifs</span>
    </a>`
  );

  if (!c.includes('notifications.js')) {
    c = c.replace('</body>', '  <script src="../assets/js/notifications.js"></script>\n</body>');
  }

  fs.writeFileSync('./frontend/pages/app.html', c, 'utf8');
}

function injectAdmin() {
  let c = fs.readFileSync('./frontend/pages/admin-dashboard.html', 'utf8');

  c = c.replace(
    /<button class="icon-btn" id="btn-notifications">(?:\r\n|\n|\r)\s*<i class="ti ti-bell"><\/i>(?:\r\n|\n|\r)\s*<\/button>/,
    `<button class="icon-btn" id="btn-notifications" style="position:relative;" onclick="toggleNotificationDropdown(event)">
                            <i class="ti ti-bell"></i>
                            <div class="notif-badge" style="display:none; position:absolute; top:-2px; right:-2px; background:#ef4444; color:#fff; font-size:9px; font-weight:bold; width:16px; height:16px; border-radius:50%; align-items:center; justify-content:center;"></div>
                        </button>`
  );

  if (!c.includes('notifications.js')) {
    c = c.replace('</body>', '  <script src="../assets/js/notifications.js"></script>\n</body>');
  }

  fs.writeFileSync('./frontend/pages/admin-dashboard.html', c, 'utf8');
}

injectApp();
injectAdmin();
console.log('UI successfully injected.');
