const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend', 'assets', 'locales');
const indexFile = path.join(__dirname, 'frontend', 'pages', 'index.html');
const content = fs.readFileSync(indexFile, 'utf8');

const langs = ['en', 'es', 'de', 'da', 'hu', 'hr', 'fr'];
const dicts = {};
langs.forEach(lang => {
    dicts[lang] = JSON.parse(fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf8'));
});

const allStrings = new Set();
const textRegex = />([^<]+)</g;
let match;
while ((match = textRegex.exec(content)) !== null) {
    const text = match[1].replace(/\s+/g, ' ').trim();
    if (text.length > 1 && !/^[\d\s€$.,;:+\*/=()!%_\-]+$/.test(text) && !text.includes('{')) {
        allStrings.add(text);
    }
}
const placeholderRegex = /placeholder="([^"]+)"/g;
while ((match = placeholderRegex.exec(content)) !== null) {
    const text = match[1].replace(/\s+/g, ' ').trim();
    allStrings.add(text);
}
const valueRegex = /value="([^"]+)"[^>]*type="(?:button|submit)"/g;
while ((match = valueRegex.exec(content)) !== null) {
     const text = match[1].replace(/\s+/g, ' ').trim();
     allStrings.add(text);
}

// Add strings from JS inside index.html
// e.g. "Mensualité estimée<br><span style=\"font-size:12px;color:#8A8676;font-weight:normal;\">(TAEG indicatif: "
allStrings.add('Mensualité estimée');
allStrings.add('TAEG indicatif:');
allStrings.add("Veuillez remplir les informations de contact.");

console.log(`Total strings in index.html: ${allStrings.size}`);

const issues = {};
for (const lang of langs) {
    if (lang === 'fr') continue;
    let missing = 0;
    let untranslated = 0; // translation is the same as French (and it's not a proper noun like Fintechia)
    for (const str of allStrings) {
        if (!dicts[lang][str]) {
            missing++;
            if (!issues[lang]) issues[lang] = [];
            issues[lang].push({ type: 'missing', key: str });
        } else if (dicts[lang][str] === str && !['Fintechia'].includes(str)) {
            untranslated++;
            if (!issues[lang]) issues[lang] = [];
            issues[lang].push({ type: 'untranslated', key: str });
        }
    }
    console.log(`[${lang.toUpperCase()}] Missing: ${missing}, Untranslated (same as FR): ${untranslated}`);
}

fs.writeFileSync('landing_issues.json', JSON.stringify(issues, null, 2));
console.log('Details saved to landing_issues.json');
