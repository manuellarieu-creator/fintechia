const fs = require('fs');
const file = 'c:/Users/ariol/.gemini/fintechia/frontend/assets/js/admin.js';
let content = fs.readFileSync(file, 'utf8');

const jsToAdd = `
// ============================
// SINGLE TRANSFER ACTION
// ============================
let currentTransferActionAllowed = false;

function openTransferModal(isAllowed) {
    currentTransferActionAllowed = isAllowed;
    const modal = document.getElementById('modal-transfer-action');
    const title = document.getElementById('transfer-action-title');
    const desc = document.getElementById('transfer-action-desc');
    const btn = document.getElementById('btn-transfer-action');
    
    if (isAllowed) {
        title.textContent = 'Autoriser virements sortants';
        desc.textContent = 'Saisissez l\\'ID du compte pour le débloquer.';
        btn.textContent = 'Autoriser';
        btn.style.background = '#16A34A';
        btn.style.borderColor = '#16A34A';
    } else {
        title.textContent = 'Bloquer virements sortants';
        desc.textContent = 'Saisissez l\\'ID du compte pour empêcher toute émission de virement.';
        btn.textContent = 'Bloquer';
        btn.style.background = '#DC2626';
        btn.style.borderColor = '#DC2626';
    }
    
    document.getElementById('transfer-action-account-id').value = '';
    modal.style.display = 'flex';
}

async function submitTransferAction() {
    const accountId = document.getElementById('transfer-action-account-id').value.trim();
    if (!accountId) return alert("Veuillez saisir un ID de compte");
    
    const res = await fetchAPI(\`/comptes/\${accountId}/transfer-toggle\`, 'PATCH', { allowed: currentTransferActionAllowed });
    
    if (res && res.success) {
        alert(\`Virements sortants \${currentTransferActionAllowed ? 'autorisés' : 'bloqués'} pour le compte #\${accountId}.\`);
        document.getElementById('modal-transfer-action').style.display = 'none';
        if (typeof loadClientsTable === 'function') loadClientsTable(); // Refresh table if needed
    } else {
        alert(res?.error || "Erreur lors de la modification des virements.");
    }
}

// ============================
// NEW CLIENT ACTION
// ============================
async function submitNewClient() {
    const prenom = document.getElementById('new-client-prenom').value.trim();
    const nom = document.getElementById('new-client-nom').value.trim();
    const email = document.getElementById('new-client-email').value.trim();
    const mot_de_passe = document.getElementById('new-client-password').value.trim();
    const telephone = document.getElementById('new-client-tel').value.trim();
    
    if (!prenom || !nom || !email || !mot_de_passe) {
        return alert("Veuillez remplir les champs obligatoires (Prénom, Nom, Email, Mot de passe).");
    }
    
    const res = await fetchAPI('/users', 'POST', { prenom, nom, email, mot_de_passe, telephone });
    
    if (res && res.success) {
        alert(\`Client créé avec succès ! (User ID: \${res.userId}, Account ID: \${res.accountId})\`);
        document.getElementById('modal-new-client').style.display = 'none';
        
        // Reset form
        document.getElementById('new-client-prenom').value = '';
        document.getElementById('new-client-nom').value = '';
        document.getElementById('new-client-email').value = '';
        document.getElementById('new-client-tel').value = '';
        
        if (typeof loadClientsTable === 'function') loadClientsTable();
        loadDashboardStats();
    } else {
        alert(res?.error || "Erreur lors de la création du client.");
    }
}
`;

content += '\n' + jsToAdd;
fs.writeFileSync(file, content);
console.log('JS patched');
