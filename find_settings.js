const fs = require('fs');
const html = fs.readFileSync('frontend/pages/app.html', 'utf8');
const start = html.indexOf('id="view-settings"');
console.log(html.substring(start + 5000, start + 8000));
