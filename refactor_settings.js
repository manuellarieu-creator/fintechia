const fs = require('fs');

const html = fs.readFileSync('frontend/pages/app.html', 'utf8');

const startIdx = html.indexOf('<div id="view-settings"');
const endIdx = html.indexOf('<!-- SCRIPT SETTINGS -->');

if (startIdx === -1 || endIdx === -1) {
    console.log("Could not find boundaries");
    process.exit(1);
}

const newSettingsHTML = `
<div id="view-settings" class="nb-view" style="display:none; height:calc(100vh - 80px); padding: 0;">
  <div class="settings-layout-container" style="flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden;height:100%;background:#F8FAFC;border-radius:14px;border:0.5px solid #E2E8F0;margin:0 20px 20px 20px;">
    
    <!-- Sous-menu paramètres HORIZONTAL -->
    <div class="settings-tabs-menu" style="flex-shrink:0;background:#F8FAFC;border-bottom:0.5px solid #E2E8F0;padding:12px 16px;display:flex;align-items:center;gap:12px;overflow-x:auto;scrollbar-width:none;white-space:nowrap;-webkit-overflow-scrolling: touch;">
      <div class="tab-side act" onclick="switchSettingsTab(this, 'settings-tab-profil')"><i class="ti ti-user-circle"></i>Profil & identité</div>
      <div class="tab-side" onclick="switchSettingsTab(this, 'settings-tab-securite')"><i class="ti ti-shield-lock"></i>Sécurité</div>
      <div class="tab-side" onclick="switchSettingsTab(this, 'settings-tab-notifications')"><i class="ti ti-bell"></i>Notifications</div>
      <div class="tab-side" onclick="switchSettingsTab(this, 'settings-tab-cartes')"><i class="ti ti-credit-card"></i>Cartes & plafonds</div>
      <div class="tab-side" onclick="switchSettingsTab(this, 'settings-tab-virements')"><i class="ti ti-arrows-exchange"></i>Virements</div>
      <div class="tab-side" onclick="switchSettingsTab(this, 'settings-tab-apparence')"><i class="ti ti-palette"></i>Apparence</div>
      <div class="tab-side" onclick="switchSettingsTab(this, 'settings-tab-abonnement')"><i class="ti ti-file-invoice"></i>Abonnement</div>
      <div class="tab-side" onclick="switchSettingsTab(this, 'settings-tab-confidentialite')"><i class="ti ti-lock-access"></i>Confidentialité</div>
      
      <div style="margin-left:auto; display:flex; gap:12px;">
         <div class="tab-side" style="color:#B91C1C;" onclick="logout()"><i class="ti ti-logout" style="color:#B91C1C;"></i>Se déconnecter</div>
         <div class="tab-side" style="color:#B91C1C;border-color:#FECACA;background:#FEF2F2;" onclick="alert('Veuillez contacter le support pour procéder à la suppression de votre compte.')"><i class="ti ti-trash" style="color:#B91C1C;"></i>Supprimer le compte</div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="settings-content-area" style="flex:1;min-width:0;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;scrollbar-width:none;position:relative;">
      
      <!-- =============================== -->
      <!-- TAB: PROFIL & IDENTITE          -->
      <!-- =============================== -->
      <div id="settings-tab-profil" class="settings-tab-content active" style="display:flex; flex-direction:column; gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;" class="settings-header-flex">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0;">Profil & identité</h2>
            <p style="font-size:12px;color:#94A3B8;margin:3px 0 0;">Gérez vos informations personnelles et de contact</p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn-p" style="background:#F1F5F9;color:#475569;border:0.5px solid #E2E8F0;" onclick="switchSettingsTab(document.querySelector('.tab-side'), 'settings-tab-profil')">Annuler</button>
            <button class="btn-p" style="background:#2563EB;color:#fff;" onclick="saveSettingsMock('Profil mis à jour avec succès')"><i class="ti ti-device-floppy" style="font-size:14px;"></i>Enregistrer</button>
          </div>
        </div>

        <div class="settings-card">
          <div class="ch"><div><p class="ch-title">Informations personnelles</p><p class="ch-sub">Votre identité telle qu'elle apparaît sur votre compte</p></div></div>
          <div style="display:flex;gap:20px;align-items:flex-start; flex-wrap:wrap;">
            <!-- Avatar -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex-shrink:0;">
              <div style="width:72px;height:72px;border-radius:50%;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#1D4ED8;position:relative;border:3px solid #BFDBFE;">
                <span id="settings-avatar-initials">MR</span>
                <div style="position:absolute;bottom:0;right:0;width:22px;height:22px;background:#2563EB;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;cursor:pointer;">
                  <i class="ti ti-camera" style="font-size:10px;color:#fff;"></i>
                </div>
              </div>
              <button style="font-size:10px;color:#2563EB;background:none;border:none;cursor:pointer;font-weight:500;">Modifier</button>
            </div>
            <!-- Champs -->
            <div class="settings-grid-fields" style="flex:1;display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:10px;">
              <div class="field" style="margin:0;">
                <label>Prénom</label>
                <input value="Manuela" id="settings-prenom">
              </div>
              <div class="field" style="margin:0;">
                <label>Nom</label>
                <input value="Rodriguez" id="settings-nom">
              </div>
              <div class="field" style="margin:0;">
                <label>Date de naissance</label>
                <input value="14/03/1991" type="text" id="settings-dob" disabled style="background:#F8FAFC; color:#64748B;">
              </div>
              <div class="field" style="margin:0;">
                <label>Nationalité</label>
                <select><option>🇫🇷 Française</option><option>🇧🇪 Belge</option><option>🇨🇭 Suisse</option></select>
              </div>
              <div class="field" style="margin:0;grid-column:1/-1;">
                <label>Adresse</label>
                <input value="12 rue de la Paix, 75001 Paris" id="settings-adresse">
              </div>
            </div>
          </div>
        </div>

        <div class="settings-card">
            <div class="ch"><div><p class="ch-title">Contact</p><p class="ch-sub">Email et téléphone associés au compte</p></div></div>
            <div class="settings-grid-fields" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:14px;">
              <div class="field" style="margin:0;">
                <label>Adresse email</label>
                <input value="manuela@email.fr" type="email" id="settings-email">
              </div>
              <div class="field" style="margin:0;">
                <label>Téléphone</label>
                <div style="display:flex;gap:8px;">
                  <select style="width:80px;padding:9px 8px;border-radius:8px;border:1px solid #E2E8F0;background:#F8FAFC;font-size:12px;outline:none;flex-shrink:0;"><option>🇫🇷 +33</option><option>🇧🇪 +32</option></select>
                  <input value="6 12 34 56 78" style="flex:1;" id="settings-phone">
                </div>
              </div>
            </div>
        </div>
      </div>

      <!-- =============================== -->
      <!-- TAB: SÉCURITÉ                   -->
      <!-- =============================== -->
      <div id="settings-tab-securite" class="settings-tab-content" style="display:none; flex-direction:column; gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;" class="settings-header-flex">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0;">Sécurité</h2>
            <p style="font-size:12px;color:#94A3B8;margin:3px 0 0;">Protégez l'accès à votre compte</p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn-p" style="background:#2563EB;color:#fff;" onclick="saveSettingsMock('Paramètres de sécurité mis à jour')"><i class="ti ti-device-floppy" style="font-size:14px;"></i>Enregistrer</button>
          </div>
        </div>

        <div class="settings-grid-main" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:14px;">
            <div class="settings-card">
              <div class="ch"><div><p class="ch-title">Mot de passe</p><p class="ch-sub">Modifiez votre mot de passe de connexion</p></div></div>
              <div class="field">
                <label>Mot de passe actuel</label>
                <div style="position:relative;">
                  <input type="password" value="••••••••••" placeholder="Mot de passe actuel">
                </div>
              </div>
              <div class="field">
                <label>Nouveau mot de passe</label>
                <input type="password" placeholder="Nouveau mot de passe">
                <div style="display:flex;gap:4px;margin-top:4px;">
                  <div style="flex:1;height:3px;border-radius:2px;background:#16A34A;"></div>
                  <div style="flex:1;height:3px;border-radius:2px;background:#16A34A;"></div>
                  <div style="flex:1;height:3px;border-radius:2px;background:#16A34A;"></div>
                  <div style="flex:1;height:3px;border-radius:2px;background:#E2E8F0;"></div>
                </div>
                <span class="hint">Fort · Min. 8 caractères, 1 maj, 1 chiffre</span>
              </div>
              <div class="field" style="margin-bottom:14px;">
                <label>Confirmer le nouveau mot de passe</label>
                <input type="password" placeholder="Confirmer">
              </div>
              <button class="btn-p" style="width:100%;background:#F1F5F9;color:#0F172A;border:0.5px solid #E2E8F0;" onclick="saveSettingsMock('Mot de passe mis à jour')">Mettre à jour le mot de passe</button>
            </div>

            <div class="settings-card">
              <div class="ch"><div><p class="ch-title">Double authentification (2FA)</p><p class="ch-sub">Sécurité supplémentaire pour la connexion</p></div></div>
              
              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:12px;">
                <div style="display:flex;gap:12px;align-items:center;">
                  <i class="ti ti-device-mobile-message" style="font-size:20px;color:#2563EB;"></i>
                  <div><p style="font-size:13px;font-weight:600;color:#0F172A;margin:0;">SMS OTP</p><p style="font-size:11px;color:#64748B;margin:0;">Code envoyé au +33 6 ** ** ** 78</p></div>
                </div>
                <div class="tg on" onclick="this.classList.toggle('on')"><span></span></div>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:12px;">
                <div style="display:flex;gap:12px;align-items:center;">
                  <i class="ti ti-mail" style="font-size:20px;color:#2563EB;"></i>
                  <div><p style="font-size:13px;font-weight:600;color:#0F172A;margin:0;">Email OTP</p><p style="font-size:11px;color:#64748B;margin:0;">Code envoyé à manuela@...</p></div>
                </div>
                <div class="tg" onclick="this.classList.toggle('on')"><span></span></div>
              </div>
            </div>
        </div>
      </div>

      <!-- =============================== -->
      <!-- TAB: NOTIFICATIONS              -->
      <!-- =============================== -->
      <div id="settings-tab-notifications" class="settings-tab-content" style="display:none; flex-direction:column; gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;" class="settings-header-flex">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0;">Notifications</h2>
            <p style="font-size:12px;color:#94A3B8;margin:3px 0 0;">Contrôlez les alertes que vous recevez</p>
          </div>
          <button class="btn-p" style="background:#2563EB;color:#fff;" onclick="saveSettingsMock('Préférences de notifications enregistrées')"><i class="ti ti-device-floppy" style="font-size:14px;"></i>Enregistrer</button>
        </div>

        <div class="settings-card">
           <div class="ch"><div><p class="ch-title">Alertes de transaction</p><p class="ch-sub">Soyez notifié à chaque mouvement</p></div></div>
           
           <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E2E8F0;padding-bottom:12px;margin-bottom:12px;">
              <div><p style="font-size:14px;font-weight:600;margin:0;color:#0F172A;">Virements reçus</p><p style="font-size:12px;color:#64748B;margin:0;">Notification push & Email</p></div>
              <div class="tg on" onclick="this.classList.toggle('on')"><span></span></div>
           </div>
           <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E2E8F0;padding-bottom:12px;margin-bottom:12px;">
              <div><p style="font-size:14px;font-weight:600;margin:0;color:#0F172A;">Virements émis</p><p style="font-size:12px;color:#64748B;margin:0;">Notification push uniquement</p></div>
              <div class="tg on" onclick="this.classList.toggle('on')"><span></span></div>
           </div>
           <div style="display:flex;justify-content:space-between;align-items:center;">
              <div><p style="font-size:14px;font-weight:600;margin:0;color:#0F172A;">Paiements par carte refusés</p><p style="font-size:12px;color:#64748B;margin:0;">Alerte immédiate par SMS</p></div>
              <div class="tg on" onclick="this.classList.toggle('on')"><span></span></div>
           </div>
        </div>

        <div class="settings-card">
           <div class="ch"><div><p class="ch-title">Alertes de sécurité</p><p class="ch-sub">Surveillance de l'activité du compte</p></div></div>
           <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E2E8F0;padding-bottom:12px;margin-bottom:12px;">
              <div><p style="font-size:14px;font-weight:600;margin:0;color:#0F172A;">Nouvelles connexions</p><p style="font-size:12px;color:#64748B;margin:0;">Alerte sur les nouveaux appareils</p></div>
              <div class="tg on" onclick="this.classList.toggle('on')"><span></span></div>
           </div>
           <div style="display:flex;justify-content:space-between;align-items:center;">
              <div><p style="font-size:14px;font-weight:600;margin:0;color:#0F172A;">Changement de mot de passe</p><p style="font-size:12px;color:#64748B;margin:0;">Requis par défaut</p></div>
              <div class="tg on disabled" style="opacity:0.5; cursor:not-allowed;"><span></span></div>
           </div>
        </div>
      </div>

      <!-- =============================== -->
      <!-- TAB: CARTES & PLAFONDS          -->
      <!-- =============================== -->
      <div id="settings-tab-cartes" class="settings-tab-content" style="display:none; flex-direction:column; gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;" class="settings-header-flex">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0;">Cartes & plafonds</h2>
            <p style="font-size:12px;color:#94A3B8;margin:3px 0 0;">Gérez vos cartes bancaires et limites</p>
          </div>
          <button class="btn-p" style="background:#2563EB;color:#fff;" onclick="saveSettingsMock('Plafonds mis à jour avec succès')"><i class="ti ti-device-floppy" style="font-size:14px;"></i>Enregistrer</button>
        </div>

        <div class="settings-card">
          <div class="ch"><div><p class="ch-title">Ma Carte Fintechia</p><p class="ch-sub">Carte physique **** 1234</p></div></div>
          
          <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap; margin-bottom: 20px;">
            <div style="width:120px; height:80px; background:linear-gradient(135deg, #1E3A8A, #3B82F6); border-radius:10px; position:relative; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                <i class="ti ti-brand-mastercard" style="position:absolute; bottom:8px; right:8px; color:white; font-size:24px;"></i>
                <div style="position:absolute; top:8px; left:8px; width:16px; height:12px; background:#F59E0B; border-radius:2px;"></div>
            </div>
            <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center; margin-bottom:12px;">
                    <span style="font-size:14px;font-weight:600;color:#0F172A;">Paiement sans contact</span>
                    <div class="tg on" onclick="this.classList.toggle('on')"><span></span></div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center; margin-bottom:12px;">
                    <span style="font-size:14px;font-weight:600;color:#0F172A;">Paiements à l'étranger</span>
                    <div class="tg on" onclick="this.classList.toggle('on')"><span></span></div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:14px;font-weight:600;color:#B91C1C;">Bloquer la carte</span>
                    <div class="tg" onclick="this.classList.toggle('on')"><span></span></div>
                </div>
            </div>
          </div>

          <div style="border-top:1px solid #E2E8F0; padding-top:20px;">
            <p style="font-size:14px;font-weight:600;margin:0 0 12px 0;">Plafonds sur 30 jours</p>
            
            <div style="margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
                    <span>Paiements (1 200 € / 3 000 €)</span>
                    <span style="font-weight:600;">Modifiable</span>
                </div>
                <input type="range" min="500" max="5000" value="3000" style="width:100%;">
            </div>
            
            <div>
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
                    <span>Retraits (300 € / 1 000 €)</span>
                    <span style="font-weight:600;">Modifiable</span>
                </div>
                <input type="range" min="100" max="2000" value="1000" style="width:100%;">
            </div>
          </div>
        </div>
      </div>

      <!-- =============================== -->
      <!-- TAB: VIREMENTS                  -->
      <!-- =============================== -->
      <div id="settings-tab-virements" class="settings-tab-content" style="display:none; flex-direction:column; gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;" class="settings-header-flex">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0;">Virements</h2>
            <p style="font-size:12px;color:#94A3B8;margin:3px 0 0;">Gérez vos bénéficiaires et limites de transferts</p>
          </div>
          <button class="btn-p" style="background:#2563EB;color:#fff;" onclick="saveSettingsMock('Paramètres de virements mis à jour')"><i class="ti ti-device-floppy" style="font-size:14px;"></i>Enregistrer</button>
        </div>

        <div class="settings-card">
            <div class="ch"><div><p class="ch-title">Plafonds de virements</p><p class="ch-sub">Sécurité anti-fraude</p></div></div>
            <div class="field">
              <label>Plafond journalier (Virements SEPA)</label>
              <select style="width:100%;padding:10px;border-radius:8px;border:1px solid #E2E8F0;background:#F8FAFC;">
                  <option>1 000 €</option>
                  <option selected>5 000 €</option>
                  <option>10 000 €</option>
              </select>
            </div>
            <div class="field" style="margin-top:14px;">
              <label>Validation forte requise au-delà de</label>
              <select style="width:100%;padding:10px;border-radius:8px;border:1px solid #E2E8F0;background:#F8FAFC;">
                  <option>100 €</option>
                  <option selected>500 €</option>
                  <option>Toutes les transactions</option>
              </select>
            </div>
        </div>
      </div>

      <!-- =============================== -->
      <!-- TAB: APPARENCE                  -->
      <!-- =============================== -->
      <div id="settings-tab-apparence" class="settings-tab-content" style="display:none; flex-direction:column; gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;" class="settings-header-flex">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0;">Apparence</h2>
            <p style="font-size:12px;color:#94A3B8;margin:3px 0 0;">Personnalisez l'interface</p>
          </div>
          <button class="btn-p" style="background:#2563EB;color:#fff;" onclick="saveSettingsMock('Préférences d\\'apparence appliquées')"><i class="ti ti-device-floppy" style="font-size:14px;"></i>Enregistrer</button>
        </div>

        <div class="settings-card">
            <div class="ch"><div><p class="ch-title">Thème de l'application</p><p class="ch-sub">Mode clair ou sombre</p></div></div>
            <div style="display:flex; gap:16px;">
                <div style="flex:1; border:2px solid #2563EB; border-radius:12px; padding:16px; text-align:center; cursor:pointer; background:#F8FAFC;">
                    <i class="ti ti-sun" style="font-size:32px; color:#F59E0B; margin-bottom:8px;"></i>
                    <p style="margin:0; font-weight:600; font-size:14px;">Mode Clair</p>
                </div>
                <div style="flex:1; border:1px solid #E2E8F0; border-radius:12px; padding:16px; text-align:center; cursor:pointer; background:#1E293B;">
                    <i class="ti ti-moon" style="font-size:32px; color:#F8FAFC; margin-bottom:8px;"></i>
                    <p style="margin:0; font-weight:600; font-size:14px; color:#F8FAFC;">Mode Sombre</p>
                </div>
            </div>
        </div>
      </div>

      <!-- =============================== -->
      <!-- TAB: ABONNEMENT                 -->
      <!-- =============================== -->
      <div id="settings-tab-abonnement" class="settings-tab-content" style="display:none; flex-direction:column; gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;" class="settings-header-flex">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0;">Abonnement</h2>
            <p style="font-size:12px;color:#94A3B8;margin:3px 0 0;">Votre forfait actuel et factures</p>
          </div>
        </div>

        <div class="settings-card" style="background:linear-gradient(135deg, #F8FAFC, #EFF6FF); border-color:#BFDBFE;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                <div>
                    <span style="background:#2563EB; color:white; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700; text-transform:uppercase;">Plan Standard</span>
                    <h3 style="font-size:24px; font-weight:800; color:#0F172A; margin:8px 0 4px 0;">0,00 € / mois</h3>
                    <p style="font-size:13px; color:#64748B; margin:0;">Inclus toutes les opérations courantes</p>
                </div>
                <i class="ti ti-shield-check" style="font-size:36px; color:#2563EB;"></i>
            </div>
            
            <button class="btn-p" style="width:100%; background:white; color:#2563EB; border:1px solid #2563EB; font-weight:600;" onclick="alert('L\\'offre Premium sera bientôt disponible !')">Découvrir l'offre Premium</button>
        </div>
      </div>

      <!-- =============================== -->
      <!-- TAB: CONFIDENTIALITÉ            -->
      <!-- =============================== -->
      <div id="settings-tab-confidentialite" class="settings-tab-content" style="display:none; flex-direction:column; gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;" class="settings-header-flex">
          <div>
            <h2 style="font-size:18px;font-weight:700;color:#0F172A;margin:0;">Confidentialité</h2>
            <p style="font-size:12px;color:#94A3B8;margin:3px 0 0;">Contrôle de vos données</p>
          </div>
          <button class="btn-p" style="background:#2563EB;color:#fff;" onclick="saveSettingsMock('Préférences de confidentialité enregistrées')"><i class="ti ti-device-floppy" style="font-size:14px;"></i>Enregistrer</button>
        </div>

        <div class="settings-card">
           <div class="ch"><div><p class="ch-title">Utilisation des données</p><p class="ch-sub">Consentements RGPD</p></div></div>
           
           <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E2E8F0;padding-bottom:12px;margin-bottom:12px;">
              <div><p style="font-size:14px;font-weight:600;margin:0;color:#0F172A;">Offres personnalisées</p><p style="font-size:12px;color:#64748B;margin:0;">Autoriser l'analyse pour des offres ciblées</p></div>
              <div class="tg" onclick="this.classList.toggle('on')"><span></span></div>
           </div>
           <div style="display:flex;justify-content:space-between;align-items:center;">
              <div><p style="font-size:14px;font-weight:600;margin:0;color:#0F172A;">Partage avec des partenaires</p><p style="font-size:12px;color:#64748B;margin:0;">Services tiers</p></div>
              <div class="tg" onclick="this.classList.toggle('on')"><span></span></div>
           </div>
        </div>
      </div>

    </div>
  </div>
</div>
`;

