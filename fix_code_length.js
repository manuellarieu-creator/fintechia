const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'frontend', 'pages', 'app.html');
let content = fs.readFileSync(file, 'utf8');

// Replace code.length < 6 to code.length < 4
content = content.replace('if (code.length < 6) return;', 'if (code.length < 4) return;');

fs.writeFileSync(file, content);
console.log('Fixed');
