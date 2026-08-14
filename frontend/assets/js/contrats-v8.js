// ===== Contrats Logic — Modale split-view avec aperçu temps réel =====

(function() {
  'use strict';

  // État du contrat en cours
  let currentStep = 1;
  let currentType = 'personnel';
  let currentCreditData = {};
  let contratFormData = {};
  const TOTAL_STEPS = 4;

  // ===== Configuration des étapes par type de contrat =====
  const CONTRAT_STEPS = {
    // Les étapes sont les mêmes pour tous les types, le contenu du contrat change
    steps: [
      { id: 1, label: 'Identité', icon: 'ti-user' },
      { id: 2, label: 'Conditions', icon: 'ti-file-text' },
      { id: 3, label: 'Clauses', icon: 'ti-shield-check' },
      { id: 4, label: 'Signature', icon: 'ti-writing' }
    ]
  };

  // ===== Templates de contrat par type =====
  function getContratTitle(type) {
    const titles = {
      personnel: 'Contrat de Prêt Personnel',
      consommation: 'Contrat de Crédit à la Consommation',
      immobilier: 'Contrat de Crédit Immobilier',
      grands_projets: 'Contrat de Financement de Grands Projets'
    };
    return titles[type] || 'Contrat de Crédit';
  }

  // ===== Génération OTP =====
  window.sendContratOtp = async function(btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-loader rotate"></i> Envoi...';
    btn.disabled = true;
    try {
      const res = await window.apiCall('/auth/otp/send', 'POST', {});
      if (res && res.success) {
        alert('Le code de sécurité a été envoyé à votre adresse email.');
      } else {
        alert('Erreur lors de l\'envoi du code OTP.');
      }
    } catch(err) {
      alert('Erreur réseau lors de l\'envoi du code OTP.');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  };

  // ===== Génération du formulaire par étape =====
  function generateStepForm(step, type) {
    switch(step) {
      case 1: return generateStep1Form(type);
      case 2: return generateStep2Form(type);
      case 3: return generateStep3Form(type);
      case 4: return generateStep4Form(type);
      default: return '';
    }
  }

  // Étape 1 : Identité de l'emprunteur
  function generateStep1Form(type) {
    return `
      <div class="contrat-step-content">
        <h3 class="contrat-section-title">Identité de l'emprunteur</h3>
        <div class="contrat-info-box">
          <i class="ti ti-info-circle"></i>
          <span>Les informations saisies seront intégrées au contrat. Assurez-vous qu'elles correspondent à vos pièces d'identité.</span>
        </div>
        
        <div class="contrat-row">
          <div class="contrat-field-group">
            <label>Civilité</label>
            <select class="contrat-select" id="contrat-civilite" onchange="updateContratField('civilite', this.value)">
              <option value="">Sélectionner</option>
              <option value="M.">Monsieur</option>
              <option value="Mme">Madame</option>
            </select>
          </div>
          <div class="contrat-field-group">
            <label>Nationalité</label>
            <input type="text" class="contrat-input" id="contrat-nationalite" placeholder="Ex: Française" oninput="updateContratField('nationalite', this.value)">
          </div>
        </div>

        <div class="contrat-row">
          <div class="contrat-field-group">
            <label>Nom de naissance</label>
            <input type="text" class="contrat-input" id="contrat-nom" placeholder="Nom" oninput="updateContratField('nom', this.value)">
          </div>
          <div class="contrat-field-group">
            <label>Prénom(s)</label>
            <input type="text" class="contrat-input" id="contrat-prenom" placeholder="Prénom(s)" oninput="updateContratField('prenom', this.value)">
          </div>
        </div>

        <div class="contrat-row">
          <div class="contrat-field-group">
            <label>Date de naissance</label>
            <input type="date" class="contrat-input" id="contrat-date-naissance" onchange="updateContratField('dateNaissance', this.value)">
          </div>
          <div class="contrat-field-group">
            <label>Lieu de naissance</label>
            <input type="text" class="contrat-input" id="contrat-lieu-naissance" placeholder="Ville, Pays" oninput="updateContratField('lieuNaissance', this.value)">
          </div>
        </div>

        <div class="contrat-field-group">
          <label>Adresse complète</label>
          <input type="text" class="contrat-input" id="contrat-adresse" placeholder="Numéro, rue, code postal, ville" oninput="updateContratField('adresse', this.value)">
        </div>

        <div class="contrat-row">
          <div class="contrat-field-group">
            <label>Téléphone</label>
            <input type="tel" class="contrat-input" id="contrat-telephone" placeholder="+33 6 XX XX XX XX" oninput="updateContratField('telephone', this.value)">
          </div>
          <div class="contrat-field-group">
            <label>Email</label>
            <input type="email" class="contrat-input" id="contrat-email" placeholder="email@exemple.com" oninput="updateContratField('email', this.value)">
          </div>
        </div>

        <div class="contrat-row">
          <div class="contrat-field-group">
            <label>Pièce d'identité (type)</label>
            <select class="contrat-select" id="contrat-id-type" onchange="updateContratField('idType', this.value)">
              <option value="">Sélectionner</option>
              <option value="CNI">Carte nationale d'identité</option>
              <option value="Passeport">Passeport</option>
              <option value="Titre de séjour">Titre de séjour</option>
            </select>
          </div>
          <div class="contrat-field-group">
            <label>Numéro de pièce d'identité</label>
            <input type="text" class="contrat-input" id="contrat-id-numero" placeholder="N° du document" oninput="updateContratField('idNumero', this.value)">
          </div>
        </div>

        ${type === 'immobilier' || type === 'grands_projets' ? `
        <h3 class="contrat-section-title" style="margin-top:24px;">Situation professionnelle</h3>
        <div class="contrat-row">
          <div class="contrat-field-group">
            <label>Profession</label>
            <input type="text" class="contrat-input" id="contrat-profession" placeholder="Intitulé du poste" oninput="updateContratField('profession', this.value)">
          </div>
          <div class="contrat-field-group">
            <label>Employeur / Société</label>
            <input type="text" class="contrat-input" id="contrat-employeur" placeholder="Nom de l'entreprise" oninput="updateContratField('employeur', this.value)">
          </div>
        </div>
        <div class="contrat-row">
          <div class="contrat-field-group">
            <label>Revenu mensuel net</label>
            <input type="number" class="contrat-input" id="contrat-revenu" placeholder="En euros" oninput="updateContratField('revenu', this.value)">
          </div>
          <div class="contrat-field-group">
            <label>Ancienneté (années)</label>
            <input type="number" class="contrat-input" id="contrat-anciennete" placeholder="Années" oninput="updateContratField('anciennete', this.value)">
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  // Étape 2 : Conditions financières
  function generateStep2Form(type) {
    const config = window.CREDIT_CONFIG[type];
    const montant = currentCreditData.montant || 0;
    const duree = currentCreditData.duree || 0;
    const taux = window.getCreditRate(type, montant);
    const mensualite = window.computeMonthlyPayment(montant, taux, duree);
    const totalRemboursement = mensualite * duree;
    const coutTotal = totalRemboursement - montant;

    // Calculer la date de première échéance (mois suivant)
    const now = new Date();
    const firstPayment = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    const firstPaymentStr = firstPayment.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    return `
      <div class="contrat-step-content">
        <h3 class="contrat-section-title">Conditions financières du ${getContratTitle(type).toLowerCase()}</h3>
        
        <div class="contrat-info-box">
          <i class="ti ti-calculator"></i>
          <span>Les conditions ci-dessous sont calculées automatiquement à partir de votre simulation. Vérifiez-les attentivement.</span>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:20px; margin-bottom:20px;">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div>
              <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Montant emprunté</div>
              <div style="font-size:20px; font-weight:700; color:#1C2436;">${formatMoney(montant)}</div>
            </div>
            <div>
              <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Durée</div>
              <div style="font-size:20px; font-weight:700; color:#1C2436;">${duree} mois</div>
            </div>
            <div>
              <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">TAEG fixe</div>
              <div style="font-size:20px; font-weight:700; color:#2563EB;">${(taux * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Mensualité</div>
              <div style="font-size:20px; font-weight:700; color:#059669;">${formatMoney(mensualite)}</div>
            </div>
          </div>
          <div style="margin-top:16px; padding-top:16px; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between;">
            <div>
              <div style="font-size:11px; color:#64748b;">Total remboursement</div>
              <div style="font-size:16px; font-weight:600; color:#1C2436;">${formatMoney(totalRemboursement)}</div>
            </div>
            <div>
              <div style="font-size:11px; color:#64748b;">Coût total du crédit</div>
              <div style="font-size:16px; font-weight:600; color:#EF4444;">${formatMoney(coutTotal)}</div>
            </div>
          </div>
        </div>

        <div class="contrat-field-group">
          <label>Objet détaillé du financement</label>
          <textarea class="contrat-input" id="contrat-objet" rows="3" placeholder="${getObjetPlaceholder(type)}" oninput="updateContratField('objet', this.value)" style="resize:vertical;"></textarea>
          <div class="field-hint">Décrivez brièvement l'objet de votre demande de financement</div>
        </div>

        ${type === 'consommation' ? `
        <h3 class="contrat-section-title" style="margin-top:24px;">Détails de l'achat</h3>
        <div class="contrat-row">
          <div class="contrat-field-group">
            <label>Catégorie d'achat</label>
            <select class="contrat-select" id="contrat-type-achat" onchange="updateContratField('typeAchat', this.value)">
              <option value="">Sélectionner</option>
              <option value="Véhicule (Auto/Moto)">Véhicule (Auto/Moto)</option>
              <option value="Équipement / Mobilier">Équipement / Mobilier</option>
              <option value="Travaux / Rénovation">Travaux / Rénovation</option>
              <option value="Voyage / Loisirs">Voyage / Loisirs</option>
              <option value="Événement (Mariage, etc.)">Événement (Mariage, etc.)</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div class="contrat-field-group">
            <label>Vendeur / Prestataire (Optionnel)</label>
            <input type="text" class="contrat-input" id="contrat-fournisseur" placeholder="Ex: Concessionnaire, Magasin..." oninput="updateContratField('fournisseur', this.value)">
          </div>
        </div>
        ` : ''}

        ${type === 'immobilier' ? `
        <h3 class="contrat-section-title" style="margin-top:24px;">Bien immobilier</h3>
        <div class="contrat-field-group">
          <label>Adresse du bien</label>
          <input type="text" class="contrat-input" id="contrat-adresse-bien" placeholder="Adresse complète du bien immobilier" oninput="updateContratField('adresseBien', this.value)">
        </div>
        <div class="contrat-row">
          <div class="contrat-field-group">
            <label>Type de bien</label>
            <select class="contrat-select" id="contrat-type-bien" onchange="updateContratField('typeBien', this.value)">
              <option value="">Sélectionner</option>
              <option value="Appartement">Appartement</option>
              <option value="Maison">Maison</option>
              <option value="Terrain">Terrain</option>
              <option value="Local commercial">Local commercial</option>
            </select>
          </div>
          <div class="contrat-field-group">
            <label>Surface (m²)</label>
            <input type="number" class="contrat-input" id="contrat-surface" placeholder="Surface" oninput="updateContratField('surface', this.value)">
          </div>
        </div>
        ` : ''}

        ${type === 'grands_projets' ? `
        <h3 class="contrat-section-title" style="margin-top:24px;">Détails du projet</h3>
        <div class="contrat-field-group">
          <label>Nom du projet</label>
          <input type="text" class="contrat-input" id="contrat-nom-projet" placeholder="Nom ou référence du projet" oninput="updateContratField('nomProjet', this.value)">
        </div>
        <div class="contrat-field-group">
          <label>Description détaillée du projet</label>
          <textarea class="contrat-input" id="contrat-desc-projet" rows="3" placeholder="Nature du projet, secteur d'activité, objectifs..." oninput="updateContratField('descProjet', this.value)" style="resize:vertical;"></textarea>
        </div>
        <div class="contrat-row">
          <div class="contrat-field-group">
            <label>Secteur d'activité</label>
            <input type="text" class="contrat-input" id="contrat-secteur" placeholder="Ex: Industrie, Tech..." oninput="updateContratField('secteur', this.value)">
          </div>
          <div class="contrat-field-group">
            <label>Date de début prévue</label>
            <input type="date" class="contrat-input" id="contrat-date-debut" onchange="updateContratField('dateDebut', this.value)">
          </div>
        </div>
        ` : ''}

        <div class="contrat-field-group" style="margin-top:16px;">
          <label>Mode de remboursement</label>
          <select class="contrat-select" id="contrat-mode-remboursement" onchange="updateContratField('modeRemboursement', this.value); document.getElementById('iban-container').style.display = this.value === 'prelevement' ? 'block' : 'none'; document.getElementById('virement-container').style.display = this.value === 'virement' ? 'block' : 'none';">
            <option value="prelevement" selected>Prélèvement automatique (recommandé)</option>
            <option value="virement">Virement mensuel</option>
          </select>
        </div>

        <div id="iban-container" class="contrat-field-group">
          <label>IBAN de prélèvement</label>
          <input type="text" class="contrat-input" id="contrat-iban" placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" oninput="updateContratField('iban', this.value)" style="font-family:monospace; letter-spacing:1px;">
          <div class="field-hint">Compte sur lequel les mensualités seront prélevées</div>
        </div>

        <div id="virement-container" class="contrat-field-group" style="display:none;">
          <label>IBAN Fintechia pour vos virements</label>
          <div class="contrat-input" style="font-family:monospace; letter-spacing:1px; background:#F8FAFC; color:#64748B; cursor:default; user-select:all; display:flex; align-items:center;">${window.currentUserAccount ? window.currentUserAccount.iban : 'IBAN non disponible'}</div>
          <div class="field-hint">Veuillez mettre en place un virement permanent vers ce compte avant chaque échéance</div>
        </div>
      </div>
    `;
  }

  // Étape 3 : Clauses et conditions
  function generateStep3Form(type) {
    return `
      <div class="contrat-step-content">
        <h3 class="contrat-section-title">Clauses et conditions générales</h3>
        
        <div class="contrat-info-box" style="background:#FEF3C7; border-color:#FDE68A; color:#92400E;">
          <i class="ti ti-alert-triangle"></i>
          <span>Lisez attentivement les clauses ci-dessous avant de valider. Elles constituent les termes du contrat.</span>
        </div>

        <div style="background:#fff; border:1px solid #E2E8F0; border-radius:10px; padding:20px; margin-bottom:20px; max-height:300px; overflow-y:auto; font-size:13px; line-height:1.8; color:#475569;">
          ${getClausesContent(type)}
        </div>

        <div style="margin-top:20px;">
          <label class="contrat-checkbox-wrapper">
            <input type="checkbox" id="contrat-accept-clauses" onchange="updateContratField('acceptClauses', this.checked)">
            <span>J'ai lu et j'accepte les clauses et conditions générales du ${getContratTitle(type).toLowerCase()}</span>
          </label>

          <label class="contrat-checkbox-wrapper">
            <input type="checkbox" id="contrat-accept-taeg" onchange="updateContratField('acceptTaeg', this.checked)">
            <span>Je reconnais avoir pris connaissance du TAEG appliqué et du coût total du crédit</span>
          </label>

          <label class="contrat-checkbox-wrapper">
            <input type="checkbox" id="contrat-accept-retractation" onchange="updateContratField('acceptRetractation', this.checked)">
            <span>Je reconnais disposer d'un délai de rétractation de 14 jours à compter de la signature du contrat</span>
          </label>

          ${type === 'immobilier' ? `
          <label class="contrat-checkbox-wrapper">
            <input type="checkbox" id="contrat-accept-assurance" onchange="updateContratField('acceptAssurance', this.checked)">
            <span>Je reconnais avoir été informé de la possibilité de souscrire une assurance emprunteur</span>
          </label>
          ` : ''}

          ${type === 'grands_projets' ? `
          <label class="contrat-checkbox-wrapper">
            <input type="checkbox" id="contrat-accept-garantie" onchange="updateContratField('acceptGarantie', this.checked)">
            <span>Je m'engage à fournir les garanties requises pour le financement du projet</span>
          </label>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Étape 4 : Signature
  function generateStep4Form(type) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const mode = contratFormData.modeSignature || 'electronique';
    const isElec = mode === 'electronique';

    return `
      <div class="contrat-step-content">
        <h3 class="contrat-section-title">Signature du contrat</h3>
        
        <div class="contrat-info-box" style="background:#F0FDF4; border-color:#BBF7D0; color:#166534;">
          <i class="ti ti-shield-check"></i>
          <span>En signant ce contrat, vous vous engagez aux conditions décrites. Vous disposez d'un délai de rétractation de 14 jours.</span>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:20px; margin-bottom:20px;">
          <h4 style="margin:0 0 16px; font-size:14px; color:#1C2436;">Récapitulatif</h4>
          <div class="contrat-doc-field">
            <span class="label">Type de contrat</span>
            <span class="value">${getContratTitle(type)}</span>
          </div>
          <div class="contrat-doc-field">
            <span class="label">Emprunteur</span>
            <span class="value">${contratFormData.civilite || ''} ${contratFormData.prenom || ''} ${contratFormData.nom || ''}</span>
          </div>
          <div class="contrat-doc-field">
            <span class="label">Montant</span>
            <span class="value">${formatMoney(currentCreditData.montant)}</span>
          </div>
          <div class="contrat-doc-field">
            <span class="label">Durée</span>
            <span class="value">${currentCreditData.duree} mois</span>
          </div>
          <div class="contrat-doc-field">
            <span class="label">Mensualité</span>
            <span class="value">${formatMoney(window.computeMonthlyPayment(currentCreditData.montant, window.getCreditRate(type, currentCreditData.montant), currentCreditData.duree))}</span>
          </div>
          <div class="contrat-doc-field">
            <span class="label">Référence</span>
            <span class="value" style="font-family:monospace;">${currentCreditData.reference || '-'}</span>
          </div>
        </div>

        <div class="contrat-field-group">
          <label>Lieu de signature</label>
          <input type="text" class="contrat-input" id="contrat-lieu-signature" value="${contratFormData.lieuSignature || ''}" placeholder="Ville" oninput="updateContratField('lieuSignature', this.value)">
        </div>

        <div class="contrat-field-group">
          <label>Mode de signature</label>
          <select class="contrat-select" id="contrat-mode-signature" onchange="window.onChangeModeSignature(this.value)">
            <option value="electronique" ${isElec ? 'selected' : ''}>Signature électronique (Recommandé)</option>
            <option value="imprimer" ${!isElec ? 'selected' : ''}>Imprimer le contrat pour le signer</option>
          </select>
        </div>

        <div id="signature-electronique-ui" style="display: ${isElec ? 'block' : 'none'};">
          <div class="contrat-info-box" style="background:#EFF6FF; border-color:#BFDBFE; color:#1E3A8A;">
            <i class="ti ti-shield-lock"></i>
            <span>Pour signer électroniquement ce contrat valant signature physique, veuillez vous authentifier.</span>
          </div>
          
          <div class="contrat-field-group">
            <label>Code PIN (6 chiffres)</label>
            <input type="password" class="contrat-input" id="contrat-pin" placeholder="Votre code secret" maxlength="6" oninput="updateContratField('pinCode', this.value)" style="letter-spacing:4px; font-weight:700;">
          </div>
          
          <div class="contrat-field-group">
            <label>Code de validation Email</label>
            <div style="display:flex; gap:8px;">
              <input type="text" class="contrat-input" id="contrat-email-code" placeholder="Code à 6 chiffres" maxlength="6" oninput="updateContratField('emailCode', this.value)" style="letter-spacing:2px; font-weight:700;">
              <button class="btn-outline" style="padding:0 12px; font-size:12px; border-radius:6px; cursor:pointer; background:white; min-width:140px;" onclick="event.preventDefault(); window.sendContratOtp(this);">Recevoir le code</button>
            </div>
          </div>

          <label class="contrat-checkbox-wrapper" style="margin-top:16px;">
            <input type="checkbox" id="contrat-signature-finale" onchange="updateContratField('signatureFinale', this.checked)" ${contratFormData.signatureFinale ? 'checked' : ''}>
            <span style="font-weight:600;">Je confirme ma signature électronique de ce contrat et m'engage aux conditions décrites.</span>
          </label>
        </div>

        <div id="signature-impression-ui" style="display: ${!isElec ? 'block' : 'none'}; margin-top:16px;">
          <div class="contrat-info-box" style="background:#FEF2F2; border-color:#EF4444; color:#B91C1C;">
            <i class="ti ti-printer"></i>
            <span>Veuillez imprimer le contrat généré, le signer manuellement et nous le retourner par la messagerie sécurisée.</span>
          </div>
          <label class="contrat-checkbox-wrapper" style="margin-top:16px; border: 1px solid #EF4444; padding: 12px; border-radius: 8px; background: #FEF2F2;">
            <input type="checkbox" id="contrat-signature-finale-imprimer" onchange="updateContratField('signatureFinale', this.checked); document.getElementById('contrat-signature-finale').checked = this.checked;">
            <span style="font-weight:600; color: #B91C1C;">Je confirme mon intention d'imprimer et de signer manuellement ce contrat.</span>
          </label>
        </div>
      </div>
    `;
  }

  // ===== Contenu des clauses selon le type =====
  function getClausesContent(type) {
    const commonClauses = `
      <p><strong>Article 1 — Objet du contrat</strong></p>
      <p>Le présent contrat a pour objet de définir les conditions dans lesquelles FINTECHIA (ci-après « le Prêteur ») 
      consent à l'Emprunteur un ${getContratTitle(type).toLowerCase()} aux conditions définies dans le présent contrat.</p>
      
      <p><strong>Article 2 — Remboursement</strong></p>
      <p>L'Emprunteur s'engage à rembourser le prêt selon les mensualités et la durée convenues. 
      Les prélèvements seront effectués le 5 de chaque mois sur le compte bancaire désigné.</p>
      
      <p><strong>Article 3 — Taux d'intérêt</strong></p>
      <p>Le taux annuel effectif global (TAEG) est fixe et déterminé au moment de la souscription. 
      Il intègre l'ensemble des frais liés au crédit.</p>
      
      <p><strong>Article 4 — Remboursement anticipé</strong></p>
      <p>L'Emprunteur peut rembourser par anticipation tout ou partie du capital restant dû, 
      sans indemnité de remboursement anticipé.</p>
      
      <p><strong>Article 5 — Défaut de paiement</strong></p>
      <p>En cas de défaut de paiement, le Prêteur se réserve le droit d'appliquer des pénalités de retard 
      et, après mise en demeure restée sans effet, d'exiger le remboursement immédiat du capital restant dû.</p>
      
      <p><strong>Article 6 — Délai de rétractation</strong></p>
      <p>Conformément à la réglementation en vigueur, l'Emprunteur dispose d'un délai de 14 jours calendaires 
      à compter de la signature pour se rétracter sans motif.</p>
    `;

    const specificClauses = {
      personnel: `
        <p><strong>Article 7 — Conditions spécifiques au prêt personnel</strong></p>
        <p>Le prêt personnel est accordé sans obligation de justification d'utilisation des fonds. 
        L'Emprunteur est libre d'utiliser le montant emprunté pour tout usage personnel.</p>
      `,
      consommation: `
        <p><strong>Article 7 — Conditions spécifiques au crédit à la consommation</strong></p>
        <p>Le crédit à la consommation est soumis aux dispositions du Code de la consommation. 
        L'Emprunteur s'engage à utiliser les fonds pour les besoins de consommation personnelle décrits dans l'objet du contrat.</p>
      `,
      immobilier: `
        <p><strong>Article 7 — Garantie hypothécaire</strong></p>
        <p>Le crédit immobilier est garanti par une hypothèque de premier rang sur le bien financé. 
        L'Emprunteur s'engage à maintenir le bien en bon état et à l'assurer contre les risques courants.</p>
        
        <p><strong>Article 8 — Assurance emprunteur</strong></p>
        <p>L'Emprunteur a la possibilité de souscrire une assurance emprunteur couvrant les risques de décès, 
        d'invalidité et de perte d'emploi. Cette assurance peut être souscrite auprès de l'organisme de son choix.</p>
        
        <p><strong>Article 9 — Condition suspensive</strong></p>
        <p>Le présent contrat est conclu sous la condition suspensive de la réalisation de la vente immobilière 
        dans un délai de 4 mois à compter de la signature.</p>
      `,
      grands_projets: `
        <p><strong>Article 7 — Garanties du projet</strong></p>
        <p>Le financement est accordé sous réserve de la fourniture des garanties convenues : 
        caution personnelle, nantissement de parts sociales, ou garantie bancaire à première demande.</p>
        
        <p><strong>Article 8 — Suivi du projet</strong></p>
        <p>L'Emprunteur s'engage à fournir au Prêteur un reporting trimestriel sur l'avancement du projet 
        et la situation financière. Le non-respect de cette obligation constitue un cas de défaut.</p>
        
        <p><strong>Article 9 — Déblocage des fonds</strong></p>
        <p>Les fonds pourront être débloqués en une ou plusieurs tranches, selon un calendrier convenu 
        entre les parties et conditionné à l'avancement du projet.</p>
      `
    };

    return commonClauses + (specificClauses[type] || '');
  }

  // ===== Placeholder pour l'objet du financement =====
  function getObjetPlaceholder(type) {
    const placeholders = {
      personnel: "Ex: Travaux de rénovation, achat véhicule, projet personnel...",
      consommation: "Ex: Achat d'équipement, voyage, formation...",
      immobilier: "Ex: Acquisition résidence principale, investissement locatif...",
      grands_projets: "Ex: Construction d'infrastructure, expansion commerciale..."
    };
    return placeholders[type] || "Décrivez l'objet du financement";
  }

  // ===== Formatage monétaire =====
  function formatMoney(n) {
    if (isNaN(n)) return '0 €';
    return Math.round(n).toLocaleString((typeof window.getCurrentLocale === 'function' ? window.getCurrentLocale() : 'fr-FR')) + ' €';
  }

  // ===== Mise à jour d'un champ =====
  window.updateContratField = function(field, value) {
    contratFormData[field] = value;
    if (currentCreditData && currentCreditData.id) {
      localStorage.setItem('contrat_draft_' + currentCreditData.id, JSON.stringify(contratFormData));
    }
    updateContratPreview();
    updateSignButtonState();
  };

  // ===== Changement du mode de signature =====
  window.onChangeModeSignature = function(value) {
    try {
      window.updateContratField('modeSignature', value);
      
      const elecUi = document.getElementById('signature-electronique-ui');
      const imprUi = document.getElementById('signature-impression-ui');
      
      if (elecUi) elecUi.style.display = value === 'electronique' ? 'block' : 'none';
      if (imprUi) imprUi.style.display = value === 'imprimer' ? 'block' : 'none';
      
      updateSignButtonState();
    } catch(e) {
      console.error('Erreur onChangeModeSignature:', e);
    }
  };

  // ===== Mise à jour de l'aperçu du contrat =====
  window.updateContratPreview = function() {
    const previewBody = document.getElementById('contrat-preview-content');
    if (!previewBody) return;

    const type = currentType;
    const montant = currentCreditData.montant || 0;
    const duree = currentCreditData.duree || 0;
    const taux = window.getCreditRate(type, montant);
    const mensualite = window.computeMonthlyPayment(montant, taux, duree);
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    const coutTotal = (mensualite * duree) - montant;
    const montantTotalDu = mensualite * duree;

    // Calcul des dates d'échéance
    const dateDecaissement = new Date();
    dateDecaissement.setDate(dateDecaissement.getDate() + 14); // Décaissement après rétractation
    const dateDecaissementStr = dateDecaissement.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const premiereEcheance = new Date(dateDecaissement.getFullYear(), dateDecaissement.getMonth() + 1, 5);
    const premiereEcheanceStr = premiereEcheance.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    const derniereEcheance = new Date(premiereEcheance.getFullYear(), premiereEcheance.getMonth() + duree - 1, 5);
    const derniereEcheanceStr = derniereEcheance.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    const refDemande = currentCreditData.reference || 'N/A';
    const refContrat = 'CTR-' + (currentCreditData.reference ? currentCreditData.reference.split('-')[1] : 'XXXX');

    const field = (key, placeholder) => {
      const val = contratFormData[key];
      if (val && val.toString().trim()) {
        return `<span class="contrat-doc-filled">${val}</span>`;
      }
      return `<span class="contrat-doc-placeholder">${placeholder}</span>`;
    };

    // Génération de l'échéancier indicatif
    let echeancierRows = '';
    let capitalRestant = montant;
    let currentEcheanceDate = new Date(premiereEcheance);
    let mensualiteCourante = mensualite;
    
    // Si la durée est très longue, on limite l'affichage pour l'aperçu afin de ne pas saturer le navigateur
    const maxRowsToDisplay = duree > 12 ? 12 : duree; 
    let sumCapital = 0;
    
    for (let i = 1; i <= maxRowsToDisplay; i++) {
        let interetsEcheance = capitalRestant * (taux / 12);
        let capitalEcheance = mensualiteCourante - interetsEcheance;
        if (i === duree) {
            capitalEcheance = capitalRestant;
            mensualiteCourante = capitalEcheance + interetsEcheance;
        }
        capitalRestant -= capitalEcheance;
        if (capitalRestant < 0) capitalRestant = 0;
        sumCapital += capitalEcheance;
        
        let dateStrLoop = currentEcheanceDate.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
        
        echeancierRows += `<tr>
            <td style="padding:6px; border:1px solid #E2E8F0; text-align:center;">${i}</td>
            <td style="padding:6px; border:1px solid #E2E8F0; text-align:center;">${dateStrLoop}</td>
            <td style="padding:6px; border:1px solid #E2E8F0; text-align:right;">${formatMoney(capitalEcheance)}</td>
            <td style="padding:6px; border:1px solid #E2E8F0; text-align:right;">${formatMoney(interetsEcheance)}</td>
            <td style="padding:6px; border:1px solid #E2E8F0; text-align:right;">0,00 €</td>
            <td style="padding:6px; border:1px solid #E2E8F0; text-align:right; font-weight:600;">${formatMoney(mensualiteCourante)}</td>
            <td style="padding:6px; border:1px solid #E2E8F0; text-align:right;">${formatMoney(capitalRestant)}</td>
        </tr>`;
        
        currentEcheanceDate.setMonth(currentEcheanceDate.getMonth() + 1);
    }
    
    if (duree > 12) {
        echeancierRows += `<tr>
            <td colspan="7" style="padding:8px; border:1px solid #E2E8F0; text-align:center; background:#F8FAFC; color:#64748B; font-style:italic;">
                ... (${duree - 12} échéances masquées dans l'aperçu) ...
            </td>
        </tr>`;
    }

    let contratHtml = '';

    if (type === 'personnel' || type === 'consommation' || type === 'immobilier' || type === 'grands_projets') {
      // Structure unifiée basée sur le modèle demandé par l'utilisateur
      const title = type === 'personnel' ? 'CONTRAT DE PRÊT PERSONNEL' : getContratTitle(type).toUpperCase();
      
      contratHtml = `
      <div class="contrat-document">
        <div style="text-align:center; margin-bottom:40px;">
          <h2 style="font-size:18px; font-weight:800; color:#1C2436; margin-bottom:24px; letter-spacing:1px;">${title}</h2>
          <div style="text-align:left; font-size:12px; color:#475569; background:#F8FAFC; padding:16px; border-radius:8px; border:1px solid #E2E8F0;">
            <div style="margin-bottom:8px;"><strong>Référence de la demande :</strong> ${refDemande}</div>
            <div style="margin-bottom:8px;"><strong>Référence du contrat :</strong> ${refContrat}</div>
            <div><strong>Date de génération :</strong> ${dateStr}</div>
          </div>
        </div>

        <div class="contrat-doc-section">
          <h4>PRÉAMBULE</h4>
          <p>Le présent contrat de ${type === 'personnel' ? 'prêt personnel' : type.replace('_', ' ')} (« le Contrat ») est conclu entre :</p>
          
          <div style="margin-top:16px; margin-bottom:16px; padding-left:16px; border-left:3px solid #E2E8F0;">
            <p style="font-weight:700; margin-bottom:8px; color:#1C2436;">Le Prêteur</p>
            <p><strong>FINTECHIA SAS</strong></p>
            <p>Société constituée selon le droit français</p>
            <p>Siège social : 15 Avenue des Champs-Élysées, 75008 Paris, France</p>
            <p>Numéro d'enregistrement : 892 456 123 R.C.S. Paris</p>
            <p>Représentée par : La Direction Générale</p>
            <p style="margin-top:8px;"><em>Ci-après dénommée « le Prêteur »,</em></p>
          </div>

          <p style="text-align:center; font-weight:700; margin:16px 0;">et</p>

          <div style="margin-top:16px; margin-bottom:16px; padding-left:16px; border-left:3px solid #2563EB;">
            <p style="font-weight:700; margin-bottom:8px; color:#1C2436;">L'Emprunteur</p>
            <p><strong>${field('civilite', '')} ${field('prenom', 'Prénom')} ${field('nom', 'Nom')}</strong></p>
            <p>Date de naissance : ${field('dateNaissance', 'JJ/MM/AAAA')}</p>
            <p>Adresse : ${field('adresse', 'Adresse complète')}</p>
            <p>Nationalité : ${field('nationalite', 'Pays')}</p>
            <p>Téléphone : ${field('telephone', 'Numéro de téléphone')}</p>
            <p>Document d'identité : ${field('idType', 'Type')} – ${field('idNumero', 'Numéro')}</p>
            <p style="margin-top:8px;"><em>Ci-après dénommé « l'Emprunteur ».</em></p>
          </div>

          <p>Le Prêteur et l'Emprunteur sont ensemble désignés « les Parties ».</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 1 – OBJET DU CONTRAT</h4>
          <p>Le présent Contrat a pour objet de définir les conditions dans lesquelles le Prêteur met à la disposition de l'Emprunteur une somme d'argent à titre de ${type === 'personnel' ? 'prêt personnel' : type.replace('_', ' ')}, à charge pour ce dernier de rembourser le capital, les intérêts et, le cas échéant, les frais contractuellement applicables selon les modalités prévues au présent Contrat et à son échéancier.</p>
          <p>Le prêt est accordé conformément à la décision prise à la suite de l'analyse de la demande de financement enregistrée sous la référence :</p>
          <p style="text-align:center; font-weight:700; font-family:monospace; font-size:14px; margin:12px 0;">${refDemande}</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 2 – CARACTÉRISTIQUES DU PRÊT</h4>
          <p>Les caractéristiques financières approuvées sont les suivantes :</p>
          
          <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:12px; border:1px solid #E2E8F0;">
            <tbody>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; width:45%; font-weight:600;">Type de crédit</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${getContratTitle(type)}</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Référence de la demande</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${refDemande}</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Référence du contrat</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${refContrat}</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Montant approuvé</td><td style="padding:8px 12px; border:1px solid #E2E8F0; font-weight:700;">${formatMoney(montant)}</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Durée</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${duree} mois</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">TAEG</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${(taux * 100).toFixed(2)} %</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Taux nominal</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${(taux * 100).toFixed(2)} %</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Nombre d'échéances</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${duree}</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Périodicité</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">Mensuelle</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Montant de l'échéance</td><td style="padding:8px 12px; border:1px solid #E2E8F0; font-weight:700; color:#059669;">${formatMoney(mensualite)}</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Coût total du crédit</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${formatMoney(coutTotal)}</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Montant total dû</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${formatMoney(montantTotalDu)}</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Date prévue de décaissement</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${dateDecaissementStr}</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Première échéance</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${premiereEcheanceStr}</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; font-weight:600;">Dernière échéance</td><td style="padding:8px 12px; border:1px solid #E2E8F0;">${derniereEcheanceStr}</td></tr>
            </tbody>
          </table>
          <p style="font-size:11px; color:#64748B;">Les paramètres financiers définitifs sont ceux validés par le Prêteur et enregistrés dans le dossier de crédit.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 3 – MONTANT DU PRÊT</h4>
          <p>Le Prêteur consent à l'Emprunteur un prêt d'un montant de :</p>
          <p style="text-align:center; font-weight:700; font-size:16px; margin:16px 0; color:#1C2436; padding:12px; border:2px solid #E2E8F0; border-radius:8px;">${formatMoney(montant)}</p>
          <p>Le montant effectivement décaissé correspond au montant contractuellement approuvé, sous réserve des éventuelles déductions expressément prévues et autorisées par la réglementation applicable.</p>
          <p>Le montant approuvé ne peut être modifié dans le contrat par l'Emprunteur.</p>
          <p>Toute modification du montant avant signature doit être effectuée dans le dossier de crédit et entraîner, le cas échéant, une nouvelle génération du présent Contrat.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 4 – DESTINATION DU PRÊT</h4>
          <p>Le prêt est accordé pour un usage déclaré par l'Emprunteur.</p>
          <p>Objet déclaré du financement :</p>
          <div style="padding:12px; background:#F8FAFC; border-left:3px solid #2563EB; margin:12px 0;">
            ${contratFormData.objet ? `<strong>${contratFormData.objet}</strong>` : '<span class="contrat-doc-placeholder">À compléter dans le formulaire (étape 2)</span>'}
          </div>
          ${type === 'consommation' ? `
          <p>Détails de l'achat :</p>
          <div style="padding:12px; background:#F8FAFC; border-left:3px solid #2563EB; margin:12px 0;">
            <p style="margin:0 0 4px 0;"><strong>Catégorie d'achat :</strong> ${field('typeAchat', 'À préciser')}</p>
            <p style="margin:0;"><strong>Vendeur / Prestataire :</strong> ${field('fournisseur', 'Non spécifié')}</p>
          </div>
          ` : ''}
          ${type === 'immobilier' ? `
          <p>Détails du bien immobilier concerné :</p>
          <div style="padding:12px; background:#F8FAFC; border-left:3px solid #2563EB; margin:12px 0;">
            <p style="margin:0 0 4px 0;"><strong>Adresse :</strong> ${field('adresseBien', 'À compléter')}</p>
            <p style="margin:0 0 4px 0;"><strong>Type de bien :</strong> ${field('typeBien', 'À compléter')}</p>
            <p style="margin:0;"><strong>Surface :</strong> ${field('surface', '0')} m²</p>
          </div>
          ` : ''}
          ${type === 'grands_projets' ? `
          <p>Détails du projet concerné :</p>
          <div style="padding:12px; background:#F8FAFC; border-left:3px solid #2563EB; margin:12px 0;">
            <p style="margin:0 0 4px 0;"><strong>Nom du projet :</strong> ${field('nomProjet', 'À compléter')}</p>
            <p style="margin:0 0 4px 0;"><strong>Secteur d'activité :</strong> ${field('secteur', 'À compléter')}</p>
            <p style="margin:0 0 4px 0;"><strong>Date de début prévue :</strong> ${field('dateDebut', 'À compléter')}</p>
            <p style="margin:0;"><strong>Description :</strong> ${field('descProjet', 'À compléter')}</p>
          </div>
          ` : ''}
          <p>L'Emprunteur déclare que les informations relatives à la destination du financement sont exactes.</p>
          <p>Lorsque le Prêteur a conditionné l'octroi du crédit à une destination déterminée, l'Emprunteur s'engage à respecter cette destination.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 5 – DURÉE DU PRÊT</h4>
          <p>Le prêt est conclu pour une durée de :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">${duree} mois</p>
          <p>La durée prend effet à compter de :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">${dateDecaissementStr}</p>
          <p>La date prévue de dernière échéance est :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">${derniereEcheanceStr}</p>
          <p>La durée définitive est celle approuvée par le Prêteur et enregistrée dans le dossier de crédit.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 6 – TAUX D'INTÉRÊT</h4>
          <p>Le taux applicable au prêt est fixé à :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">${(taux * 100).toFixed(2)} %</p>
          <p>Le taux annuel effectif global (TAEG), lorsqu'il est applicable au produit et calculé conformément aux règles applicables, est :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">${(taux * 100).toFixed(2)} %</p>
          <p>Les modalités de calcul des intérêts sont :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; font-size:12px;">
            Mensualisation avec amortissement constant du capital et intérêts dégressifs calculés sur le capital restant dû à chaque échéance.
          </div>
          <p>Le système informatique devra calculer et afficher les paramètres financiers conformément aux règles juridiques et réglementaires applicables au produit.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 7 – FRAIS ET COMMISSIONS</h4>
          <p>Les frais applicables au prêt sont les suivants :</p>
          <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:12px; border:1px solid #E2E8F0;">
            <tbody>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC; width:60%;">Frais de dossier</td><td style="padding:8px 12px; border:1px solid #E2E8F0; text-align:right;">0,00 €</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC;">Frais administratifs</td><td style="padding:8px 12px; border:1px solid #E2E8F0; text-align:right;">0,00 €</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC;">Assurance éventuelle</td><td style="padding:8px 12px; border:1px solid #E2E8F0; text-align:right;">0,00 €</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F8FAFC;">Autres frais autorisés</td><td style="padding:8px 12px; border:1px solid #E2E8F0; text-align:right;">0,00 €</td></tr>
              <tr><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F1F5F9; font-weight:700;">Total des frais</td><td style="padding:8px 12px; border:1px solid #E2E8F0; background:#F1F5F9; font-weight:700; text-align:right;">0,00 €</td></tr>
            </tbody>
          </table>
          <p>Aucun frais autre que ceux expressément prévus dans les documents contractuels applicables ne peut être facturé à l'Emprunteur, sous réserve des dispositions légales impératives.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 8 – COÛT TOTAL DU CRÉDIT</h4>
          <p>Le coût total du crédit pour l'Emprunteur est estimé/calculé à :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">${formatMoney(coutTotal)}</p>
          <p>Le montant total dû par l'Emprunteur est de :</p>
          <p style="text-align:center; font-weight:700; font-size:16px; color:#059669; margin:12px 0;">${formatMoney(montantTotalDu)}</p>
          <p>Les montants définitifs doivent être générés automatiquement à partir des paramètres contractuels validés.</p>
          <p>Le système doit assurer la cohérence entre :</p>
          <ul style="margin:8px 0 16px 20px; color:#475569;">
            <li>le montant du prêt ;</li>
            <li>le taux ;</li>
            <li>la durée ;</li>
            <li>les frais ;</li>
            <li>le nombre d'échéances ;</li>
            <li>le montant des échéances ;</li>
            <li>le coût total ;</li>
            <li>le montant total dû.</li>
          </ul>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 9 – DÉCAISSEMENT</h4>
          <p>Sous réserve de la satisfaction des conditions préalables prévues au présent Contrat, le Prêteur procède ou fait procéder au décaissement du montant du crédit.</p>
          <p>Le décaissement est effectué sur le compte bancaire FINTECHIA de l'emprunteur :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px;">
            <p style="margin:0 0 4px 0;"><strong>Compte bénéficiaire :</strong> ${contratFormData.iban ? contratFormData.iban : '<span class="contrat-doc-placeholder">Compte FINTECHIA (défini par l\'admin)</span>'}</p>
            <p style="margin:0;"><strong>Titulaire du compte :</strong> ${field('civilite', '')} ${field('prenom', 'Prénom')} ${field('nom', 'Nom')}</p>
          </div>
          <p>Le compte bénéficiaire de l'emprunteur étant domicilié chez nous, aucune autre vérification ne sera requise après mise à disposition du montant du crédit sur le compte de l'emprunteur.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 10 – MODALITÉS DE REMBOURSEMENT</h4>
          <p>L'Emprunteur s'engage à rembourser le prêt conformément à l'échéancier annexé au présent Contrat.</p>
          <p>Le remboursement est effectué selon la périodicité suivante :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">Mensuelle</p>
          <p>Le nombre total d'échéances est :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">${duree}</p>
          <p>Le montant indicatif ou contractuel de chaque échéance est :</p>
          <p style="text-align:center; font-weight:700; font-size:16px; color:#059669; margin:12px 0;">${formatMoney(mensualite)}</p>
          <p>Les dates et montants définitifs figurent dans l'échéancier contractuel.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 11 – ÉCHÉANCIER</h4>
          <p>L'échéancier fait partie intégrante du présent Contrat.</p>
          <p>Il indique notamment : le numéro de l'échéance ; la date d'échéance ; la part de capital ; la part d'intérêts ; les frais éventuels ; le montant total ; le solde restant dû.</p>
          
          <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:11px; border:1px solid #E2E8F0;">
            <thead>
              <tr style="background:#F1F5F9;">
                <th style="padding:8px 4px; border:1px solid #E2E8F0; text-align:center;">N°</th>
                <th style="padding:8px 4px; border:1px solid #E2E8F0; text-align:center;">Date</th>
                <th style="padding:8px 4px; border:1px solid #E2E8F0; text-align:right;">Capital</th>
                <th style="padding:8px 4px; border:1px solid #E2E8F0; text-align:right;">Intérêts</th>
                <th style="padding:8px 4px; border:1px solid #E2E8F0; text-align:right;">Frais</th>
                <th style="padding:8px 4px; border:1px solid #E2E8F0; text-align:right;">Total dû</th>
                <th style="padding:8px 4px; border:1px solid #E2E8F0; text-align:right;">Solde</th>
              </tr>
            </thead>
            <tbody>
              ${echeancierRows}
            </tbody>
          </table>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 12 – MODE DE REMBOURSEMENT</h4>
          <p>Les remboursements sont effectués par :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">${contratFormData.modeRemboursement === 'virement' ? 'Virement mensuel' : 'Prélèvement automatique'}</p>
          <p>Compte ou moyen de paiement utilisé :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; text-align:center; font-family:monospace; font-size:14px;">
            ${contratFormData.iban ? contratFormData.iban : '<span class="contrat-doc-placeholder">Compte défini par l\'admin</span>'}
          </div>
          <p>Les modalités techniques de réception et d'imputation des paiements sont déterminées conformément aux procédures du Prêteur.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 14 – OBLIGATIONS DE L'EMPRUNTEUR</h4>
          <p>L'Emprunteur s'engage à :</p>
          <ul style="margin:8px 0 16px 20px; color:#475569;">
            <li>fournir des informations exactes et complètes ;</li>
            <li>fournir les documents nécessaires à l'instruction et à l'exécution du crédit ;</li>
            <li>informer le Prêteur de toute modification substantielle de ses informations lorsque celle-ci est pertinente pour le contrat ;</li>
            <li>respecter l'échéancier ;</li>
            <li>régler les sommes dues aux dates convenues ;</li>
            <li>utiliser le crédit conformément à sa destination déclarée lorsqu'une telle destination est contractuellement imposée ;</li>
            <li>ne pas fournir de documents falsifiés ;</li>
            <li>ne pas utiliser le financement à des fins illicites ;</li>
            <li>respecter les obligations prévues dans le présent Contrat.</li>
          </ul>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 15 – DÉCLARATIONS DE L'EMPRUNTEUR</h4>
          <p>L'Emprunteur déclare :</p>
          <ul style="margin:8px 0 16px 20px; color:#475569;">
            <li>être la personne identifiée dans le présent Contrat ;</li>
            <li>être juridiquement capable de contracter ;</li>
            <li>avoir fourni des informations exactes ;</li>
            <li>avoir pris connaissance des conditions du prêt ;</li>
            <li>avoir pu consulter les documents contractuels avant leur acceptation ;</li>
            <li>comprendre le montant du financement ;</li>
            <li>comprendre la durée du prêt ;</li>
            <li>comprendre le taux et le coût du crédit ;</li>
            <li>comprendre les modalités de remboursement.</li>
          </ul>
          <p>L'Emprunteur reconnaît que toute déclaration substantiellement fausse ou trompeuse peut avoir des conséquences contractuelles et juridiques.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 16 – VÉRIFICATION ET CONTRÔLES</h4>
          <p>Le Prêteur peut effectuer ou faire effectuer les vérifications nécessaires à l'étude, à la conclusion et à l'exécution du contrat.</p>
          <p>Ces vérifications peuvent notamment porter sur : l'identité ; l'adresse ; la situation financière ; les justificatifs fournis ; la capacité de remboursement ; la prévention de la fraude ; les obligations réglementaires applicables.</p>
          <p>Le Prêteur peut demander des documents complémentaires lorsque cela est nécessaire.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 17 – CAPACITÉ DE REMBOURSEMENT</h4>
          <p>Avant la conclusion définitive du crédit, le Prêteur effectue les contrôles requis afin d'évaluer la capacité de l'Emprunteur à respecter ses obligations financières, lorsque ces contrôles sont imposés par la législation applicable.</p>
          <p>Les informations fournies par l'Emprunteur doivent être sincères, complètes et vérifiables.</p>
          <p>Lorsque la réglementation applicable impose un examen spécifique de la capacité de contracter un crédit, celui-ci doit être réalisé conformément aux prescriptions en vigueur.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 18 – GARANTIES</h4>
          <p>Le prêt est :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">${type === 'personnel' ? 'Sans garantie' : '<span class="contrat-doc-placeholder">À définir</span>'}</p>
          <p>Le cas échéant, la garantie est décrite comme suit :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; font-size:13px;">
            <p style="margin:0 0 4px 0;"><strong>Valeur ou montant garanti :</strong> ${type === 'personnel' ? 'Néant' : '<span class="contrat-doc-placeholder">N/A</span>'}</p>
            <p style="margin:0;"><strong>Date de constitution :</strong> ${type === 'personnel' ? 'Néant' : '<span class="contrat-doc-placeholder">N/A</span>'}</p>
          </div>
          <p>Lorsque la garantie fait l'objet d'un acte distinct, celui-ci est annexé au présent Contrat ou référencé dans celui-ci.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 19 – ASSURANCE</h4>
          <p>Le prêt est :</p>
          <p style="text-align:center; font-weight:700; font-size:14px; margin:12px 0;">Assorti d'une assurance facultative (Non souscrite par défaut)</p>
          <p>Lorsque le financement est assorti d'une assurance :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; font-size:13px;">
            <p style="margin:0 0 4px 0;"><strong>Assureur :</strong> N/A</p>
            <p style="margin:0 0 4px 0;"><strong>Type de couverture :</strong> N/A</p>
            <p style="margin:0;"><strong>Prime :</strong> 0,00 €</p>
          </div>
          <p>Les conditions d'assurance sont communiquées à l'Emprunteur avant la conclusion du contrat lorsque cela est requis.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 20 – REMBOURSEMENT ANTICIPÉ</h4>
          <p>L'Emprunteur peut demander le remboursement anticipé du prêt dans les conditions prévues par la législation applicable et le présent Contrat.</p>
          <p>Le montant à régler est déterminé à la date du remboursement anticipé.</p>
          <p>Toute indemnité ou tout frais applicable au remboursement anticipé doit respecter les limites et conditions prévues par la réglementation applicable.</p>
          <p>La procédure de remboursement anticipé est la suivante :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; font-size:13px;">
            Demande écrite adressée au Prêteur via la messagerie sécurisée ou par courrier, suivie de l'édition d'un décompte de remboursement anticipé.
          </div>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 21 – RETARD DE PAIEMENT</h4>
          <p>En cas de non-paiement d'une échéance à la date prévue, le Prêteur peut adresser une notification à l'Emprunteur.</p>
          <p>Cette notification précise notamment : l'échéance concernée ; le montant restant dû ; la date d'exigibilité ; les modalités de régularisation ; le délai éventuellement accordé ; les conséquences prévues par le contrat et la loi.</p>
          <p>Tout intérêt moratoire, frais ou indemnité applicable doit respecter les limites prévues par la législation applicable.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 22 – DÉFAUT DE PAIEMENT</h4>
          <p>Constitue notamment un événement de défaut, sous réserve des dispositions légales impératives :</p>
          <ul style="margin:8px 0 16px 20px; color:#475569;">
            <li>le non-paiement d'une somme exigible ;</li>
            <li>la fourniture volontaire d'informations substantiellement fausses ;</li>
            <li>la falsification de documents ;</li>
            <li>le non-respect d'une obligation essentielle du contrat ;</li>
            <li>tout autre événement expressément prévu dans les conditions particulières.</li>
          </ul>
          <p>Le Prêteur respecte les procédures et délais légalement requis avant de mettre en œuvre les conséquences du défaut.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 23 – EXIGIBILITÉ ANTICIPÉE</h4>
          <p>Lorsque la loi et le présent Contrat le permettent, le Prêteur peut demander le remboursement anticipé de tout ou partie des sommes dues en cas de manquement grave de l'Emprunteur.</p>
          <p>Toute exigibilité anticipée doit être mise en œuvre conformément aux dispositions légales applicables, notamment aux éventuelles règles relatives à la mise en demeure et aux délais de régularisation.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 24 – RECOUVREMENT</h4>
          <p>En cas d'impayé, le Prêteur peut mettre en œuvre les procédures de recouvrement autorisées par la législation applicable.</p>
          <p>Le Prêteur peut confier certaines opérations de recouvrement à un prestataire autorisé lorsque cela est légalement permis.</p>
          <p>Les données nécessaires au recouvrement peuvent être communiquées aux personnes habilitées dans les limites prévues par la législation applicable.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 25 – FRAUDE</h4>
          <p>L'Emprunteur s'engage à ne pas utiliser de faux documents, de fausses identités ou de fausses informations dans le cadre de sa demande ou de l'exécution du contrat.</p>
          <p>En cas de suspicion de fraude, le Prêteur peut suspendre le traitement du dossier, le décaissement ou l'exécution d'une opération, dans les limites autorisées par la loi.</p>
          <p>Le Prêteur peut effectuer les vérifications nécessaires et transmettre les informations aux autorités ou organismes compétents lorsque la loi l'exige ou l'autorise.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 26 – DONNÉES PERSONNELLES</h4>
          <p>Le Prêteur traite les données personnelles de l'Emprunteur dans le cadre : de la gestion de la demande ; de l'analyse du crédit ; de la conclusion du contrat ; de l'exécution du contrat ; du traitement des remboursements ; de la prévention de la fraude ; de la gestion des risques ; du respect des obligations légales ; du recouvrement ; de la gestion des réclamations ; de l'archivage des documents contractuels.</p>
          <p>Les données peuvent être communiquées aux prestataires et partenaires intervenant dans l'exécution du contrat, notamment lorsque cela est nécessaire au traitement bancaire du crédit, sous réserve des règles applicables en matière de protection des données.</p>
          <p>Les modalités détaillées du traitement des données figurent dans la politique de confidentialité du Prêteur :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; font-family:monospace; font-size:12px; word-break:break-all;">
            https://www.fintechia.com/politique-confidentialite
          </div>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 27 – COMMUNICATIONS ÉLECTRONIQUES</h4>
          <p>L'Emprunteur accepte, lorsque cela est légalement admissible, de recevoir les communications relatives au crédit par voie électronique.</p>
          <p>Adresse électronique :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; font-weight:600; text-align:center;">
            ${currentCreditData.user_email || '<span class="contrat-doc-placeholder">Adresse email associée au compte</span>'}
          </div>
          <p>Les communications peuvent également être mises à disposition dans l'espace personnel sécurisé du client.</p>
          <p>L'Emprunteur est responsable de la conservation et de la sécurité de ses moyens d'accès à son compte.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 31 – CONSERVATION DES DOCUMENTS</h4>
          <p>Le Prêteur conserve le présent Contrat, ses annexes, l'échéancier et les éléments de preuve nécessaires pendant la durée requise par la législation applicable et ses obligations réglementaires.</p>
          <p>La durée de conservation est :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; font-weight:600; text-align:center;">
            Durée du remboursement (${duree} mois) + 10 ans (Durée légale)
          </div>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 32 – RÉCLAMATIONS</h4>
          <p>Toute réclamation relative au crédit peut être adressée au Prêteur :</p>
          <ul style="margin:8px 0 16px 20px; color:#475569;">
            <li><strong>Adresse :</strong> Service Réclamations FINTECHIA, 12 rue de la Paix, 75000 Paris</li>
            <li><strong>E-mail :</strong> reclamations@fintechia.com</li>
            <li><strong>Téléphone :</strong> +33 (0)1 23 45 67 89</li>
            <li><strong>Portail :</strong> Espace personnel > Messagerie sécurisée</li>
          </ul>
          <p>La réclamation est traitée conformément à la procédure interne du Prêteur et aux exigences légales applicables.</p>
          <p>Lorsque la loi prévoit un mécanisme spécifique de médiation ou de règlement extrajudiciaire, les informations correspondantes sont communiquées à l'Emprunteur.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 33 – MODIFICATIONS DU CONTRAT</h4>
          <p>Toute modification des éléments essentiels du crédit doit faire l'objet d'une procédure permettant de préserver les droits de l'Emprunteur.</p>
          <p>Lorsqu'une modification nécessite un nouvel accord ou une nouvelle signature, le système génère une nouvelle version du contrat.</p>
          <p>La version antérieure est conservée à des fins de traçabilité.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 34 – DROIT APPLICABLE</h4>
          <p>Sous réserve des dispositions impératives éventuellement applicables, le présent Contrat est régi par le <strong>droit suisse</strong>.</p>
          <p>La présente clause devra être validée par le conseil juridique du Prêteur en tenant compte notamment du statut de l'Emprunteur, de son lieu de résidence et du lieu d'exécution du contrat.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 35 – FOR ET JURIDICTION</h4>
          <p>Sous réserve des règles impératives applicables, les éventuels litiges relatifs au présent Contrat relèvent des tribunaux compétents désignés par :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; font-weight:600; text-align:center;">
            Les juridictions compétentes du canton de Genève, Suisse
          </div>
          <p>La clause définitive relative au for devra être validée juridiquement avant intégration au système.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 36 – LANGUE DU CONTRAT</h4>
          <p>Le présent Contrat est établi en :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; font-weight:600; text-align:center;">
            Français
          </div>
          <p>Lorsque plusieurs versions linguistiques sont disponibles, la version faisant foi est : la version française.</p>
        </div>

        <div class="contrat-doc-section">
          <h4>ARTICLE 28 – MISE À DISPOSITION DU CONTRAT</h4>
          <p>Avant signature, l'Emprunteur dispose d'un accès au contrat complet.</p>
          <p>Il doit pouvoir : consulter le contrat ; consulter les conditions financières ; consulter l'échéancier ; vérifier ses informations ; signaler une erreur ; télécharger ou conserver le document lorsque le dispositif le permet.</p>
          <p>Le contrat présenté à la signature correspond à la version enregistrée sous :</p>
          <div style="padding:12px; background:#F8FAFC; border:1px solid #E2E8F0; margin:12px 0; border-radius:6px; font-weight:600; text-align:center;">
            1.0 (Version Initiale)
          </div>
        </div>

        <div class="contrat-doc-section">
          <h4>CLAUSES ET CONDITIONS COMPLÉMENTAIRES</h4>
          <p style="font-size:11px; color:#64748b;">Les clauses supplémentaires sont détaillées à l'étape 3 et doivent être acceptées par l'emprunteur.</p>
          ${contratFormData.acceptClauses ? '<p style="color:#059669; font-size:12px; font-weight:600;">✓ Clauses acceptées et intégrées au contrat</p>' : '<p style="color:#94A3B8; font-size:12px;">En attente d\'acceptation des clauses (Étape 3)</p>'}
        </div>

        <div class="contrat-signature-area">
          <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
            <div>
              <div style="font-size:11px; color:#64748b; margin-bottom:4px;">Fait à</div>
              <div style="font-weight:600;">${contratFormData.lieuSignature || '___________'}</div>
            </div>
            <div>
              <div style="font-size:11px; color:#64748b; margin-bottom:4px;">Le</div>
              <div style="font-weight:600;">${dateStr}</div>
            </div>
          </div>
          
          <div style="display:flex; gap:24px;">
            <div style="flex:1;">
              <div style="font-size:12px; font-weight:600; margin-bottom:8px;">Le Prêteur</div>
              <div class="contrat-signature-box signed">
                <span>FINTECHIA SAS — Signature numérique</span>
              </div>
            </div>
            <div style="flex:1;">
              <div style="font-size:12px; font-weight:600; margin-bottom:8px;">L'Emprunteur</div>
              <div class="contrat-signature-box ${contratFormData.signatureFinale ? 'signed' : ''}" id="contrat-emprunteur-signature">
                ${contratFormData.signatureFinale 
                  ? (contratFormData.modeSignature === 'imprimer' 
                      ? '<span>En attente de réception du document signé manuscritement</span>' 
                      : `<span><strong>Signature Électronique Certifiée</strong><br>
                         <small style="font-family:monospace; font-size:9px; line-height:1.4; display:block; margin-top:4px;">
                         ID: SIG-${Math.floor(100000 + Math.random() * 900000)}<br>
                         Date: ${dateStr} à ${now.toLocaleTimeString('fr-FR')}<br>
                         Auth: PIN + Email OTP<br>
                         Version: 1.0<br>
                         Hash: ${btoa((currentCreditData.reference || 'REF') + now.getTime()).substring(0, 16).toUpperCase()}
                         </small></span>`)
                  : '<span>En attente de signature (Étape 4)</span>'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      `;
    }

    previewBody.innerHTML = contratHtml;
  }

  // ===== Mise à jour du stepper =====
  function updateStepper() {
    const steps = CONTRAT_STEPS.steps;
    steps.forEach((s, i) => {
      const el = document.getElementById(`contrat-stepper-step-${s.id}`);
      const lineEl = document.getElementById(`contrat-stepper-line-${s.id}`);
      if (!el) return;

      el.classList.remove('active', 'completed');
      if (lineEl) lineEl.classList.remove('completed');

      if (s.id < currentStep) {
        el.classList.add('completed');
        if (lineEl) lineEl.classList.add('completed');
      } else if (s.id === currentStep) {
        el.classList.add('active');
      }
    });
  }

  // ===== Vérifier si le bouton signer doit être actif =====
  function updateSignButtonState() {
    const signBtn = document.getElementById('contrat-btn-sign');
    if (!signBtn) return;

    if (currentStep === TOTAL_STEPS) {
      const signatureOk = contratFormData.signatureFinale === true;
      const lieuOk = contratFormData.lieuSignature && contratFormData.lieuSignature.trim() !== '';
      
      signBtn.disabled = !(signatureOk && lieuOk);
      signBtn.style.opacity = signBtn.disabled ? '0.5' : '1';
      signBtn.style.cursor = signBtn.disabled ? 'not-allowed' : 'pointer';
      
      const mode = contratFormData.modeSignature || 'electronique';
      if (mode === 'imprimer') {
        signBtn.innerHTML = '<i class="ti ti-printer"></i> Imprimer le contrat';
      } else {
        signBtn.innerHTML = '<i class="ti ti-writing"></i> Signer le contrat';
      }
    }
  }

  // ===== Navigation entre les étapes =====
  window.contratNextStep = function() {
    if (currentStep === 1 && window.currentUserData) {
      const errors = [];
      const user = window.currentUserData;
      
      if (contratFormData.nom && user.nom && contratFormData.nom.trim().toLowerCase() !== user.nom.toLowerCase()) {
        errors.push("le Nom");
      }
      if (contratFormData.email && user.email && contratFormData.email.trim().toLowerCase() !== user.email.toLowerCase()) {
        errors.push("l'Email");
      }
      if (contratFormData.telephone && user.telephone && contratFormData.telephone.trim().replace(/\s/g, '') !== user.telephone.replace(/\s/g, '')) {
        errors.push("le Téléphone");
      }
      if (contratFormData.dateNaissance && user.date_naissance) {
        const dbDate = user.date_naissance.substring(0, 10);
        if (contratFormData.dateNaissance !== dbDate) {
          errors.push("la Date de naissance");
        }
      }

      if (errors.length > 0) {
        alert("Les informations suivantes ne correspondent pas à celles fournies lors de la création de votre compte :\n- " + errors.join('\n- ') + "\n\nVeuillez corriger ces champs pour continuer.");
        return;
      }
    }

    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      renderCurrentStep();
    }
  };

  window.contratPrevStep = function() {
    if (currentStep > 1) {
      currentStep--;
      renderCurrentStep();
    }
  };

  function renderCurrentStep() {
    const formBody = document.getElementById('contrat-form-body');
    if (!formBody) return;

    formBody.innerHTML = generateStepForm(currentStep, currentType);
    updateStepper();
    updateContratPreview();

    // Restaurer les valeurs des champs si on revient en arrière
    restoreFormValues();

    // Mettre à jour les boutons de navigation
    const prevBtn = document.getElementById('contrat-btn-prev');
    const nextBtn = document.getElementById('contrat-btn-next');
    const signBtn = document.getElementById('contrat-btn-sign');

    if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = currentStep < TOTAL_STEPS ? 'inline-flex' : 'none';
    if (signBtn) {
      signBtn.style.display = currentStep === TOTAL_STEPS ? 'inline-flex' : 'none';
      updateSignButtonState();
    }

    // Scroll to top of form
    formBody.scrollTop = 0;
  }

  // Restaurer les valeurs du formulaire
  function restoreFormValues() {
    const fieldMap = {
      'contrat-civilite': 'civilite',
      'contrat-nationalite': 'nationalite',
      'contrat-nom': 'nom',
      'contrat-prenom': 'prenom',
      'contrat-date-naissance': 'dateNaissance',
      'contrat-lieu-naissance': 'lieuNaissance',
      'contrat-adresse': 'adresse',
      'contrat-telephone': 'telephone',
      'contrat-email': 'email',
      'contrat-id-type': 'idType',
      'contrat-id-numero': 'idNumero',
      'contrat-profession': 'profession',
      'contrat-employeur': 'employeur',
      'contrat-revenu': 'revenu',
      'contrat-anciennete': 'anciennete',
      'contrat-objet': 'objet',
      'contrat-adresse-bien': 'adresseBien',
      'contrat-type-bien': 'typeBien',
      'contrat-surface': 'surface',
      'contrat-nom-projet': 'nomProjet',
      'contrat-desc-projet': 'descProjet',
      'contrat-secteur': 'secteur',
      'contrat-date-debut': 'dateDebut',
      'contrat-mode-remboursement': 'modeRemboursement',
      'contrat-iban': 'iban',
      'contrat-accept-clauses': 'acceptClauses',
      'contrat-accept-taeg': 'acceptTaeg',
      'contrat-accept-retractation': 'acceptRetractation',
      'contrat-accept-assurance': 'acceptAssurance',
      'contrat-accept-garantie': 'acceptGarantie',
      'contrat-lieu-signature': 'lieuSignature',
      'contrat-type-achat': 'typeAchat',
      'contrat-fournisseur': 'fournisseur',
      'contrat-mode-signature': 'modeSignature',
      'contrat-mention-manuscrite': 'mentionManuscrite',
      'contrat-signature-finale': 'signatureFinale'
    };

    for (const [elId, dataKey] of Object.entries(fieldMap)) {
      const el = document.getElementById(elId);
      if (!el || contratFormData[dataKey] === undefined) continue;

      if (el.type === 'checkbox') {
        el.checked = !!contratFormData[dataKey];
        el.dispatchEvent(new Event('change'));
      } else {
        el.value = contratFormData[dataKey];
        if (el.tagName === 'SELECT') {
          el.dispatchEvent(new Event('change'));
        }
      }
    }
  }

  // ===== Envoyer le code OTP =====
  window.sendContratOtp = async function(btn) {
    if (!window.currentUserData || !window.currentUserData.email) {
      alert("Votre adresse email n'est pas configurée.");
      return;
    }
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-loader ti-spin"></i> Envoi...';
    btn.disabled = true;
    try {
      await window.apiCall('/auth/otp/send', 'POST', { email: window.currentUserData.email });
      btn.innerHTML = '<i class="ti ti-check" style="color:#059669;"></i> Envoyé';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 5000);
      alert('Un code de validation a été envoyé à votre adresse email.');
    } catch(e) {
      alert('Erreur lors de l\'envoi du code : ' + e.message);
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  };

  // ===== Signer le contrat =====
  window.signContrat = async function() {
    const signBtn = document.getElementById('contrat-btn-sign');
    if (signBtn && signBtn.disabled) return;

    if (!contratFormData.signatureFinale) {
      alert('Veuillez cocher la case de confirmation.');
      return;
    }

    const mode = contratFormData.modeSignature || 'electronique';

    if (mode === 'electronique') {
      const pinCode = contratFormData.pinCode || document.getElementById('contrat-pin').value;
      const emailCode = contratFormData.emailCode || document.getElementById('contrat-email-code').value;
      
      if (!pinCode || pinCode.length !== 6) { alert('Veuillez saisir votre code PIN à 6 chiffres.'); return; }
      if (!emailCode || emailCode.length !== 6) { alert('Veuillez saisir le code Email à 6 chiffres.'); return; }
      
      // Verifier PIN
      try {
        await window.apiCall('/auth/verify-pin', 'POST', { pin: pinCode });
      } catch(e) {
        alert('Code PIN incorrect : ' + e.message);
        return;
      }
      
      // Verifier OTP
      try {
        await window.apiCall('/auth/otp/verify', 'POST', { code: emailCode });
      } catch(e) {
        alert('Code Email incorrect : ' + e.message);
        return;
      }
    }

    if (mode === 'imprimer') {
      const printContent = document.getElementById('contrat-preview-content').innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Impression du Contrat</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #000; }
              .contrat-doc-section { margin-bottom: 20px; }
              h4 { margin: 0 0 10px; font-size: 14px; }
              p { margin: 0 0 8px; font-size: 12px; line-height: 1.5; }
              ul { margin: 0 0 10px 20px; font-size: 12px; line-height: 1.5; }
              .contrat-signature-area { margin-top: 40px; page-break-inside: avoid; border-top: 1px solid #ccc; padding-top: 20px; }
              .contrat-signature-box { border: 1px dashed #ccc; padding: 20px; text-align: center; margin-top: 10px; height: 100px; display: flex; align-items: center; justify-content: center; }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

      // Afficher modale d'upload
      const container = document.querySelector('.contrat-container');
      if (container) {
        const uploadOverlay = document.createElement('div');
        uploadOverlay.className = 'contrat-success-overlay';
        uploadOverlay.innerHTML = `
          <div class="contrat-success-icon" style="background:#EFF6FF; color:#3B82F6;">
            <i class="ti ti-upload"></i>
          </div>
          <h2 style="font-size:24px; font-weight:700; color:#1C2436; margin:0 0 8px;">Transmettre le contrat signé</h2>
          <p style="font-size:14px; color:#64748b; margin:0 0 24px; max-width:400px; text-align:center;">
            Vous devez avoir lu et compris l'intégralité des clauses du contrat avant de le signer.<br><br>
            Si vous êtes sûr d'avoir compris, veuillez transmettre sous format PDF la copie du contrat signé.
          </p>
          <div style="width:100%; max-width:300px; margin-bottom:20px;">
            <input type="file" id="contrat-upload-file" accept="application/pdf" class="contrat-input" style="padding:10px;">
          </div>
          <button class="contrat-btn contrat-btn-next" onclick="submitPrintedContrat()" style="padding:12px 32px; background:#2563EB;">
            Envoyer le contrat
          </button>
          <button class="btn-outline" onclick="closeContratModal(); loadCredits();" style="margin-top:12px; padding:8px 16px;">
            Annuler
          </button>
        `;
        container.style.position = 'relative';
        container.appendChild(uploadOverlay);
      }
      return;
    }

    try {
      // Sauvegarder le contrat via l'API (Cas Electronique)
      if (currentCreditData.id) {
        await window.apiCall(`/credits/${currentCreditData.id}/contrat`, 'POST', {
          type: currentType,
          formData: contratFormData,
          signedAt: new Date().toISOString()
        });
      }

      // Afficher le succès
      if (currentCreditData.id) {
        localStorage.removeItem('contrat_draft_' + currentCreditData.id);
      }
      const container = document.querySelector('.contrat-container');
      if (container) {
        const successOverlay = document.createElement('div');
        successOverlay.className = 'contrat-success-overlay';
        successOverlay.innerHTML = `
          <div class="contrat-success-icon">
            <i class="ti ti-check"></i>
          </div>
          <h2 style="font-size:24px; font-weight:700; color:#1C2436; margin:0 0 8px;">Contrat signé !</h2>
          <p style="font-size:14px; color:#64748b; margin:0 0 24px; max-width:400px; text-align:center;">
            Votre ${getContratTitle(currentType).toLowerCase()} a été signé électroniquement avec succès. Un e-mail de confirmation vous a été envoyé.
          </p>
          <button class="contrat-btn contrat-btn-next" onclick="closeContratModal(); loadCredits();" style="padding:12px 32px;">
            Retour à mes crédits
          </button>
        `;
        container.style.position = 'relative';
        container.appendChild(successOverlay);
      }
    } catch (e) {
      alert('Erreur lors de la signature : ' + (e.message || 'Veuillez réessayer.'));
    }
  };

  window.submitPrintedContrat = async function() {
    const fileInput = document.getElementById('contrat-upload-file');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert("Veuillez sélectionner un fichier PDF.");
      return;
    }
    
    try {
      if (currentCreditData.id) {
        // Upload physique du fichier
        const formData = new FormData();
        formData.append('document', fileInput.files[0]);
        formData.append('type_document', 'contrat_signe');
        
        const token = localStorage.getItem('fintech_token');
        const uploadRes = await fetch(`/api/credits/${currentCreditData.id}/documents`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Erreur lors de l\'upload du document');

        // Validation du contrat
        await window.apiCall(`/credits/${currentCreditData.id}/contrat`, 'POST', {
          type: currentType,
          formData: { ...contratFormData, upload: true, modeSignature: 'imprimer' },
          signedAt: new Date().toISOString()
        });
        localStorage.removeItem('contrat_draft_' + currentCreditData.id);
      }
      
      const container = document.querySelector('.contrat-container');
      const uploadOverlay = container.querySelector('.contrat-success-overlay');
      if (uploadOverlay) {
        uploadOverlay.innerHTML = `
          <div class="contrat-success-icon" style="background:#10B981; color:white;">
            <i class="ti ti-check"></i>
          </div>
          <h2 style="font-size:24px; font-weight:700; color:#1C2436; margin:0 0 8px;">Envoyé avec succès</h2>
          <p style="font-size:14px; color:#64748b; margin:0 0 24px; max-width:400px; text-align:center;">
            Votre contrat a bien été transmis et sera vérifié par nos équipes. Un e-mail de confirmation vous a été envoyé.
          </p>
          <button class="contrat-btn contrat-btn-next" onclick="closeContratModal(); loadCredits();" style="padding:12px 32px;">
            Fermer
          </button>
        `;
      }
    } catch(err) {
      alert("Erreur lors de l'envoi : " + err.message);
    }
  };

  // ===== Ouvrir la modale contrat =====
  window.openContratModal = function(type, creditData) {
    currentType = type;
    currentCreditData = creditData || {};
    currentStep = 1;
    contratFormData = {};
    if (currentCreditData.id) {
      const saved = localStorage.getItem('contrat_draft_' + currentCreditData.id);
      if (saved) {
        try { contratFormData = JSON.parse(saved); } catch(e){}
      }
    }

    // Créer la modale si elle n'existe pas
    let modal = document.getElementById('modal-contrat-credit');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'contrat-modal';
      modal.id = 'modal-contrat-credit';
      document.body.appendChild(modal);
    }

    const steps = CONTRAT_STEPS.steps;

    modal.innerHTML = `
      <div class="contrat-container">
        <!-- Panneau gauche : Formulaire -->
        <div class="contrat-form-panel">
          <div class="contrat-form-header" style="position:relative;">
            <h2><i class="ti ti-file-text" style="color:#2563EB;"></i> ${getContratTitle(type)}</h2>
            <p>Complétez les informations pour générer votre contrat</p>
            <button class="contrat-close-btn" onclick="closeContratModal()">&times;</button>
          </div>

          <!-- Stepper -->
          <div class="contrat-stepper">
            ${steps.map((s, i) => `
              <div class="contrat-step-item ${s.id === 1 ? 'active' : ''}" id="contrat-stepper-step-${s.id}">
                <div class="contrat-step-node">${s.id}</div>
                <span>${s.label}</span>
              </div>
              ${i < steps.length - 1 ? `<div class="contrat-step-line" id="contrat-stepper-line-${s.id}"></div>` : ''}
            `).join('')}
          </div>

          <!-- Corps du formulaire -->
          <div class="contrat-form-body" id="contrat-form-body">
            ${generateStepForm(1, type)}
          </div>

          <!-- Footer navigation -->
          <div class="contrat-form-footer">
            <button class="contrat-btn contrat-btn-prev" id="contrat-btn-prev" onclick="contratPrevStep()" style="display:none;">
              <i class="ti ti-arrow-left"></i> Précédent
            </button>
            <div style="flex:1;"></div>
            <button class="contrat-btn contrat-btn-next" id="contrat-btn-next" onclick="contratNextStep()">
              Suivant <i class="ti ti-arrow-right"></i>
            </button>
            <button class="contrat-btn contrat-btn-sign" id="contrat-btn-sign" onclick="signContrat()" style="display:none;" disabled>
              <i class="ti ti-writing"></i> Signer le contrat
            </button>
          </div>
        </div>

        <!-- Panneau droit : Aperçu -->
        <div class="contrat-preview-panel">
          <div class="contrat-preview-header">
            <h3><i class="ti ti-eye" style="color:#64748b;"></i> Aperçu du contrat</h3>
            <div class="contrat-preview-badge">Temps réel</div>
          </div>
          <div class="contrat-preview-body" id="contrat-preview-content">
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialiser l'aperçu
    updateContratPreview();
    updateStepper();
    restoreFormValues();
  };

  // ===== Fermer la modale contrat =====
  window.closeContratModal = function() {
    const modal = document.getElementById('modal-contrat-credit');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

})();
