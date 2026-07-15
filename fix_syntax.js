const fs = require('fs');
let html = fs.readFileSync('frontend/pages/app.html', 'utf8');

const brokenStr = "function openDesktopViewMobile('view-settings') {";
const fixedStr = "function openDesktopViewMobile(viewId) {";

html = html.replace(brokenStr, fixedStr);

fs.writeFileSync('frontend/pages/app.html', html);
console.log("Fixed syntax error");
