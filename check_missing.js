const fs = require('fs');
const path = require('path');

const frFile = path.join(__dirname, 'frontend/assets/locales/fr.json');
const frDict = JSON.parse(fs.readFileSync(frFile, 'utf8'));

const extractedFile = path.join(__dirname, 'extracted_strings.json');
const extracted = JSON.parse(fs.readFileSync(extractedFile, 'utf8'));

const missing = [];
for (const str of extracted) {
    if (!frDict[str]) {
        missing.push(str);
    }
}

fs.writeFileSync(path.join(__dirname, 'missing_strings.json'), JSON.stringify(missing, null, 2));
console.log(`Missing strings: ${missing.length}`);
