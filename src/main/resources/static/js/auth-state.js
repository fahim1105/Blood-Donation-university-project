// ══════════════════════════════════════════════════════════
// auth-state.js — shared Firebase auth listener
// ══════════════════════════════════════════════════════════
import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function applyNav(loggedIn) {
  if (typeof window._navApplyAuthState === 'function') {
    window._navApplyAuthState(loggedIn);
    return;
  }
  // Home nav fallback (class-based)
  var out = document.getElementById('nav-logged-out');
  var inn = document.getElementById('nav-logged-in');
  if (loggedIn) {
    out?.classList.add('hidden');
    if (inn) { inn.classList.remove('hidden'); inn.classList.add('flex'); }
  } else {
    out?.classList.remove('hidden');
    inn?.classList.add('hidden');
    inn?.classList.remove('flex');
  }
}

async function fetchAndCacheProfile(token) {
  try {
    const res = await fetch('/api/v1/users/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      const user = await res.json();
      // Cache role, name, photo for navbar and other pages
      localStorage.setItem('hemo_user_role',  user.role  || 'DONOR');
      localStorage.setItem('hemo_user_name',  user.name  || '');
      localStorage.setItem('hemo_user_photo', user.profilePhotoUrl || '');
    }
  } catch (_) {
    // Non-fatal — navbar will use cached values or defaults
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken(true);
    localStorage.setItem('hemo_id_token', token);
    if (user.displayName) {
      localStorage.setItem('hemo_user_name', localStorage.getItem('hemo_user_name') || user.displayName);
    }

    const path = window.location.pathname;
    // Don't fetch /me on auth pages — redirect would abort the request (ERR_ABORTED 404)
    if (path === '/login' || path === '/register') {
      applyNav(true);
      window.location.href = '/profile';
      return;
    }

    await fetchAndCacheProfile(token);
    applyNav(true);
  } else {
    localStorage.removeItem('hemo_id_token');
    localStorage.removeItem('hemo_user_role');
    localStorage.removeItem('hemo_user_name');
    localStorage.removeItem('hemo_user_photo');
    applyNav(false);

    const guarded = ['/profile', '/my-requests'];
    if (guarded.includes(window.location.pathname)) {
      document.getElementById('auth-guard')?.classList.remove('hidden');
      document.getElementById('profile-content')?.classList.add('hidden');
      document.getElementById('my-req-auth-guard')?.classList.remove('hidden');
      document.getElementById('my-requests-container')?.classList.add('hidden');
    }
  }
});

// Shared logout handler — used by navbar dropdown button and mobile menu
async function doLogout() {
  await signOut(auth);
  localStorage.removeItem('hemo_id_token');
  localStorage.removeItem('hemo_user_role');
  localStorage.removeItem('hemo_user_name');
  localStorage.removeItem('hemo_user_photo');
  window.location.href = '/';
}

// Expose logout globally so navbar fragment inline script can call it
window._hemoLogout = doLogout;

// Delegate logout button click — button is created dynamically by navbar JS
document.addEventListener('click', function (e) {
  if (e.target && e.target.closest && e.target.closest('#nav-logout-btn')) {
    e.preventDefault();
    doLogout();
  }
});
