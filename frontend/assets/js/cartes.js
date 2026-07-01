async function loadCartes() {
  try {
    const cartes = await apiCall('/cartes');
    const container = document.getElementById('cartes-container');
    const containerMobile = document.getElementById('cartes-mobile-container');
    
    if(!container && !containerMobile) return;
    
    if(container) {
      // On fetch les transactions récentes pour cette carte (ou globales ici)
      const txs = await apiCall('/transactions?limit=5');
      const txsHtml = txs.map(tx => {
          const isCredit = parseFloat(tx.montant) > 0 && tx.type !== 'virement_emis';
          const date = new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          let libelle = tx.description || 'Transaction';
          if(tx.type === 'virement_recu') libelle = 'Virement reçu';
          if(tx.type === 'virement_emis') libelle = 'Virement émis';
          const sign = isCredit ? '+' : '';
          const color = isCredit ? 'var(--success)' : 'var(--text-main)';

          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border);">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:36px; height:36px; border-radius:8px; background:var(--bg-body); display:flex; align-items:center; justify-content:center;">
                   <i class="${isCredit ? 'ti ti-arrow-down-left' : 'ti ti-shopping-bag'}" style="color:${isCredit ? 'var(--success)' : 'var(--text-muted)'}"></i>
                </div>
                <div>
                  <div style="font-weight:600; font-size:14px;">${libelle}</div>
                  <div style="font-size:12px; color:var(--text-muted);">${date}</div>
                </div>
              </div>
              <div style="font-weight:bold; color:${color};">${sign}${parseFloat(tx.montant).toFixed(2)} €</div>
            </div>
          `;
      }).join('');

      container.innerHTML = cartes.map(c => `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 900px; margin: 0 auto; padding-top:20px;">
          <!-- Colonne Gauche -->
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <div class="nb-card" style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color:white; border-radius:16px; padding:25px; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2); margin-bottom:0;">
              <div style="display:flex; justify-content:space-between; margin-bottom:40px; align-items:center;">
                <h3 style="margin:0; font-size:20px;">NovaBanque</h3>
                <span style="font-size:12px; background:rgba(255,255,255,0.2); padding:4px 8px; border-radius:4px; font-weight:bold;">${c.bloquee ? '🔒 BLOQUÉE' : 'ACTIVE'}</span>
              </div>
              <div style="font-size:24px; letter-spacing:3px; margin-bottom:20px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                **** **** **** ${c.pan.slice(-4)}
              </div>
              <div style="display:flex; justify-content:space-between; font-size:14px; opacity:0.9;">
                <span>Titulaire<br><strong>${document.getElementById('user-prenom-desktop') ? document.getElementById('user-prenom-desktop').innerText : 'MANUELA'} R.</strong></span>
                <span>Exp: ${c.exp_date}</span>
              </div>
            </div>

            <div class="nb-card" style="padding: 20px;">
              <h3 style="margin-top:0; font-size:16px;">Actions rapides</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top:16px;">
                <button onclick="toggleCardBlock(${c.id}, ${c.bloquee})" class="nb-btn-outline" style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:15px 10px; border-color:${c.bloquee ? '#10B981' : '#E2E8F0'}; color:${c.bloquee ? '#10B981' : 'var(--text-main)'}">
                  <i class="ti ti-${c.bloquee ? 'lock-open' : 'lock'}" style="font-size:20px;"></i>
                  <span style="font-size:13px; font-weight:600;">${c.bloquee ? 'Débloquer' : 'Bloquer'}</span>
                </button>
                <button class="nb-btn-outline" style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:15px 10px;">
                  <i class="ti ti-eye" style="font-size:20px; color:var(--text-muted);"></i>
                  <span style="font-size:13px; font-weight:600;">Voir le code</span>
                </button>
                <button class="nb-btn-outline" style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:15px 10px;">
                  <i class="ti ti-refresh" style="font-size:20px; color:var(--text-muted);"></i>
                  <span style="font-size:13px; font-weight:600;">Renouveler</span>
                </button>
                <button class="nb-btn-outline" style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:15px 10px; color:var(--danger); border-color:transparent; background:#FEF2F2;">
                  <i class="ti ti-trash" style="font-size:20px;"></i>
                  <span style="font-size:13px; font-weight:600;">Résilier</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Colonne Droite -->
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <div class="nb-card" style="padding: 20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 style="margin:0; font-size:16px;">Plafonds</h3>
                <a href="#" style="color:var(--primary); font-size:13px; font-weight:600; text-decoration:none;">Modifier</a>
              </div>
              <div style="margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:8px;">
                  <span style="color:var(--text-muted); font-weight:500;">Paiement mensuel</span>
                  <strong>${(parseFloat(c.plafond)/2).toFixed(0)} / ${parseFloat(c.plafond).toFixed(0)} €</strong>
                </div>
                <div style="width:100%; height:6px; background:var(--bg-body); border-radius:3px; overflow:hidden;">
                  <div style="width:50%; height:100%; background:var(--primary);"></div>
                </div>
              </div>
              <div style="margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:8px;">
                  <span style="color:var(--text-muted); font-weight:500;">Retrait hebdomadaire</span>
                  <strong>100 / 500 €</strong>
                </div>
                <div style="width:100%; height:6px; background:var(--bg-body); border-radius:3px; overflow:hidden;">
                  <div style="width:20%; height:100%; background:var(--warning);"></div>
                </div>
              </div>
            </div>

            <div class="nb-card" style="padding: 20px;">
              <h3 style="margin-top:0; font-size:16px; margin-bottom:16px;">Paramètres</h3>
              
              <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border);">
                <div>
                  <div style="font-weight:600; font-size:14px;">Paiement sans contact</div>
                  <div style="font-size:12px; color:var(--text-muted);">NFC activé</div>
                </div>
                <label class="switch"><input type="checkbox" checked><span class="slider round"></span></label>
              </div>
              
              <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border);">
                <div>
                  <div style="font-weight:600; font-size:14px;">Paiements en ligne</div>
                  <div style="font-size:12px; color:var(--text-muted);">E-commerce & abonnements</div>
                </div>
                <label class="switch"><input type="checkbox" checked><span class="slider round"></span></label>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0;">
                <div>
                  <div style="font-weight:600; font-size:14px;">Paiements à l'étranger</div>
                  <div style="font-size:12px; color:var(--text-muted);">Hors zone euro</div>
                </div>
                <label class="switch"><input type="checkbox"><span class="slider round"></span></label>
              </div>
            </div>
          </div>

          <!-- Ligne du bas: Transactions -->
          <div style="grid-column: 1 / span 2;">
            <div class="nb-card" style="padding: 20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 style="margin:0; font-size:16px;">Transactions récentes</h3>
                <a href="#" style="color:var(--primary); font-size:13px; font-weight:600; text-decoration:none;">Voir tout &rarr;</a>
              </div>
              <div>
                ${txsHtml || '<div style="padding:20px; text-align:center; color:var(--text-muted);">Aucune transaction récente</div>'}
              </div>
            </div>
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
