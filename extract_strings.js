const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/assets/js/contrats-v8.js');
const localesDir = path.join(__dirname, 'frontend/assets/locales');

const code = fs.readFileSync(file, 'utf8');

// Regex to find HTML strings inside template literals
const strings = new Set();
const regex = />([^<]+)</g;
let match;
while ((match = regex.exec(code)) !== null) {
    let str = match[1].trim();
    // Ignore lines that look like JS template vars or just punctuation
    if (str.length > 1 && !str.includes('${') && !/^[0-9\s€$.,;:+\*/=()!%_\-]+$/.test(str) && !str.includes('{')) {
        strings.add(str.replace(/\s+/g, ' '));
    }
}

// Manually extract titles, placeholders or buttons
const regexQuotes = /['"]([^'"]+)['"]/g;
while ((match = regexQuotes.exec(code)) !== null) {
    let str = match[1].trim();
    if (str.length > 2 && /^[A-ZÉÀ]/.test(str) && !str.includes('.html') && !str.includes('/') && !str.includes('_') && !str.includes('-')) {
        strings.add(str.replace(/\s+/g, ' '));
    }
}

const arr = Array.from(strings);
fs.writeFileSync(path.join(__dirname, 'extracted_strings.json'), JSON.stringify(arr, null, 2));
console.log(`Extracted ${arr.length} strings`);
