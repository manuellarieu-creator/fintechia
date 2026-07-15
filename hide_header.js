const fs = require('fs');

let respCss = fs.readFileSync('frontend/assets/css/responsive.css', 'utf8');

const moreOverrides = `
/* Hide desktop topbar on mobile to save space and avoid duplicate headers */
@media (max-width: 768px) {
  .nb-header {
    display: none !important;
  }
  .nb-main {
    padding-top: 0 !important;
  }
  #view-virements {
    padding-top: 16px;
  }
}
`;

if (!respCss.includes('Hide desktop topbar on mobile')) {
    respCss += moreOverrides;
    fs.writeFileSync('frontend/assets/css/responsive.css', respCss);
    console.log("Added more overrides");
} else {
    console.log("Already added");
}
