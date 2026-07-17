const fs = require('fs');

function extractText(file) {
  const html = fs.readFileSync(file, 'utf8');
  const texts = new Set();
  
  // Very basic regex to find text inside common tags: > text <
  const regex = />([^<]+)</g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let str = match[1].trim();
    // exclude pure numbers, symbols, short things, or scripts
    if (str.length > 1 && !/^[0-9\s€$.,;:\-+*/=()!%]+$/.test(str) && !str.includes('function(') && !str.includes('const ') && !str.includes('let ')) {
      texts.add(str);
    }
  }

  // Also extract placeholders
  const placeholderRegex = /placeholder="([^"]+)"/g;
  while ((match = placeholderRegex.exec(html)) !== null) {
    let str = match[1].trim();
    if (str.length > 1) texts.add(str);
  }

  // Also extract values from buttons/inputs
  const valueRegex = /value="([^"]+)"/g;
  while ((match = valueRegex.exec(html)) !== null) {
    let str = match[1].trim();
    if (str.length > 1 && !/^[0-9\s€$.,;:\-+*/=()!%_a-zA-Z0-9]+$/.test(str) /* simple values are often internal */) {
      if (str.includes(' ')) texts.add(str);
    }
  }

  return Array.from(texts);
}

const files = [
  'frontend/pages/index.html',
  'frontend/pages/app.html',
  'frontend/pages/admin-dashboard.html',
  'frontend/assets/js/chat-widget.js',
  'frontend/assets/js/admin-chat.js'
];

let allTexts = new Set();
for (let f of files) {
  if (fs.existsSync(f)) {
    let arr = extractText(f);
    for (let a of arr) allTexts.add(a);
  }
}

// Convert Set to object
const dict = {};
for (let t of allTexts) {
  // Clean up excessive newlines and spaces
  let cleaned = t.replace(/\s+/g, ' ').trim();
  if (cleaned.length > 1 && !cleaned.includes('{') && !cleaned.includes('}')) {
    dict[cleaned] = cleaned;
  }
}

fs.writeFileSync('scratch_dict.json', JSON.stringify(dict, null, 2));
console.log('Extracted ' + Object.keys(dict).length + ' strings.');
