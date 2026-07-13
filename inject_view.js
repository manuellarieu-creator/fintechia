const fs = require('fs');
const file = 'c:/Users/ariol/.gemini/fintechia/frontend/pages/admin-dashboard.html';
let content = fs.readFileSync(file, 'utf8');

const snippet = fs.readFileSync('c:/Users/ariol/.gemini/fintechia/scratch_settings.html', 'utf8');
const viewHtml = `\n            <!-- =============================== -->\n            <!-- VUE : PARAMETRES                -->\n            <!-- =============================== -->\n            <div id="view-settings" class="admin-view" style="display: none;">\n${snippet}\n            </div>\n`;

// Let's replace by finding the ID instead of matching newlines
content = content.replace('<div id="view-dashboard"', viewHtml + '            <div id="view-dashboard"');

// And remove the modal-settings if it exists
const startIdx = content.indexOf('<!-- Modal Settings -->');
if (startIdx > -1) {
    const endIdx = content.indexOf('<!-- Modal Create Alerte -->');
    if (endIdx > -1) {
        content = content.substring(0, startIdx) + content.substring(endIdx);
    }
}

// Update the nav link
content = content.replace(
    /onclick="openSettingsModal\(\)"/g,
    'onclick="showAdminView(\'view-settings\', this); loadSystemSettings();"'
);

// Update Fermer button
content = content.replace(
    /onclick="document.getElementById\('modal-settings'\).style.display='none'"/g,
    'onclick="showAdminView(\'view-dashboard\', document.querySelector(\'.nav-item\'))"'
);

fs.writeFileSync(file, content);
console.log('Injection vue réussie avec regex');