const resHtml = html.substring(0, startIdx) + newSettingsHTML + html.substring(endIdx);
fs.writeFileSync('frontend/pages/app.html', resHtml);

// Inject logic
let jsLogic = `
<script>
function switchSettingsTab(el, targetId) {
  // Update active styling on the horizontal menu
  const tabsMenu = el.closest('.settings-tabs-menu');
  if (tabsMenu) {
      tabsMenu.querySelectorAll('.tab-side').forEach(t => t.classList.remove('act'));
      el.classList.add('act');
  }
  
  // Hide all contents and show target
  const container = document.querySelector('.settings-content-area');
  if (container) {
      container.querySelectorAll('.settings-tab-content').forEach(content => {
          content.style.display = 'none';
          content.classList.remove('active');
      });
      const target = document.getElementById(targetId);
      if (target) {
          target.style.display = 'flex';
          target.classList.add('active');
      }
  }
}

function saveSettingsMock(msg) {
    alert(msg || 'Paramètres enregistrés avec succès');
}
</script>
`;

let finalHtml = fs.readFileSync('frontend/pages/app.html', 'utf8');
const scriptIdx = finalHtml.indexOf('<!-- SCRIPT SETTINGS -->');
const endScriptIdx = finalHtml.indexOf('</script>', scriptIdx) + 9;
finalHtml = finalHtml.substring(0, scriptIdx) + '<!-- SCRIPT SETTINGS -->\n' + jsLogic + finalHtml.substring(endScriptIdx);

