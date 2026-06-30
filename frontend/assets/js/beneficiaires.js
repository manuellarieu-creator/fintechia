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
    alert('Bénéficiaire ajouté avec succès');
  } catch(err) {
    alert('Erreur lors de l\'ajout du bénéficiaire');
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

// Pour le selecteur de la page virement
async function loadBeneficiairesForSelect() {
  try {
    const bens = await apiCall('/beneficiaires');
    const select = document.getElementById('vir-iban');
    const selectMobile = document.getElementById('vir-iban-mobile');
    
    const optionsHTML = '<option value="">Choisir un bénéficiaire...</option>' + bens.map(b => `<option value="${b.iban}" data-nom="${b.nom}">${b.nom} - ${b.iban}</option>`).join('');
    
    if(select) {
      select.innerHTML = optionsHTML;
      select.addEventListener('change', (e) => {
        const opt = select.options[select.selectedIndex];
        const nomInput = document.getElementById('vir-nom');
        if(nomInput && opt && opt.dataset.nom) {
          nomInput.value = opt.dataset.nom;
        }
      });
    }

    if(selectMobile) {
      selectMobile.innerHTML = optionsHTML;
      selectMobile.addEventListener('change', (e) => {
        const opt = selectMobile.options[selectMobile.selectedIndex];
        const nomInput = document.getElementById('vir-nom-mobile');
        if(nomInput && opt && opt.dataset.nom) {
          nomInput.value = opt.dataset.nom;
        }
      });
    }
  } catch(err) {
    console.error(err);
  }
}
