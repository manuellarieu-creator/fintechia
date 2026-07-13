const fs = require('fs');
const file = 'c:/Users/ariol/.gemini/fintechia/frontend/pages/admin-dashboard.html';
let content = fs.readFileSync(file, 'utf8');

if(!content.includes('admin-settings.js')) {
    content = content.replace(
        '<script src="../assets/js/admin.js"></script>',
        '<script src="../assets/js/admin.js"></script>\n    <script src="../assets/js/admin-settings.js"></script>'
    );
    fs.writeFileSync(file, content);
    console.log('Script tag injected');
} else {
    console.log('Script tag already exists');
}
