// releves.js - Logique de base pour la page des relevés

document.addEventListener('DOMContentLoaded', () => {
    
    // Gérer l'état actif de la liste d'historique
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        item.addEventListener('click', () => {
            // Retirer la classe active de tous les éléments
            historyItems.forEach(i => i.classList.remove('active'));
            // Ajouter la classe active à l'élément cliqué
            item.classList.add('active');
            
            // On pourrait ici déclencher un fetch pour mettre à jour la colonne centrale
            // avec les données du mois sélectionné.
        });
    });

    // Filtre de recherche basique visuel (pour la démo)
    const searchInput = document.querySelector('.search-input input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const txItems = document.querySelectorAll('.tx-item');
            
            txItems.forEach(tx => {
                const text = tx.textContent.toLowerCase();
                if (text.includes(term)) {
                    tx.style.display = 'flex';
                } else {
                    tx.style.display = 'none';
                }
            });
        });
    }

    // Toggle switch behavior logging (simuler une action)
    const switches = document.querySelectorAll('.switch input[type="checkbox"]');
    switches.forEach(switchEl => {
        switchEl.addEventListener('change', (e) => {
            const settingName = e.target.closest('.setting-item').querySelector('.setting-name').textContent;
            console.log(`Paramètre "${settingName}" modifié: ${e.target.checked ? 'Activé' : 'Désactivé'}`);
        });
    });

});
