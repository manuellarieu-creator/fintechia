const fs = require('fs');
const file = 'c:/Users/ariol/.gemini/fintechia/frontend/pages/admin-dashboard.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Modales
const modalsHtml = `
    <!-- Modal Action Virement -->
    <div class="modal" id="modal-transfer-action" style="display:none;">
        <div class="modal-content" style="max-width: 400px;">
            <h3 id="transfer-action-title">Action Virement</h3>
            <p class="text-muted" style="margin-bottom:16px;" id="transfer-action-desc">Saisissez l'ID du compte concerné.</p>
            
            <div style="margin-bottom:24px;">
                <label style="font-size:12px; font-weight:600; display:block; margin-bottom:8px;">ID du compte (ex: 5)</label>
                <input type="number" id="transfer-action-account-id" class="input" style="width:100%;">
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button class="btn-outline" onclick="document.getElementById('modal-transfer-action').style.display='none'">Annuler</button>
                <button class="btn-primary" id="btn-transfer-action" onclick="submitTransferAction()">Confirmer</button>
            </div>
        </div>
    </div>

    <!-- Modal Nouveau Client -->
    <div class="modal" id="modal-new-client" style="display:none;">
        <div class="modal-content" style="max-width: 500px;">
            <h3>Nouveau Client</h3>
            <p class="text-muted" style="margin-bottom:16px;">Création manuelle d'un compte client.</p>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom:16px;">
                <div>
                    <label style="font-size:12px; font-weight:600; display:block; margin-bottom:8px;">Prénom</label>
                    <input type="text" id="new-client-prenom" class="input" style="width:100%;">
                </div>
                <div>
                    <label style="font-size:12px; font-weight:600; display:block; margin-bottom:8px;">Nom</label>
                    <input type="text" id="new-client-nom" class="input" style="width:100%;">
                </div>
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="font-size:12px; font-weight:600; display:block; margin-bottom:8px;">Email</label>
                <input type="email" id="new-client-email" class="input" style="width:100%;">
            </div>

            <div style="margin-bottom:16px;">
                <label style="font-size:12px; font-weight:600; display:block; margin-bottom:8px;">Mot de passe provisoire</label>
                <input type="text" id="new-client-password" class="input" style="width:100%;" value="ClientNova2026!">
            </div>
            
            <div style="margin-bottom:24px;">
                <label style="font-size:12px; font-weight:600; display:block; margin-bottom:8px;">Téléphone (optionnel)</label>
                <input type="text" id="new-client-tel" class="input" style="width:100%;">
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button class="btn-outline" onclick="document.getElementById('modal-new-client').style.display='none'">Annuler</button>
                <button class="btn-primary" onclick="submitNewClient()">Créer le client</button>
            </div>
        </div>
    </div>
`;

// Insert modals before <!-- Scripts -->
content = content.replace('<!-- Scripts -->', modalsHtml + '\n    <!-- Scripts -->');

// 2. Buttons in the dashboard
content = content.replace(
  'onclick="alert(\\\'Création manuelle - Bientôt\\\')"',
  'onclick="document.getElementById(\\\'modal-new-client\\\').style.display=\\\'flex\\\'"'
);

content = content.replace(
  'Bloquer tous virements',
  'Bloquer virements'
);
content = content.replace(
  'onclick="toggleGlobalTransfers(false)"',
  'onclick="openTransferModal(false)"'
);

content = content.replace(
  'Autoriser tous virements',
  'Autoriser virements'
);
content = content.replace(
  'onclick="toggleGlobalTransfers(true)"',
  'onclick="openTransferModal(true)"'
);

fs.writeFileSync(file, content);
console.log('Admin dashboard patched');
