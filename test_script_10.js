
  function handleLoginDynamic() {
    // We always show the options and password group now, so no need to hide things here.
  }

  let tempToken2FA = null;

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const idClient = document.getElementById('login-id-client').value;
    const password = document.getElementById('login-pwd').value;
    const trustedDeviceToken = localStorage.getItem('fintech_device_token');

    try {
      const res = await apiCall('/auth/login', 'POST', { idClient, password, trustedDeviceToken });
      
      if (res.require2FA) {
        tempToken2FA = res.tempToken;
        document.getElementById('modal-2fa-login').style.display = 'flex';
        // Focus le premier input OTP
        setTimeout(() => document.querySelector('#modal-2fa-login .otp-box').focus(), 100);
      } else {
        localStorage.setItem('fintech_token', res.token);
        if (typeof initDashboard === 'function') initDashboard(res.user, res.account, res.kyc_statut);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  function moveOtpFocus(el, index) {
    if (el.value.length === 1) {
      el.classList.remove('empty');
      const next = el.nextElementSibling;
      if (next) next.focus();
    } else if (el.value.length === 0) {
      el.classList.add('empty');
      const prev = el.previousElementSibling;
      if (prev && event.key === "Backspace") prev.focus();
    }
  }

  async function checkOtpAndLogin(el, e) {
    el.classList.remove('empty');
    if (el.value.length === 1) {
      await forceLogin();
    } else if (el.value.length === 0 && e && e.key === "Backspace") {
      el.classList.add('empty');
      const prev = el.previousElementSibling;
      if (prev) prev.focus();
    }
  }

  async function forceLogin() {
    const inputs = document.querySelectorAll('#modal-2fa-login .otp-box');
    let code = '';
    inputs.forEach(i => code += i.value);
    
    if (code.length < 4) return;

    try {
      const res = await apiCall('/auth/login/2fa', 'POST', { tempToken: tempToken2FA, code });
      
      if (res.requirePinReset) {
        document.getElementById('modal-2fa-login').style.display = 'none';
        document.getElementById('modal-reset-pin').style.display = 'flex';
        window.tempResetToken = res.resetToken;
        setTimeout(() => document.querySelector('.reset-pin-inputs .otp-box').focus(), 100);
        return;
      }

      localStorage.setItem('fintech_token', res.token);
      localStorage.setItem('fintech_device_token', res.deviceToken);
      document.getElementById('modal-2fa-login').style.display = 'none';
      if (typeof initDashboard === 'function') initDashboard(res.user, res.account, res.kyc_statut);
    } catch(err) {
      alert(err.message);
      inputs.forEach(i => { i.value = ''; i.classList.add('empty'); });
      inputs[0].focus();
    }
  }
  function moveResetPinFocus(el, index) {
    if (el.value.length === 1) {
      const next = el.nextElementSibling;
      if (next) next.focus();
    } else if (el.value.length === 0 && event && event.key === "Backspace") {
      const prev = el.previousElementSibling;
      if (prev) prev.focus();
    }
  }

  function moveResetPinConfirmFocus(el, index) {
    if (el.value.length === 1) {
      const next = el.nextElementSibling;
      if (next) next.focus();
    } else if (el.value.length === 0 && event && event.key === "Backspace") {
      const prev = el.previousElementSibling;
      if (prev) prev.focus();
    }
  }

  async function checkResetPinAndSubmit(el, e) {
    if (el.value.length === 1) {
      await submitNewPin();
    } else if (el.value.length === 0 && e && e.key === "Backspace") {
      const prev = el.previousElementSibling;
      if (prev) prev.focus();
    }
  }

  async function submitNewPin() {
    const inputs1 = document.querySelectorAll('.reset-pin-inputs .otp-box');
    const inputs2 = document.querySelectorAll('.reset-pin-confirm-inputs .otp-box');
    let pin1 = '';
    let pin2 = '';
    inputs1.forEach(i => pin1 += i.value);
    inputs2.forEach(i => pin2 += i.value);

    const errEl = document.getElementById('reset-pin-error');
    if (pin1.length !== 6 || pin2.length !== 6) {
      errEl.innerText = "Veuillez saisir les 6 chiffres.";
      errEl.style.display = 'block';
      return;
    }
    if (pin1 !== pin2) {
      errEl.innerText = "Les codes ne correspondent pas.";
      errEl.style.display = 'block';
      return;
    }
    errEl.style.display = 'none';

    try {
      const res = await apiCall('/auth/reset-pin', 'POST', { resetToken: window.tempResetToken, new_pin: pin1 });
      localStorage.setItem('fintech_token', res.token);
      localStorage.setItem('fintech_device_token', res.deviceToken);
      document.getElementById('modal-reset-pin').style.display = 'none';
      if (typeof initDashboard === 'function') initDashboard(res.user, res.account, res.kyc_statut);
    } catch (err) {
      errEl.innerText = err.message;
      errEl.style.display = 'block';
    }
  let tempRecoveryToken = null;

  function openRecoverPin() {
    document.getElementById('modal-2fa-login').style.display = 'none';
    document.getElementById('modal-recover-pin').style.display = 'flex';
    document.getElementById('recover-step-1').style.display = 'block';
    document.getElementById('recover-step-2').style.display = 'none';
    document.getElementById('recover-step-3').style.display = 'none';
    document.getElementById('recover-email').value = document.getElementById('login-id-client').value || '';
    document.getElementById('recover-pwd').value = document.getElementById('login-pwd').value || '';
  }

  function closeRecoverPin() {
    document.getElementById('modal-recover-pin').style.display = 'none';
  }

  async function submitRecoverInit(e) {
    e.preventDefault();
    const email = document.getElementById('recover-email').value;
    const password = document.getElementById('recover-pwd').value;
    const errEl = document.getElementById('recover-error-1');
    
    try {
      const res = await apiCall('/auth/recover-pin/init', 'POST', { email, password });
      if (res.success) {
        tempRecoveryToken = res.recoveryToken;
        document.getElementById('recover-step-1').style.display = 'none';
        document.getElementById('recover-step-2').style.display = 'block';
      }
    } catch(err) {
      errEl.innerText = err.message;
      errEl.style.display = 'block';
    }
  }

  async function submitRecoverKyc(e) {
    e.preventDefault();
    const errEl = document.getElementById('recover-error-2');
    const btn = document.getElementById('btn-recover-kyc');
    
    const doc = document.getElementById('recover-doc').files[0];
    const docVerso = document.getElementById('recover-doc-verso').files[0];
    const selfie = document.getElementById('recover-selfie').files[0];

    const formData = new FormData();
    formData.append('document', doc);
    formData.append('document_verso', docVerso);
    formData.append('selfie', selfie);

    btn.innerText = "Envoi en cours...";
    btn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/kyc/recover-pin-submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tempRecoveryToken}` },
        body: formData
      });
      const res = await response.json();
      
      if (!response.ok) throw new Error(res.error || 'Erreur lors de l\'envoi');

      document.getElementById('recover-step-2').style.display = 'none';
      document.getElementById('recover-step-3').style.display = 'block';
    } catch(err) {
      errEl.innerText = err.message;
      errEl.style.display = 'block';
    } finally {
      btn.innerText = "Soumettre et recevoir mon PIN";
      btn.disabled = false;
    }
  }
