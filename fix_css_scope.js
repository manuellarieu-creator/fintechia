const fs = require('fs');

let appCss = fs.readFileSync('frontend/assets/css/app.css', 'utf8');

// The exact string in the file (notice the newlines/spaces)
const targetStr1 = '.nb-logout:hover { background: #FEF2F2; }\n';
const targetStr2 = '.nb-logout:hover { background: #FEF2F2; }\r\n';

if (appCss.includes(targetStr1)) {
    appCss = appCss.replace(targetStr1, targetStr1 + '  }\n');
    console.log("Closed media query in app.css using LF");
} else if (appCss.includes(targetStr2)) {
    appCss = appCss.replace(targetStr2, targetStr2 + '  }\r\n');
    console.log("Closed media query in app.css using CRLF");
} else {
    // If exact match fails, fallback to regex
    appCss = appCss.replace(/\.nb-logout:hover \{ background: #FEF2F2; \}/, match => match + '\n  }\n');
    console.log("Closed media query in app.css using regex fallback");
}

fs.writeFileSync('frontend/assets/css/app.css', appCss);

// Now add overrides to responsive.css
let respCss = fs.readFileSync('frontend/assets/css/responsive.css', 'utf8');

const overrides = `
/* Overrides for unified desktop views on mobile */
@media (max-width: 768px) {
  .nb-main {
    padding: 16px !important;
  }
  .nb-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
`;

if (!respCss.includes('Overrides for unified desktop views')) {
    respCss += overrides;
    fs.writeFileSync('frontend/assets/css/responsive.css', respCss);
    console.log("Added overrides to responsive.css");
}
