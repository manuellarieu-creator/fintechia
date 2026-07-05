let beneficiairesList = [];

async function loadBeneficiaires() {
  try {
    beneficiairesList = await apiCall('/beneficiaires');
    const tbody = document.getElementById('beneficiaires-tbody');
    if(!tbody) return;
    
    if(beneficiairesList.length === 0) {
      if(tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Aucun bénéficiaire enregistré.</td></tr>';
      const mList = document.getElementById('beneficiaires-mobile-list');
      if(mList) mList.innerHTML = '<div class="bene bene-add" onclick="showMobileView(\'m-view-virements\')"><div class="bene-av"><i class="ti ti-plus"></i></div><span class="bene-n">Nouveau</span></div>';
      return;
    }
    
    if(tbody) {
      tbody.innerHTML = beneficiairesList.map(b => {
        const date = new Date(b.cree_le).toLocaleDateString('fr-FR');
        return `
          <tr>
            <td><b>${b.nom}</b></td>
            <td>${b.iban}</td>
            <td>${date}</td>
            <td>
              <button onclick="supprimerBeneficiaire(${b.id})" style="color:#EF4444; background:none; border:none; cursor:pointer; font-weight:bold;">Supprimer</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    const mobileList = document.getElementById('beneficiaires-mobile-list');
    if(mobileList) {
      mobileList.innerHTML = beneficiairesList.map(b => {
        const initials = b.nom.substring(0, 2).toUpperCase();
        return `
          <div class="bene" onclick="showMobileView('m-view-virements')">
            <div class="bene-av" style="background:var(--surface-1); color:var(--text-primary); border:1px solid var(--border);">${initials}</div>
            <span class="bene-n">${b.nom.split(' ')[0]}</span>
          </div>
        `;
      }).join('') + `
        <div class="bene bene-add" onclick="showMobileView('m-view-virements')">
          <div class="bene-av"><i class="ti ti-plus"></i></div>
          <span class="bene-n">Nouveau</span>
        </div>
      `;
    }

    const mobileFullList = document.getElementById('beneficiaires-mobile-full-list');
    if(mobileFullList) {
      mobileFullList.innerHTML = beneficiairesList.map(b => {
        const initials = b.nom.substring(0, 2).toUpperCase();
        return `
          <div class="bene" style="flex-direction:row; width:100%; justify-content:space-between; align-items:center; background:var(--surface-0); padding:10px; border-radius:10px; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="bene-av" style="background:var(--surface-1); color:var(--text-primary); border:1px solid var(--border);">${initials}</div>
              <div style="display:flex; flex-direction:column;">
                <span style="font-size:13px; font-weight:600;">${b.nom}</span>
                <span style="font-size:10px; color:var(--text-muted);">${b.iban}</span>
              </div>
            </div>
            <button onclick="supprimerBeneficiaire(${b.id})" style="color:var(--danger); background:none; border:none; cursor:pointer; padding:5px;"><i class="ti ti-trash" style="font-size:18px;"></i></button>
          </div>
        `;
      }).join('');
    }
    
  } catch (err) {
    console.error(err);
  }
}

async function ajouterBeneficiaire() {
  const nom = document.getElementById('new-ben-nom').value;
  const iban = document.getElementById('new-ben-iban').value;
  if(!nom || !iban) return alert('Remplissez tous les champs');
  
  try {
    await apiCall('/beneficiaires', 'POST', { nom, iban });
    document.getElementById('new-ben-nom').value = '';
    document.getElementById('new-ben-iban').value = '';
    closeModal('modal-add-beneficiaire');
    loadBeneficiaires();
    if (typeof loadBeneficiairesForSelect === 'function') {
      loadBeneficiairesForSelect();
    }
    alert('Bénéficiaire ajouté avec succès');
  } catch(err) {
    alert(err.message || 'Erreur lors de l\'ajout du bénéficiaire');
  }
}

async function supprimerBeneficiaire(id) {
  if(!confirm("Supprimer ce bénéficiaire de votre liste ?")) return;
  try {
    await apiCall(`/beneficiaires/${id}`, 'DELETE');
    loadBeneficiaires();
  } catch(err) {
    alert('Erreur lors de la suppression');
  }
}

// Pour le selecteur de la page virement (Tunnel Desktop et Mobile)
async function loadBeneficiairesForSelect() {
  try {
    const bens = await apiCall('/beneficiaires');
    const txs = await apiCall('/transactions?limit=50');
    
    // Trouver les IBANs récents
    const recentIbans = new Set();
    if (txs && txs.length) {
      txs.forEach(tx => {
        if (tx.type === 'virement_emis' && tx.iban_dest) {
          recentIbans.add(tx.iban_dest);
        }
      });
    }

    const recentBens = bens.filter(b => recentIbans.has(b.iban));
    
    const desktopRecentGrid = document.getElementById('desktop-recents-grid');
    const mobileRecentGrid = document.getElementById('mobile-recents-grid');
    const desktopAllGrid = document.getElementById('desktop-all-grid');
    const mobileAllGrid = document.getElementById('mobile-all-grid');
    
    // Conteneurs à afficher/masquer
    const desktopRecentContainer = document.getElementById('desktop-recents-container');
    const mobileRecentContainer = document.getElementById('mobile-recents-container');

    // Fonction d'aide pour générer les cartes
    const generateCards = (list, isMobile, includeAddButton) => {
      let html = list.map(b => {
        const initials = b.nom.substring(0, 2).toUpperCase();
        return `
          <div class="recent-card" onclick="selectBeneficiary('${b.iban}', '${b.nom}', ${isMobile})">
              <div class="avatar-sm" style="background:var(--primary-light); color:var(--primary); font-weight:bold;">${initials}</div>
              <div class="recent-info">
                  <h5>${b.nom}</h5>
                  <p>${b.iban.substring(0, 8)}...</p>
              </div>
          </div>
        `;
      }).join('');
      
      if (includeAddButton) {
        html += `
          <div class="recent-card" style="border-style: dashed; cursor: pointer;" onclick="openModal('modal-add-beneficiaire')">
              <div class="avatar-sm" style="background: white; border: 1px dashed var(--border); color: var(--text-muted);"><i class="ti ti-user-plus"></i></div>
              <div class="recent-info">
                  <h5 style="color: var(--text-muted);">Nouveau bénéficiaire</h5>
              </div>
          </div>
        `;
      }
      return html;
    };

    // Populate Récents if any
    if(recentBens.length > 0) {
      if(desktopRecentGrid) desktopRecentGrid.innerHTML = generateCards(recentBens, false, false);
      if(mobileRecentGrid) mobileRecentGrid.innerHTML = generateCards(recentBens, true, false);
      if(desktopRecentContainer) desktopRecentContainer.style.display = 'block';
      if(mobileRecentContainer) mobileRecentContainer.style.display = 'block';
    } else {
      if(desktopRecentContainer) desktopRecentContainer.style.display = 'none';
      if(mobileRecentContainer) mobileRecentContainer.style.display = 'none';
    }

    // Populate Tous
    if(desktopAllGrid) desktopAllGrid.innerHTML = generateCards(bens, false, true);
    if(mobileAllGrid) mobileAllGrid.innerHTML = generateCards(bens, true, true);

  } catch(err) {
    console.error(err);
  }
}

// Fonction appelée lors du clic sur une carte bénéficiaire
window.selectBeneficiary = function(iban, nom, isMobile) {
  const suffix = isMobile ? '-mobile' : '';
  const prefix = isMobile ? 'mobile' : 'desktop';
  
  // Update hidden inputs
  const inputIban = document.getElementById('vir-iban' + suffix);
  const inputNom = document.getElementById('vir-nom' + suffix);
  if(inputIban) inputIban.value = iban;
  if(inputNom) inputNom.value = nom;

  // Show selected block
  const blockSelected = document.getElementById(prefix + '-beneficiary-selected');
  const avatar = document.getElementById(prefix + '-ben-avatar');
  const nameLabel = document.getElementById(prefix + '-ben-name');
  const ibanLabel = document.getElementById(prefix + '-ben-iban');

  if(blockSelected) blockSelected.style.display = 'flex';
  if(avatar) avatar.innerText = nom.substring(0, 2).toUpperCase();
  if(nameLabel) nameLabel.innerText = nom;
  if(ibanLabel) ibanLabel.innerText = iban;
}

let bicTimeout = null;
async function previewBIC() {
  const iban = document.getElementById('new-ben-iban').value.replace(/\s+/g, '').toUpperCase();
  const bicInput = document.getElementById('new-ben-bic');
  if (!bicInput) return;
  
  if (iban.length < 15) {
    bicInput.value = '';
    return;
  }
  
  clearTimeout(bicTimeout);
  bicInput.value = 'Recherche en cours...';
  
  bicTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`https://openiban.com/validate/${iban}?getBIC=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.valid && data.bankData && data.bankData.bic) {
          bicInput.value = data.bankData.bic;
        } else {
          bicInput.value = 'Code BIC requis';
        }
      } else {
        bicInput.value = 'Erreur réseau';
      }
    } catch(err) {
      bicInput.value = 'Erreur de recherche';
    }
  }, 500);
}
