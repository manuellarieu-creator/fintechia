let beneficiairesList = [];

async function loadBeneficiaires() {
  try {
    beneficiairesList = await apiCall('/beneficiaires');
    const tbody = document.getElementById('beneficiaires-tbody');
    if(!tbody) return;
    
    if(beneficiairesList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Aucun bénéficiaire enregistré.</td></tr>';
      return;
    }
    
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
    if(!select) return;
    select.innerHTML = '<option value="">Choisir un bénéficiaire...</option>' + bens.map(b => `<option value="${b.iban}" data-nom="${b.nom}">${b.nom} - ${b.iban}</option>`).join('');
    
    // Auto-fill recipient name when IBAN is selected
    select.addEventListener('change', (e) => {
      const opt = select.options[select.selectedIndex];
      const nomInput = document.getElementById('vir-nom');
      if(nomInput && opt && opt.dataset.nom) {
        nomInput.value = opt.dataset.nom;
      }
    });
  } catch(err) {
    console.error(err);
  }
}
