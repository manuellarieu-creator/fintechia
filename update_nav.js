const fs = require('fs');
const file = 'c:/Users/ariol/.gemini/fintechia/frontend/pages/admin-dashboard.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Update Sidebar Nav Item
content = content.replace(
    'onclick="openSettingsModal()">\n                    <i class="ti ti-settings"></i>\n                    <span>Paramètres Globaux</span>',
    'onclick="showAdminView(\\\'view-settings\\\', this); loadSystemSettings();">\n                    <i class="ti ti-settings"></i>\n                    <span>Paramètres Globaux</span>'
);

// 2. Update Fermer button inside the settings view
// We look for: <button class="btn" style="background:#F1F5F9;color:#475569;border:0.5px solid #E2E8F0;" onclick="document.getElementById('modal-settings').style.display='none'"><i class="ti ti-x" style="font-size:13px;"></i>Fermer</button>
content = content.replace(
    `onclick="document.getElementById('modal-settings').style.display='none'"><i class="ti ti-x" style="font-size:13px;"></i>Fermer`,
    `onclick="showAdminView('view-dashboard')"><i class="ti ti-x" style="font-size:13px;"></i>Fermer`
);

fs.writeFileSync(file, content);
console.log('Update nav and close button success');
