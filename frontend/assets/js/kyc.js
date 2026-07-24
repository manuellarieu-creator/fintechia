// Logique KYC (Vérification d'identité) avec Simulation Appareil Photo

let currentStream = null;
let currentCaptureTarget = null; // 'recto', 'verso', 'selfie'
const capturedFiles = { recto: null, verso: null, selfie: null };

function openCameraView(target) {
  currentCaptureTarget = target;
  const mv = document.getElementById('kyc-main-view');
  if (mv) mv.style.display = 'none';
  const mvm = document.getElementById('kyc-main-view-m');
  if (mvm) mvm.style.display = 'none';
  document.getElementById('kyc-camera-view').style.display = 'flex';
  
  const video = document.getElementById('kyc-video');
  
  // Demander l'accès à la caméra
  navigator.mediaDevices.getUserMedia({ video: { facingMode: target === 'selfie' ? 'user' : 'environment' } })
    .then(stream => {
      currentStream = stream;
      video.srcObject = stream;
      video.play();
    })
    .catch(err => {
      console.error("Caméra non accessible", err);
      alert("Impossible d'accéder à la caméra. Veuillez utiliser le mode classique.");
      closeCameraView();
    });
}

function closeCameraView() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  document.getElementById('kyc-camera-view').style.display = 'none';
  const mv = document.getElementById('kyc-main-view');
  if (mv) mv.style.display = 'block';
  const mvm = document.getElementById('kyc-main-view-m');
  if (mvm) mvm.style.display = 'block';
}

function captureImage() {
  const video = document.getElementById('kyc-video');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  canvas.toBlob(blob => {
    const file = new File([blob], `kyc_${currentCaptureTarget}.png`, { type: 'image/png' });
    capturedFiles[currentCaptureTarget] = file;
    
    // Mettre à jour l'UI
    const btnMobile = document.getElementById(`btn-capture-${currentCaptureTarget}-m`);
    const btnDesktop = document.getElementById(`btn-capture-${currentCaptureTarget}`);
    
    if (btnMobile) {
      btnMobile.innerHTML = '<i class="ti ti-check" style="color:var(--success)"></i> ' + currentCaptureTarget.toUpperCase() + ' Capturé';
      btnMobile.style.borderColor = 'var(--success)';
      btnMobile.style.backgroundColor = 'var(--success-bg)';
    }
    if (btnDesktop) {
      btnDesktop.innerHTML = '<i class="ti ti-check" style="color:var(--success)"></i> ' + currentCaptureTarget.toUpperCase() + ' Capturé';
      btnDesktop.style.borderColor = 'var(--success)';
      btnDesktop.style.backgroundColor = 'var(--success-bg)';
    }
    
    closeCameraView();
  }, 'image/png');
}

async function submitKYC(event) {
  event.preventDefault();
  
  if (!capturedFiles.recto || !capturedFiles.selfie) {
    return alert('Le Recto et le Selfie sont obligatoires.');
  }

  const token = localStorage.getItem('fintech_token');
  const formData = new FormData();
  
  // on check les deux IDs car ça peut venir du mobile ou du desktop
  const typeDoc = document.getElementById('kyc-type')?.value || document.getElementById('kyc-type-m')?.value || 'cni';
  formData.append('type_document', typeDoc);
  
  formData.append('document', capturedFiles.recto);
  if (capturedFiles.verso) formData.append('document_verso', capturedFiles.verso);
  formData.append('selfie', capturedFiles.selfie);

  const submitBtn = event.currentTarget.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="ti ti-loader ti-spin"></i> Traitement sécurisé...';
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/kyc/submit', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur KYC');
    
    alert('Vos documents ont été transmis avec succès. Ils sont en cours d\'analyse.');
    window.location.reload(); 
  } catch (err) {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    alert(err.message);
  }
}

window.openCameraView = openCameraView;
window.closeCameraView = closeCameraView;
window.captureImage = captureImage;
window.submitKYC = submitKYC;