fs.writeFileSync('frontend/pages/app.html', finalHtml);

// Also add mobile CSS overrides for settings into responsive.css
let respCss = fs.readFileSync('frontend/assets/css/responsive.css', 'utf8');
const settingsCss = `
/* Settings Page Mobile Overrides */
@media (max-width: 768px) {
  #view-settings .settings-layout-container {
    margin: 0 !important;
    border-radius: 0 !important;
    border: none !important;
  }
  #view-settings .settings-tabs-menu {
    padding: 10px;
    gap: 8px;
  }
  #view-settings .settings-tabs-menu .tab-side {
    padding: 8px 12px;
    font-size: 13px;
  }
  #view-settings .settings-content-area {
    padding: 16px !important;
  }
  #view-settings .settings-header-flex {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }
  #view-settings .settings-header-flex button {
    width: 100%;
    justify-content: center;
  }
  #view-settings .settings-grid-fields {
    grid-template-columns: 1fr !important;
  }
  #view-settings .settings-grid-main {
    grid-template-columns: 1fr !important;
  }
  #view-settings {
    height: 100vh !important;
    padding-bottom: 80px !important; /* space for bottom nav */
  }
}
`;

if (!respCss.includes('Settings Page Mobile Overrides')) {
    respCss += settingsCss;
    fs.writeFileSync('frontend/assets/css/responsive.css', respCss);
}

console.log("Done refactoring settings");
