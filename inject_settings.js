const fs = require('fs');
const file = 'c:/Users/ariol/.gemini/fintechia/frontend/pages/admin-dashboard.html';
let content = fs.readFileSync(file, 'utf8');

const modalStart = `    <!-- Modal Settings -->\n    <div class="modal" id="modal-settings" style="display:none; z-index:9999;">\n        <div class="modal-content" style="max-width: 1100px; padding:0; overflow:hidden; border-radius:14px;">\n`;
const modalEnd = `        </div>\n    </div>\n\n`;
const snippet = fs.readFileSync('c:/Users/ariol/.gemini/fintechia/scratch_settings.html', 'utf8');

content = content.replace('<!-- Modal Create Alerte -->', modalStart + snippet + modalEnd + '    <!-- Modal Create Alerte -->');
fs.writeFileSync(file, content);
console.log('Injection réussie');
