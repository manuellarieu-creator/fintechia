const fs = require('fs');
let html = fs.readFileSync('frontend/pages/app.html', 'utf8');

// 1. Add classes to view-virements flex containers
html = html.replace(
    '<div style="display:flex; justify-content:space-between; align-items:center;">',
    '<div class="virements-solde-flex" style="display:flex; justify-content:space-between; align-items:center;">'
);

html = html.replace(
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">',
    '<div class="virements-pagination-flex" style="display:flex; justify-content:space-between; align-items:center; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">'
);

fs.writeFileSync('frontend/pages/app.html', html);

let css = fs.readFileSync('frontend/assets/css/responsive.css', 'utf8');

const responsiveCSS = `

/* --- VIREMENTS UNIFIÉS RESPONSIVE --- */
@media (max-width: 768px) {
  #view-virements .virements-solde-flex {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 16px;
  }
  
  #view-virements .virements-solde-flex > div {
    width: 100%;
  }

  #view-virements .virements-solde-flex button {
    width: 100%;
    justify-content: center;
  }
  
  #view-virements .nb-tx-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }
  
  #view-virements .nb-tx-header button {
    width: 100%;
    justify-content: center;
  }
  
  #view-virements .virements-pagination-flex {
    flex-direction: column;
    gap: 16px;
    align-items: center !important;
  }
  
  #view-virements .virements-pagination-flex > div {
    width: 100%;
    justify-content: space-between;
  }
  
  #view-virements .nb-tx-table {
    white-space: nowrap;
  }

  /* Tunnel Modal Responsive */
  #modal-virement-tunnel .grid-layout {
    display: flex !important;
    flex-direction: column;
    gap: 16px;
  }

  #modal-virement-tunnel .modal-content {
    padding: 16px !important;
    width: 95% !important;
    max-height: 90vh;
    overflow-y: auto;
  }

  /* Make sure step text hides to save space */
  #modal-virement-tunnel .step span {
    display: none;
  }
}
`;

if (!css.includes('VIREMENTS UNIFIÉS RESPONSIVE')) {
    css += responsiveCSS;
    fs.writeFileSync('frontend/assets/css/responsive.css', css);
}

console.log("Optimisation done");
