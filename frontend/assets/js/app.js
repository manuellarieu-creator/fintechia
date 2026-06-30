// Base logic for the frontend SPA

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('fintech_token');
  if (token) {
    // Validate token
    checkAuth(token);
  } else {
    showPage('pg-login');
  }
});

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const target = document.getElementById(pageId);
  if (target) {
    target.style.display = target.classList.contains('flex-col') ? 'flex' : 'block';
  }
}

// Global API Fetch function
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('fintech_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`/api${endpoint}`, options);
  
  if (res.status === 401) {
    localStorage.removeItem('fintech_token');
    showPage('pg-login');
    alert('Session expirée, veuillez vous reconnecter.');
    return null;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur API');
  return data;
}

// Login logic
document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-pwd').value;
  
  try {
    const res = await apiCall('/auth/login', 'POST', { email, password });
    localStorage.setItem('fintech_token', res.token);
    initDashboard(res.user, res.account);
  } catch (err) {
    alert(err.message);
  }
});

async function checkAuth() {
  try {
    const data = await apiCall('/auth/me');
    initDashboard(data.user, data.account, data.kyc_statut);
  } catch (err) {
    console.error(err);
  }
}

function initDashboard(user, account, kycStatut = null) {
  showPage('pg-dash');
  document.getElementById('user-prenom').innerText = user.prenom;
  document.getElementById('user-avatar').innerText = (user.prenom[0] + user.nom[0]).toUpperCase();
  
  if (account) {
    document.getElementById('solde-display').innerText = `€ ${account.solde}`;
    document.getElementById('iban-display').innerText = account.iban || 'IBAN en attente d\'attribution';
    
    if (account.statut === 'kyc_requis' || kycStatut === 'en_attente') {
      document.getElementById('kyc-alert').style.display = 'flex';
    } else {
      document.getElementById('kyc-alert').style.display = 'none';
    }
  }

  // Load transactions
  if (typeof loadTransactions === 'function') {
    loadTransactions();
  }
}
