const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'frontend', 'assets', 'js');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
for (const file of files) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace 'fr-FR' in toLocaleDateString and toLocaleTimeString with our safe wrapper
    if (content.includes("'fr-FR'")) {
        content = content.replace(/\'fr-FR\'/g, "(typeof window.getCurrentLocale === 'function' ? window.getCurrentLocale() : 'fr-FR')");
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${file}`);
    }
}
