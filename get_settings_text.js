const fs = require('fs');
const content = fs.readFileSync('./frontend/pages/app.html', 'utf8');

// 1. Support
let supportSection = content.split('<div id="view-support"')[1].split('<!--')[0];
let set = new Set();
let match;
let regex = />([^<]+)</g;
while ((match = regex.exec(supportSection)) !== null) {
  let t = match[1].replace(/\s+/g, ' ').trim();
  if (t.length > 1 && !/^[\d\s€$.,;:+\*/=()!%_\-]+$/.test(t) && !t.includes('{')) set.add(t);
}

// 2. Settings
let settingsSection = content.split('<div id="view-settings"')[1].split('<script>')[0];
while ((match = regex.exec(settingsSection)) !== null) {
  let t = match[1].replace(/\s+/g, ' ').trim();
  if (t.length > 1 && !/^[\d\s€$.,;:+\*/=()!%_\-]+$/.test(t) && !t.includes('{')) set.add(t);
}

// Write to file
fs.writeFileSync('support_settings_strings.json', JSON.stringify(Array.from(set), null, 2));
console.log("Done");
