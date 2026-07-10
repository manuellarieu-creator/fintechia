// Logique KYC upload (à lier au formulaire KYC dans app.html)
async function submitKYC(event) {
  event.preventDefault();
  
  const token = localStorage.getItem('fintech_token');
  const formData = new FormData();
  formData.append('type_document', document.getElementById('kyc-type').value);
  formData.append('document', document.getElementById('kyc-doc').files[0]);
  formData.append('selfie', document.getElementById('kyc-selfie').files[0]);

  try {
    const res = await fetch('/api/kyc/submit', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur KYC');
    
    alert('Documents envoyés pour vérification.', () => showPage('pg-dash'));
    checkAuth(); // refresh UI to hide KYC alert
  } catch (err) {
    alert(err.message);
  }
}
