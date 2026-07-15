const fs = require('fs');
const html = fs.readFileSync('frontend/pages/app.html', 'utf8');
const start = html.indexOf('<div id="view-virements"');
const end = html.indexOf('<!-- VUE CARTES -->');
console.log(html.substring(start, end));
