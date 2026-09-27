// ══════════════════════════════════════════════════════════
// request-blood.js — Blood request form submission
// ══════════════════════════════════════════════════════════

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let token = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    token = await user.getIdToken(true);
    localStorage.setItem('hemo_id_token', token);
  }
  // Pre-fill blood group and district from URL params (coming from search page)
  const params = new URLSearchParams(window.location.search);
  const bg = params.get('bloodGroup');
  if (bg) {
    const sel = document.getElementById('req-blood-group');
    if (sel) sel.value = bg;
  }
  const distParam = params.get('district');
  if (distParam) {
    const distSel = document.getElementById('req-district');
    if (distSel) distSel.value = distParam;
  }
});

document.getElementById('blood-request-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const errorEl   = document.getElementById('request-error');
  const errorMsg  = document.getElementById('request-error-msg');
  const successEl = document.getElementById('request-success');
  const spinner   = document.getElementById('req-spinner');
  const btn       = document.getElementById('req-submit-btn');

  errorEl?.classList.add('hidden');
  successEl?.classList.add('hidden');
  spinner?.classList.remove('hidden');
  if (btn) btn.disabled = true;

  const body = {
    patientName:   document.getElementById('req-patient-name').value.trim(),
    bloodGroup:    document.getElementById('req-blood-group').value,
    hospitalName:  document.getElementById('req-hospital').value.trim(),
    division:      document.getElementById('req-division').value,
    district:      document.getElementById('req-district').value,
    upazila:       document.getElementById('req-upazila').value,
    unitsNeeded:   parseInt(document.getElementById('req-units').value, 10),
    contactNumber: document.getElementById('req-contact').value.trim(),
    dateNeeded:    document.getElementById('req-date').value
  };

  if (!body.bloodGroup) {
    errorMsg.textContent = 'Please select a blood group.';
    errorEl?.classList.remove('hidden');
    spinner?.classList.add('hidden');
    if (btn) btn.disabled = false;
    return;
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch('/api/v1/requests', {
      method: 'POST', headers, body: JSON.stringify(body)
    });

    if (!res.ok) {
      let errMsg = 'Submission failed';
      if (res.status === 401) {
        errMsg = 'Please log in to submit a blood request.';
      } else {
        try { const err = await res.json(); errMsg = err.error || errMsg; } catch (_) {}
      }
      throw new Error(errMsg);
    }

    successEl?.classList.remove('hidden');
    // Update message if element exists
    const successTitle = successEl?.querySelector('p:first-child');
    if (successTitle) successTitle.textContent = '✅ Request submitted! Redirecting...';
    document.getElementById('blood-request-form').reset();
    successEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { window.location.href = '/my-requests'; }, 2000);
  } catch (err) {
    errorMsg.textContent = err.message || 'Failed to submit. Try again.';
    errorEl?.classList.remove('hidden');
  } finally {
    spinner?.classList.add('hidden');
    if (btn) btn.disabled = false;
  }
});
