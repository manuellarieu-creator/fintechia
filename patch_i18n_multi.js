const fs = require('fs');

// 1. Update i18n.js
let i18n = fs.readFileSync('frontend/assets/js/i18n.js', 'utf8');

i18n = i18n.replace(
  "    const container = document.getElementById('i18n-container');\n" +
  "if (container) {\n" +
  "  container.innerHTML = switcherHTML;\n" +
  "} else {\n" +
  "  const floatingSwitcher = switcherHTML.replace('position:relative;', 'position:fixed; bottom:90px; right:20px; z-index:100;');\n" +
  "  document.body.insertAdjacentHTML('beforeend', floatingSwitcher);\n" +
  "}",
  `    const containers = document.querySelectorAll('.i18n-container, #i18n-container');
    if (containers.length > 0) {
      containers.forEach(c => c.innerHTML = switcherHTML);
    } else {
      const floatingSwitcher = switcherHTML.replace('position:relative;', 'position:fixed; bottom:90px; right:20px; z-index:100;');
      document.body.insertAdjacentHTML('beforeend', floatingSwitcher);
    }`
);

i18n = i18n.replace(
  "    const btn = document.getElementById('i18n-btn');\n" +
  "    const menu = document.getElementById('i18n-menu');\n" +
  "    \n" +
  "    btn.addEventListener('click', () => {\n" +
  "      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';\n" +
  "    });",
  `    document.querySelectorAll('#i18n-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const menu = e.currentTarget.nextElementSibling;
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });
    });`
);

i18n = i18n.replace(
  "    const btnFlag = document.getElementById('i18n-current-flag');\n" +
  "    const btnCode = document.getElementById('i18n-current-code');\n" +
  "    if (btnFlag) btnFlag.innerText = flags[this.currentLang] || '🇫🇷';\n" +
  "    if (btnCode) btnCode.innerText = this.currentLang.toUpperCase();",
  `    document.querySelectorAll('#i18n-current-flag').forEach(btnFlag => {
      btnFlag.innerText = flags[this.currentLang] || '🇫🇷';
    });
    document.querySelectorAll('#i18n-current-code').forEach(btnCode => {
      btnCode.innerText = this.currentLang.toUpperCase();
    });`
);

i18n = i18n.replace(
  "        this.setLanguage(lang);\n" +
  "        menu.style.display = 'none';",
  `        this.setLanguage(lang);
        document.querySelectorAll('#i18n-menu').forEach(m => m.style.display = 'none');`
);

fs.writeFileSync('frontend/assets/js/i18n.js', i18n);

// 2. Update index.html
let html = fs.readFileSync('frontend/pages/index.html', 'utf8');
// Fix logo (remove mobile-only-text and display:none)
html = html.replace('<span class="nb-serif mobile-only-text" style="font-size:18px;font-weight:500;letter-spacing:.2px;display:none;">Fintechia</span>',
                    '<span class="nb-serif" style="font-size:18px;font-weight:500;letter-spacing:.2px;">Fintechia</span>');
html = html.replace('<span class="nb-serif" style="font-size:18px;font-weight:500;color:#E9E6DD;">Fintechia</span>',
                    '<span class="nb-serif" style="font-size:18px;font-weight:500;color:#E9E6DD;">Fintechia</span>'); // nothing to fix here

// Inject mobile container
html = html.replace(
  '<button class="hamburger-btn" onclick="toggleMobileNav()">',
  '<div class="i18n-container" style="margin-right:15px;"></div>\n        <button class="hamburger-btn" onclick="toggleMobileNav()">'
);
fs.writeFileSync('frontend/pages/index.html', html);

// 3. Update app.html top bar
let appHtml = fs.readFileSync('frontend/pages/app.html', 'utf8');
appHtml = appHtml.replace(
  '<button class="icon-btn" id="btn-notifications" style="position:relative;" onclick="toggleNotificationDropdown(event)">',
  '<div class="i18n-container" style="margin-right:15px;"></div>\n      <button class="icon-btn" id="btn-notifications" style="position:relative;" onclick="toggleNotificationDropdown(event)">'
);
fs.writeFileSync('frontend/pages/app.html', appHtml);

// 4. Update admin-dashboard.html top bar
let adminHtml = fs.readFileSync('frontend/pages/admin-dashboard.html', 'utf8');
adminHtml = adminHtml.replace(
  '<button class="icon-btn" id="btn-notifications" style="position:relative;" onclick="toggleNotificationDropdown(event)">',
  '<div class="i18n-container" style="margin-right:15px;"></div>\n        <button class="icon-btn" id="btn-notifications" style="position:relative;" onclick="toggleNotificationDropdown(event)">'
);
fs.writeFileSync('frontend/pages/admin-dashboard.html', adminHtml);

console.log('UI Patched successfully');
