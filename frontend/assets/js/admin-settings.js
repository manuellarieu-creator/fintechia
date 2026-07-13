// Logique pour la page Paramètres (Settings) du Dashboard Admin

// 1. Navigation entre les onglets
function showSettingsTab(tabId, el) {
    // Cacher tous les onglets
    const tabs = ['etablissement', 'securite', 'equipe', 'notifications', 'virements', 'cartes', 'api', 'conformite'];
    tabs.forEach(t => {
        const div = document.getElementById('tab-' + t);
        if(div) div.style.display = 'none';
    });

    // Enlever la classe act de tous les boutons
    document.querySelectorAll('.section-tab').forEach(btn => btn.classList.remove('act'));

    // Afficher le bon onglet
    const target = document.getElementById('tab-' + tabId);
    if(target) target.style.display = 'grid';

    // Ajouter la classe act au bouton cliqué
    if(el) el.classList.add('act');
}

// 2. Gestion des toggles (visuel)
function toggleSwitch(el) {
    if (el.classList.contains('on')) {
        el.classList.remove('on');
        el.classList.add('off');
    } else {
        el.classList.remove('off');
        el.classList.add('on');
    }
}

// 3. Charger les paramètres depuis l'API
async function loadSystemSettings() {
    const res = await fetchAPI('/settings', 'GET');
    if (!res) return;

    // Remplir les inputs et selects
    for (const [key, value] of Object.entries(res)) {
        // Toggles
        const toggleEl = document.getElementById('tg-' + key);
        if (toggleEl) {
            if (value === 'true') {
                toggleEl.classList.remove('off');
                toggleEl.classList.add('on');
            } else {
                toggleEl.classList.remove('on');
                toggleEl.classList.add('off');
            }
        }

        // Inputs et Selects
        const inputEl = document.getElementById('set-' + key);
        if (inputEl) {
            inputEl.value = value;
        }

        // Affichage texte simple
        const dispEl = document.getElementById('disp-' + key);
        if (dispEl) {
            dispEl.textContent = value;
        }
    }
}

// 4. Sauvegarder les paramètres vers l'API
async function saveSystemSettings() {
    const settings = {};

    // Récupérer tous les inputs, selects (identifiés par 'set-')
    document.querySelectorAll('[id^="set-"]').forEach(el => {
        const key = el.id.replace('set-', '');
        settings[key] = el.value;
    });

    // Récupérer tous les toggles (identifiés par 'tg-')
    document.querySelectorAll('[id^="tg-"]').forEach(el => {
        const key = el.id.replace('tg-', '');
        settings[key] = el.classList.contains('on') ? 'true' : 'false';
    });

    const btn = document.querySelector('button[onclick="saveSystemSettings()"]');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-loader" style="font-size:13px; animation: spin 1s linear infinite;"></i> Enregistrement...';

    const res = await fetchAPI('/settings', 'PATCH', { settings });
    if (res && res.success) {
        alert('Paramètres enregistrés avec succès.');
    } else {
        alert('Erreur lors de la sauvegarde des paramètres.');
    }
    btn.innerHTML = oldText;
}

// Actions de la zone de danger
async function executePurgeSessions() {
    if(!confirm("ATTENTION : Cela va déconnecter tous les utilisateurs et administrateurs actuellement en ligne. Continuer ?")) return;
    const res = await fetchAPI('/system/purge-sessions', 'POST');
    if (res && res.success) {
        alert("Sessions purgées avec succès.");
    }
}

async function executeMaintenanceMode() {
    const toggle = document.getElementById('tg-secu_maintenance');
    if (!toggle) return;
    
    const isActivating = toggle.classList.contains('off'); // S'il est off, on l'active
    if(!confirm(isActivating 
        ? "Activer le mode maintenance ? L'application client sera inaccessible." 
        : "Désactiver le mode maintenance ?")) return;
        
    toggleSwitch(toggle);
    await saveSystemSettings();
}

// Intercepter l'ouverture de la modale settings pour charger les données
document.addEventListener('DOMContentLoaded', () => {
    // La méthode onclick de la nav ouvre le modal
    const originalShow = window.showAdminView;
    // Actually we can just call loadSystemSettings when opening modal
});

// Since the HTML has `onclick="document.getElementById('modal-settings').style.display='flex'"`
// I will wrap it to also call `loadSystemSettings()`
function openSettingsModal() {
    document.getElementById('modal-settings').style.display = 'flex';
    loadSystemSettings();
}
