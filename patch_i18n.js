const fs = require('fs');

// Patch i18n.js
let c = fs.readFileSync('frontend/assets/js/i18n.js', 'utf8');
c = c.replace(
  '<div id="i18n-switcher" style="position:fixed; bottom:90px; right:20px; z-index:100; font-family:\'Inter\',sans-serif;">',
  '<div id="i18n-switcher" style="position:relative; font-family:\'Inter\',sans-serif; display:inline-block;">'
);
c = c.replace(
  "document.body.insertAdjacentHTML('beforeend', switcherHTML);",
  "const container = document.getElementById('i18n-container');\n" +
  "if (container) {\n" +
  "  container.innerHTML = switcherHTML;\n" +
  "} else {\n" +
  "  const floatingSwitcher = switcherHTML.replace('position:relative;', 'position:fixed; bottom:90px; right:20px; z-index:100;');\n" +
  "  document.body.insertAdjacentHTML('beforeend', floatingSwitcher);\n" +
  "}"
);
fs.writeFileSync('frontend/assets/js/i18n.js', c);

// Inject i18n-container in index.html
let html = fs.readFileSync('frontend/pages/index.html', 'utf8');
html = html.replace(
  '<div style="display:flex; gap:12px;">',
  '<div style="display:flex; gap:12px; align-items:center;">\n        <div id="i18n-container"></div>'
);
fs.writeFileSync('frontend/pages/index.html', html);
console.log('Patched UI for language switcher');
