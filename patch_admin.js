const fs = require('fs');
let c = fs.readFileSync('frontend/pages/admin-dashboard.html', 'utf8');
c = c.replace('<script src="../assets/js/notifications.js"></script>', '<script src="../assets/js/notifications.js"></script>\n  <script src="../assets/js/i18n.js"></script>');
fs.writeFileSync('frontend/pages/admin-dashboard.html', c);
