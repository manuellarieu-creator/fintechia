async function loadCartes() {
  try {
    const cartes = await apiCall('/cartes');
    const container = document.getElementById('cartes-container');
    const containerMobile = document.getElementById('cartes-mobile-container');
    
    if(!container && !containerMobile) return;
    
    if(container) {
      container.innerHTML = cartes.map(c => `
        <div class="nb-card" style="max-width:400px; margin:0 auto 20px; background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color:white; border-radius:16px; padding:25px; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2);">
          <div style="display:flex; justify-content:space-between; margin-bottom:40px; align-items:center;">
            <h3 style="margin:0; font-size:20px;">NovaBanque</h3>
            <span style="font-size:12px; background:rgba(255,255,255,0.2); padding:4px 8px; border-radius:4px;">${c.bloquee ? '🔒 BLOQUÉE' : '✅ ACTIVE'}</span>
          </div>
          <div style="font-size:24px; letter-spacing:3px; margin-bottom:20px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
            **** **** **** ${c.pan.slice(-4)}
          </div>
          <div style="display:flex; justify-content:space-between; font-size:14px; opacity:0.9;">
            <span>Exp: ${c.exp_date}</span>
            <span>CVV: ***</span>
          </div>
        </div>
        
        <div class="nb-card" style="max-width:400px; margin:0 auto;">
          <h3 style="margin-top:0;">Paramètres de la carte</h3>
          <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #E2E8F0;">
            <span style="color:#64748B;">Plafond de paiement</span>
            <b style="color:#0F172A; font-size:16px;">${parseFloat(c.plafond).toFixed(2).replace('.',',')} €</b>
          </div>
          <div style="padding:15px 0 0 0;">
            <button onclick="toggleCardBlock(${c.id}, ${c.bloquee})" class="nb-btn-primary" style="width:100%; background:${c.bloquee ? '#10B981' : '#EF4444'}; border:none;">
              ${c.bloquee ? 'Débloquer la carte' : 'Bloquer temporairement'}
            </button>
          </div>
        </div>
      `).join('');
    }

    if(containerMobile) {
      containerMobile.innerHTML = cartes.map(c => `
        <div class="bank-card">
          <div class="bank-card-head">
            <span class="bank-card-type">NovaBanque ${c.bloquee ? '(BLOQUÉE)' : ''}</span>
            <i class="ti ti-credit-card" style="font-size:20px;opacity:.75;"></i>
          </div>
          <div class="bank-card-num">**** **** **** ${c.pan.slice(-4)}</div>
          <div class="bank-card-foot">
            <span>Exp: ${c.exp_date}</span>
            <span>Plafond: ${parseFloat(c.plafond).toFixed(0)}€</span>
          </div>
          <div class="bank-card-actions">
            <button class="bc-btn" onclick="toggleCardBlock(${c.id}, ${c.bloquee})" style="background:${c.bloquee ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.15)'}">
              ${c.bloquee ? 'Débloquer' : 'Bloquer'}
            </button>
            <button class="bc-btn">Plafonds</button>
          </div>
        </div>
      `).join('');
    }
    
  } catch(err) {
    console.error(err);
  }
}

async function toggleCardBlock(id, currentState) {
  try {
    await apiCall(`/cartes/${id}/toggle-block`, 'PATCH', { bloquee: !currentState });
    loadCartes();
  } catch(err) {
    alert('Erreur modification statut carte');
  }
}
