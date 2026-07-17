async function loadCartes() {
  try {
    const cartes = await apiCall('/cartes');
    const container = document.getElementById('cartes-container');
    const containerMobile = document.getElementById('cartes-mobile-container');
    
    if(!container && !containerMobile) return;
    
    let txsHtml = '';
    try {
      const txs = await apiCall('/transactions?limit=5');
      txsHtml = txs.map(tx => {
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
    } catch(e) {
      console.warn('Could not fetch txs for cartes', e);
    }

    if(cartes.length === 0) {
      const pulseStyle = `<style>@keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 0.8; } }</style>`;
      const emptyDesktopHtml = pulseStyle + `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; height: 100%; min-height: 60vh;">
          <div style="position: relative; width: 300px; height: 180px; border-radius: 16px; background: linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(30,58,138,0.1) 100%); border: 1px solid rgba(37,99,235,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 30px; box-shadow: 0 10px 40px -10px rgba(37,99,235,0.2); backdrop-filter: blur(10px); overflow: hidden;">
            <div style="position: absolute; top: -50px; left: -50px; width: 120px; height: 120px; background: rgba(37,99,235,0.3); filter: blur(40px); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -50px; right: -50px; width: 120px; height: 120px; background: rgba(16,185,129,0.15); filter: blur(40px); border-radius: 50%;"></div>
            <i class="ti ti-credit-card" style="font-size: 48px; color: var(--primary); opacity: 0.8; animation: pulse 2s infinite ease-in-out;"></i>
            <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; display: flex; justify-content: space-between; align-items: center; opacity: 0.5;">
               <div style="width: 40px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 4px;"></div>
               <div style="width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,0.2);"></div>
            </div>
          </div>
          <h2 style="font-size: 24px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;">Création de carte en cours</h2>
          <p style="font-size: 15px; color: var(--text-muted); max-width: 420px; line-height: 1.6;">Notre équipe finalise la configuration de votre nouvelle carte de paiement Fintechia. Vous y aurez accès dès sa validation.</p>
        </div>
      `;

      const emptyMobileHtml = pulseStyle + `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; height: calc(100vh - 200px);">
          <div style="position: relative; width: 260px; height: 160px; border-radius: 14px; background: linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(30,58,138,0.1) 100%); border: 1px solid rgba(37,99,235,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 24px; box-shadow: 0 10px 30px -10px rgba(37,99,235,0.2); overflow: hidden;">
            <div style="position: absolute; top: -30px; left: -30px; width: 80px; height: 80px; background: rgba(37,99,235,0.2); filter: blur(30px); border-radius: 50%;"></div>
            <i class="ti ti-credit-card" style="font-size: 40px; color: var(--primary); opacity: 0.8; animation: pulse 2s infinite ease-in-out;"></i>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 10px;">Carte en préparation</h2>
          <p style="font-size: 14px; color: var(--text-muted); line-height: 1.5; max-width: 280px;">Votre carte de paiement est en cours d'émission par notre équipe. Merci de patienter.</p>
        </div>
      `;

      if(container) container.innerHTML = emptyDesktopHtml;
      if(containerMobile) containerMobile.innerHTML = emptyMobileHtml;
      return;
    }

    if(container) {
      container.innerHTML = cartes.map(c => `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 900px; margin: 0 auto; padding-top:20px;">
          <!-- Colonne Gauche -->
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <div class="nb-card" style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); color:white; border-radius:16px; padding:25px; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2); margin-bottom:0;">
              <div style="display:flex; justify-content:space-between; margin-bottom:40px; align-items:center;">
                <h3 style="margin:0; font-size:20px;">Fintechia</h3>
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
      const tabs = cartes.map((c, i) => `<div class="card-tab ${i === 0 ? 'active' : ''}">${c.type === 'CLASSIC' ? 'Classic' : 'Platinum'} **** ${c.pan.slice(-4)}</div>`).join('');
      
      containerMobile.innerHTML = `
        <div class="card-tabs">${tabs}</div>
        ${cartes.map((c, i) => `
        <div class="card-view" style="display: ${i === 0 ? 'block' : 'none'};">
            <!-- Visual Card -->
            <div class="credit-card">
                <div class="cc-bank">Fintechia</div>
                <div class="cc-badge">${c.bloquee ? 'BLOQUÉE' : 'ACTIVE'}</div>
            </div>

            <!-- Quick Actions -->
            <div class="c-section">
                <h2 class="c-section-title" style="margin-bottom: 16px;">Actions rapides</h2>
                <div class="actions-grid">
                    <div class="action-item" onclick="toggleCardBlock(${c.id}, ${c.bloquee})">
                        <div class="action-icon"><i class="ti ti-${c.bloquee ? 'lock-open' : 'lock'}" style="color:${c.bloquee ? 'var(--success)' : 'inherit'}"></i></div>
                        <span class="action-label">${c.bloquee ? 'Débloquer' : 'Bloquer'}</span>
                    </div>
                    <div class="action-item">
                        <div class="action-icon"><i class="ti ti-eye"></i></div>
                        <span class="action-label">Code PIN</span>
                    </div>
                    <div class="action-item">
                        <div class="action-icon"><i class="ti ti-refresh"></i></div>
                        <span class="action-label">Renouveler</span>
                    </div>
                    <div class="action-item">
                        <div class="action-icon"><i class="ti ti-trash"></i></div>
                        <span class="action-label" style="font-weight: 700; color: var(--text-primary);">Résilier</span>
                    </div>
                </div>
            </div>

            <!-- Plafonds -->
            <div class="c-section">
                <div class="c-section-header">
                    <h2 class="c-section-title">Plafonds</h2>
                    <a href="#" class="c-section-link">Modifier</a>
                </div>
                
                <div class="limit-item">
                    <div class="limit-header">
                        <span class="limit-name">Paiement mensuel</span>
                        <span class="limit-value">${(parseFloat(c.plafond)/2).toFixed(0)} / ${parseFloat(c.plafond).toFixed(0)} €</span>
                    </div>
                    <div class="limit-bar-bg">
                        <div class="limit-bar-fill blue" style="width: 46%;"></div>
                    </div>
                    <div class="limit-subtext">${(parseFloat(c.plafond)/2).toFixed(0)} € disponibles</div>
                </div>

                <div class="limit-item">
                    <div class="limit-header">
                        <span class="limit-name">Retrait hebdomadaire</span>
                        <span class="limit-value">400 / 500 €</span>
                    </div>
                    <div class="limit-bar-bg">
                        <div class="limit-bar-fill orange" style="width: 80%;"></div>
                    </div>
                    <div class="limit-subtext">100 € restants · Réinit. lundi</div>
                </div>

                <div class="limit-item">
                    <div class="limit-header">
                        <span class="limit-name">Sans contact</span>
                        <span class="limit-value">87 / 150 €</span>
                    </div>
                    <div class="limit-bar-bg">
                        <div class="limit-bar-fill green" style="width: 58%;"></div>
                    </div>
                    <div class="limit-subtext">63 € disponibles</div>
                </div>

                <div class="limit-item">
                    <div class="limit-header">
                        <span class="limit-name">Paiement en ligne</span>
                        <span class="limit-value">760 / 3 000 €</span>
                    </div>
                    <div class="limit-bar-bg">
                        <div class="limit-bar-fill blue" style="width: 25%;"></div>
                    </div>
                    <div class="limit-subtext">2 240 € disponibles</div>
                </div>
            </div>

            <!-- Paramètres -->
            <div class="c-section">
                <h2 class="c-section-title" style="margin-bottom: 20px;">Paramètres</h2>
                
                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-name">Paiement sans contact</span>
                        <span class="setting-desc">NFC activé</span>
                    </div>
                    <label class="c-switch"><input type="checkbox" checked><span class="c-slider"></span></label>
                </div>

                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-name">Paiements en ligne</span>
                        <span class="setting-desc">E-commerce & abonnements</span>
                    </div>
                    <label class="c-switch"><input type="checkbox" checked><span class="c-slider"></span></label>
                </div>

                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-name">Paiements à l'étranger</span>
                        <span class="setting-desc">Hors zone euro</span>
                    </div>
                    <label class="c-switch"><input type="checkbox"><span class="c-slider"></span></label>
                </div>

                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-name">Retraits DAB</span>
                        <span class="setting-desc">Distributeurs automatiques</span>
                    </div>
                    <label class="c-switch"><input type="checkbox" checked><span class="c-slider"></span></label>
                </div>

                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-name">Notifications de paiement</span>
                        <span class="setting-desc">Alertes temps réel</span>
                    </div>
                    <label class="c-switch"><input type="checkbox" checked><span class="c-slider"></span></label>
                </div>
            </div>

            <!-- Transactions récentes -->
            <div class="c-section">
                <div class="c-section-header">
                    <h2 class="c-section-title">Transactions récentes</h2>
                    <a href="#" class="c-section-link">Voir tout <i class="ti ti-arrow-right" style="font-size: 0.8rem; margin-left: 4px;"></i></a>
                </div>
                <div>
                   ${txsHtml || '<div style="padding:20px; text-align:center; color:var(--text-muted);">Aucune transaction récente</div>'}
                </div>
            </div>

            <!-- Informations carte -->
            <div class="c-section">
                <h2 class="c-section-title" style="margin-bottom: 12px;">Informations carte</h2>
                <div class="info-row">
                    <span class="info-label">Type</span>
                    <span class="info-value">Visa ${c.type === 'CLASSIC' ? 'Classic' : 'Platinum'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Réseau</span>
                    <span class="info-value">Visa International</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Expiration</span>
                    <span class="info-value">${c.exp_date}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Statut</span>
                    <span class="info-value">${c.bloquee ? 'Bloquée' : 'Active'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cotisation</span>
                    <span class="info-value">12,00 € / mois</span>
                </div>
            </div>
        </div>
        `).join('')}
      `;
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
