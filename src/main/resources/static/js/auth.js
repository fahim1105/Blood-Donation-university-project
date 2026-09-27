// ══════════════════════════════════════════════════════════
// auth.js — Login & Registration
// ══════════════════════════════════════════════════════════

import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Helpers ────────────────────────────────────────────────

function showErr(containerId, msgId, msg) {
  const c = document.getElementById(containerId);
  const m = document.getElementById(msgId);
  if (c) { c.classList.remove('hidden'); c.style.display = ''; }
  if (m) m.textContent = msg;
}
function hideErr(id) {
  const c = document.getElementById(id);
  if (c) { c.classList.add('hidden'); c.style.display = 'none'; }
}

function showOk(containerId, msgId, msg) {
  const c = document.getElementById(containerId);
  const m = document.getElementById(msgId);
  if (c) { c.classList.remove('hidden'); c.style.display = ''; }
  if (m) m.textContent = msg;
}

function setLoading(btnId, spinnerId, on) {
  const b = document.getElementById(btnId);
  const s = document.getElementById(spinnerId);
  if (b) b.disabled = on;
  if (s) {
    if (on) { s.classList.remove('hidden'); s.style.display = ''; }
    else    { s.classList.add('hidden');    s.style.display = 'none'; }
  }
}

async function registerProfile(user, extra) {
  const token = await user.getIdToken();
  const body = {
    firebaseUid:      user.uid,
    name:             extra.name  || user.displayName || '',
    email:            user.email,
    phone:            extra.phone || '',
    bloodGroup:       extra.bloodGroup  || '',
    district:         extra.district    || '',
    upazila:          extra.upazila     || '',
    lastDonationDate: extra.lastDonationDate || null
  };
  const res = await fetch('/api/v1/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Profile save failed'); }
  return res.json();
}

function friendly(code) {
  const map = {
    'auth/invalid-email':        'Invalid email address.',
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/invalid-credential':   'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/too-many-requests':    'Too many attempts. Please wait.'
  };
  return map[code] || 'Authentication error. Please try again.';
}

// ══════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErr('auth-error');
    setLoading('login-submit-btn', 'login-spinner', true);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        document.getElementById('login-email').value.trim(),
        document.getElementById('login-password').value
      );
      localStorage.setItem('hemo_id_token', await cred.user.getIdToken());
      
      // ⭐ Redirect back to intended destination
      if (typeof RedirectHandler !== 'undefined') {
        RedirectHandler.redirectBack();
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      showErr('auth-error', 'auth-error-msg', friendly(err.code));
    } finally {
      setLoading('login-submit-btn', 'login-spinner', false);
    }
  });
}

// Google Sign-in removed
/*
document.getElementById('google-signin-btn')?.addEventListener('click', async () => {
  hideErr('auth-error');
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    localStorage.setItem('hemo_id_token', await cred.user.getIdToken());
    // Silently create profile if new user
    await registerProfile(cred.user, {
      name: cred.user.displayName
    }).catch(() => {});
    
    // ⭐ Redirect back to intended destination
    if (typeof RedirectHandler !== 'undefined') {
      RedirectHandler.redirectBack();
    } else {
      window.location.href = '/dashboard';
    }
  } catch (err) {
    showErr('auth-error', 'auth-error-msg', friendly(err.code));
  }
});
*/

// ══════════════════════════════════════════════════════════
// REGISTER PAGE — Step 1
// ══════════════════════════════════════════════════════════

let pendingUser = null;

const step1Form = document.getElementById('register-form-step1');
if (step1Form) {
  step1Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErr('reg-error');

    const pwd = document.getElementById('reg-password').value;
    if (pwd !== document.getElementById('reg-confirm-password').value) {
      return showErr('reg-error', 'reg-error-msg', 'Passwords do not match.');
    }

    const btn = document.getElementById('reg-next-btn');
    btn.disabled = true;
    btn.textContent = 'Creating account…';

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        document.getElementById('reg-email').value.trim(),
        pwd
      );
      pendingUser = cred.user;
      const uidInput = document.getElementById('reg-firebase-uid');
      uidInput.value = cred.user.uid;
      uidInput.dataset.name = document.getElementById('reg-name').value.trim();

      document.getElementById('step-1').classList.add('hidden');
      document.getElementById('step-1').style.display = 'none';
      const step2 = document.getElementById('step-2');
      step2.classList.remove('hidden');
      step2.style.display = '';
    } catch (err) {
      showErr('reg-error', 'reg-error-msg', friendly(err.code));
    } finally {
      btn.disabled = false;
      btn.textContent = 'Continue →';
    }
  });
}

// ══════════════════════════════════════════════════════════
// REGISTER PAGE — Step 2
// ══════════════════════════════════════════════════════════

const step2Form = document.getElementById('register-form-step2');
if (step2Form) {
  step2Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErr('reg-error');

    const bloodGroup = document.getElementById('reg-blood-group').value;
    if (!bloodGroup) {
      return showErr('reg-error', 'reg-error-msg', 'Please select your blood group.');
    }
    const district = document.getElementById('reg-district').value;
    if (!district) {
      return showErr('reg-error', 'reg-error-msg', 'Please select your district.');
    }

    setLoading('reg-submit-btn', 'reg-spinner', true);
    try {
      const user = pendingUser || auth.currentUser;
      if (!user) throw new Error('Session expired. Please start over.');

      await registerProfile(user, {
        name:             document.getElementById('reg-firebase-uid').dataset.name || '',
        phone:            document.getElementById('reg-phone').value.trim(),
        bloodGroup,
        district,
        upazila:          document.getElementById('reg-upazila').value.trim(),
        lastDonationDate: document.getElementById('reg-last-donation').value || null
      });

      localStorage.setItem('hemo_id_token', await user.getIdToken());
      showOk('reg-success', 'reg-success-msg', '✓ Registered! Redirecting to your profile…');
      setTimeout(() => { window.location.href = '/profile'; }, 1500);
    } catch (err) {
      showErr('reg-error', 'reg-error-msg', err.message || 'Registration failed.');
    } finally {
      setLoading('reg-submit-btn', 'reg-spinner', false);
    }
  });
}

// Google signup on register page - Removed
/*
document.getElementById('google-signup-btn')?.addEventListener('click', async () => {
  hideErr('reg-error');
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    pendingUser = cred.user;
    const uidInput = document.getElementById('reg-firebase-uid');
    uidInput.value = cred.user.uid;
    uidInput.dataset.name = cred.user.displayName || '';
    document.getElementById('step-1').classList.add('hidden');
    document.getElementById('step-1').style.display = 'none';
    const s2 = document.getElementById('step-2');
    s2.classList.remove('hidden');
    s2.style.display = '';
  } catch (err) {
    showErr('reg-error', 'reg-error-msg', friendly(err.code));
  }
});
*/
