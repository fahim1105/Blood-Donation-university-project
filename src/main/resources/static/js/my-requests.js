// ══════════════════════════════════════════════════════════
// my-requests.js — My Requests page (standalone)
// Features: view, edit, status change, donor responses
// ══════════════════════════════════════════════════════════

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let userToken = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById('my-req-auth-guard')?.classList.remove('hidden');
    document.getElementById('my-requests-container')?.classList.add('hidden');
    return;
  }
  document.getElementById('my-req-auth-guard')?.classList.add('hidden');
  document.getElementById('my-requests-container')?.classList.remove('hidden');
  userToken = await user.getIdToken(true);
  localStorage.setItem('hemo_id_token', userToken);
  setupNav();
  injectEditModal();
  await loadRequests();
});

// ── Load & render ─────────────────────────────────────────

async function loadRequests() {
  try {
    const res = await fetch('/api/v1/requests/my', {
      headers: { 'Authorization': 'Bearer ' + userToken }
    });
    if (!res.ok) throw new Error();
    render(await res.json());
  } catch {
    const c = document.getElementById('my-requests-container');
    if (c) c.innerHTML = '<div style="text-align:center;padding:60px;color:rgba(255,255,255,0.4);">Failed to load requests.</div>';
  }
}

function render(list) {
  const c = document.getElementById('my-requests-container');
  if (!c) return;

  if (!list.length) {
    c.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;text-align:center;">'
      + '<i class="fas fa-tint" style="font-size:3rem;margin-bottom:16px;opacity:0.25;color:#dc3545;"></i>'
      + '<p style="color:#fff;font-size:1.1rem;font-weight:600;margin-bottom:8px;">No blood requests yet</p>'
      + '<p style="color:rgba(255,255,255,0.35);font-size:0.85rem;margin-bottom:24px;">When you submit a request, it will appear here.</p>'
      + '<a href="/request-blood" style="background:#DC2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:0.85rem;font-weight:600;">Post a Request →</a>'
      + '</div>';
    return;
  }

  c.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">'
    + list.map(cardHtml).join('')
    + '</div>';
}

function cardHtml(r) {
  const statusStyle = r.status === 'PENDING'
    ? 'background:rgba(245,158,11,0.15);color:#fbbf24;'
    : r.status === 'FULFILLED'
    ? 'background:rgba(34,197,94,0.12);color:#86efac;'
    : 'background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);';

  // Donor response count badge (only for PENDING)
  const activeResponses = r.donorResponses
    ? r.donorResponses.filter(function(x) { return x.status === 'OFFERED'; }).length
    : 0;

  const responseBadge = r.status === 'PENDING'
    ? '<button onclick="toggleResponses(\'' + esc(r.id) + '\')" '
      + 'style="background:' + (activeResponses > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)') + ';'
      + 'color:' + (activeResponses > 0 ? '#86efac' : 'rgba(255,255,255,0.35)') + ';'
      + 'border:1px solid ' + (activeResponses > 0 ? 'rgba(34,197,94,0.25)' : '#2a2a2a') + ';'
      + 'padding:4px 12px;border-radius:20px;font-size:0.72rem;font-weight:600;cursor:pointer;'
      + 'font-family:\'Space Grotesk\',sans-serif;margin-top:8px;">'
      + (activeResponses > 0 ? '<i class="fas fa-tint"></i> ' + activeResponses + ' donor' + (activeResponses > 1 ? 's' : '') + ' responded' : '<i class="fas fa-tint"></i> No responses yet')
      + '</button>'
    : '';

  const actions = r.status === 'PENDING'
    ? '<div style="display:flex;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid #1C1C1C;">'
      + '<button onclick="openEditModal(\'' + escAttr(JSON.stringify(r)) + '\')" '
      + 'style="flex:1;background:rgba(59,130,246,0.1);color:#93c5fd;border:1px solid rgba(59,130,246,0.2);'
      + 'padding:9px 0;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;">✏️ Edit</button>'
      + '<button onclick="changeStatus(\'' + esc(r.id) + '\',\'FULFILLED\')" '
      + 'style="flex:1;background:rgba(34,197,94,0.1);color:#86efac;border:1px solid rgba(34,197,94,0.2);'
      + 'padding:9px 0;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;"><i class="fas fa-check-circle"></i> Fulfilled</button>'
      + '<button onclick="changeStatus(\'' + esc(r.id) + '\',\'CANCELLED\')" '
      + 'style="flex:1;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);border:1px solid #2a2a2a;'
      + 'padding:9px 0;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;">✕ Cancel</button>'
      + '</div>'
    : '';

  return '<div id="req-card-' + esc(r.id) + '" style="background:#141414;border:1px solid #1C1C1C;border-radius:12px;padding:20px;">'
    + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">'
    + '<div style="display:flex;align-items:center;gap:12px;">'
    + '<div style="width:44px;height:44px;border-radius:50%;background:#DC2626;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;flex-shrink:0;">'
    + esc(r.bloodGroup) + '</div>'
    + '<div><div style="font-size:0.95rem;font-weight:600;color:#fff;">' + esc(r.patientName) + '</div>'
    + '<div style="font-size:0.78rem;color:rgba(255,255,255,0.35);margin-top:2px;">' + esc(r.hospitalName) + '</div></div>'
    + '</div>'
    + '<span style="' + statusStyle + 'display:inline-block;padding:4px 12px;border-radius:20px;font-size:0.72rem;font-weight:600;white-space:nowrap;">' + esc(r.status) + '</span>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 0;border-top:1px solid #1C1C1C;">'
    + '<div style="font-size:0.78rem;color:rgba(255,255,255,0.4);"><i class="fas fa-map-marker-alt"></i> ' + esc(r.district) + '</div>'
    + '<div style="font-size:0.78rem;color:rgba(255,255,255,0.4);"><i class="fas fa-tint"></i> ' + r.unitsNeeded + ' units</div>'
    + '<div style="font-size:0.78rem;color:rgba(255,255,255,0.4);"><i class="fas fa-calendar"></i> ' + (r.dateNeeded || '—') + '</div>'
    + '<div style="font-size:0.78rem;color:rgba(255,255,255,0.4);"><i class="fas fa-phone"></i> ' + esc(r.contactNumber) + '</div>'
    + '</div>'
    + responseBadge
    + '<div id="resp-panel-' + esc(r.id) + '" style="display:none;margin-top:12px;"></div>'
    + actions
    + '</div>';
}

// ── Donor responses panel ─────────────────────────────────

window.toggleResponses = async function(id) {
  const panel = document.getElementById('resp-panel-' + id);
  if (!panel) return;

  if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  panel.innerHTML = '<div style="font-size:0.78rem;color:rgba(255,255,255,0.3);padding:8px 0;">Loading responses...</div>';

  try {
    const res = await fetch('/api/v1/requests/' + id + '/responses', {
      headers: { 'Authorization': 'Bearer ' + userToken }
    });
    if (!res.ok) throw new Error();
    const responses = await res.json();

    if (!responses.length) {
      panel.innerHTML = '<div style="font-size:0.8rem;color:rgba(255,255,255,0.3);padding:8px 0;text-align:center;">No active responses yet.</div>';
      return;
    }

    panel.innerHTML = '<div style="border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:12px;background:rgba(34,197,94,0.04);">'
      + '<div style="font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:#86efac;margin-bottom:10px;"><i class="fas fa-tint"></i> Donors Who Responded</div>'
      + responses.map(function(r) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;margin-bottom:8px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.05);">'
          + '<div style="flex:1;">'
          + '<div style="font-size:0.85rem;font-weight:600;color:#fff;">' + esc(r.donorName || '—') + '</div>'
          + '<div style="font-size:0.75rem;color:rgba(255,255,255,0.35);margin-top:2px;">'
          + esc(r.donorBloodGroup || '?') + ' · ' + fmtDateTime(r.respondedAt)
          + '</div></div>'
          + '<div style="display:flex;gap:8px;">'
          + '<a href="tel:' + esc(r.donorPhone || '') + '" '
          + 'style="background:rgba(59,130,246,0.1);color:#93c5fd;border:1px solid rgba(59,130,246,0.2);text-decoration:none;padding:6px 12px;border-radius:6px;font-size:0.78rem;font-weight:600;">'
          + '<i class="fas fa-phone"></i></a>'
          + '<button onclick="selectDonorAndComplete(\'' + esc(id) + '\',\'' + esc(r.donorUid || '') + '\',\'' + esc(r.donorName || 'Donor') + '\')" '
          + 'style="background:#DC2626;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;transition:background 200ms;" '
          + 'onmouseover="this.style.background=\'#b91c1c\'" onmouseout="this.style.background=\'#DC2626\'">'
          + '<i class="fas fa-check"></i> Select</button>'
          + '</div>'
          + '</div>';
      }).join('')
      + '</div>';
  } catch {
    panel.innerHTML = '<div style="font-size:0.78rem;color:#fca5a5;padding:8px 0;">Failed to load responses.</div>';
  }
};

// ── Select Donor & Complete Request ───────────────────────

window.selectDonorAndComplete = async function(requestId, donorUid, donorName) {
  // Custom confirmation dialog
  const confirmed = await window.customConfirm(
    'Complete Blood Request',
    'Confirm selecting <strong>' + donorName + '</strong> as the donor?<br><br>This will:<br>• Mark request as <strong>FULFILLED</strong><br>• Update donor\'s last donation date<br>• Add to donation history',
    'Yes, Complete Request',
    'Cancel'
  );
  
  if (!confirmed) {
    return;
  }

  try {
    const res = await fetch('/api/v1/requests/' + requestId + '/complete', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ donorUid: donorUid })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to complete request');
    }

    const result = await res.json();
    window.toast?.('✅ Request completed! ' + donorName + '\'s profile has been updated.', 'success');
    
    // Reload requests to show updated status
    await loadRequests();

  } catch (error) {
    console.error('Error completing request:', error);
    window.toast?.(error.message || 'Failed to complete request. Please try again.', 'error');
  }
};

// ── Edit Modal ────────────────────────────────────────────

function injectEditModal() {
  if (document.getElementById('edit-req-modal')) return;

  const bgOptions = ['A+','A-','B+','B-','O+','O-','AB+','AB-']
    .map(function(g) { return '<option value="' + g + '">' + g + '</option>'; }).join('');

  const modal = document.createElement('div');
  modal.id = 'edit-req-modal';
  modal.setAttribute('role', 'dialog');
  modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:24px;';

  modal.innerHTML = '<div style="background:#0A0A0A;border:1px solid #1C1C1C;border-radius:12px;padding:32px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;position:relative;font-family:\'Space Grotesk\',sans-serif;box-shadow:0 24px 64px rgba(0,0,0,0.6);">'
    // Close button (X)
    + '<button id="edit-modal-close" type="button" style="position:absolute;top:20px;right:20px;background:transparent;border:none;color:rgba(255,255,255,0.4);width:40px;height:40px;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 200ms;" onmouseover="this.style.background=\'rgba(255,255,255,0.05)\';this.style.color=\'#fff\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'rgba(255,255,255,0.4)\';">×</button>'
    // Title with pencil icon
    + '<h3 style="font-size:1.3rem;font-weight:700;margin-bottom:32px;color:#fff;display:flex;align-items:center;gap:10px;"><span style="font-size:1.4rem;">✏️</span> Edit Blood Request</h3>'
    + '<input type="hidden" id="edit-req-id"/>'
    + '<div style="display:flex;flex-direction:column;gap:20px;">'
    // Patient Name (full width)
    + '<div>'
    + '<label style="display:block;font-size:0.75rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;">Patient Name</label>'
    + '<input type="text" id="edit-req-patient" style="width:100%;background:#141414;border:1px solid #2a2a2a;color:#fff;padding:14px 16px;border-radius:10px;font-size:0.95rem;font-family:\'Space Grotesk\',sans-serif;outline:none;transition:all 200ms;" onfocus="this.style.borderColor=\'#DC2626\';" onblur="this.style.borderColor=\'#2a2a2a\';"/></div>'
    // Blood Group + Units (2 columns)
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'
    + '<div>'
    + '<label style="display:block;font-size:0.75rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;">Blood Group</label>'
    + '<select id="edit-req-bg" style="width:100%;background:#141414;border:1px solid #2a2a2a;color:#fff;padding:14px 16px;border-radius:10px;font-size:0.95rem;font-family:\'Space Grotesk\',sans-serif;outline:none;cursor:pointer;transition:all 200ms;" onfocus="this.style.borderColor=\'#DC2626\';" onblur="this.style.borderColor=\'#2a2a2a\';">' + bgOptions + '</select></div>'
    + '<div>'
    + '<label style="display:block;font-size:0.75rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;">Units</label>'
    + '<input type="number" id="edit-req-units" min="1" max="10" style="width:100%;background:#141414;border:1px solid #2a2a2a;color:#fff;padding:14px 16px;border-radius:10px;font-size:0.95rem;font-family:\'Space Grotesk\',sans-serif;outline:none;transition:all 200ms;" onfocus="this.style.borderColor=\'#DC2626\';" onblur="this.style.borderColor=\'#2a2a2a\';"/></div>'
    + '</div>'
    // Hospital Name (full width)
    + '<div>'
    + '<label style="display:block;font-size:0.75rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;">Hospital Name</label>'
    + '<input type="text" id="edit-req-hospital" style="width:100%;background:#141414;border:1px solid #2a2a2a;color:#fff;padding:14px 16px;border-radius:10px;font-size:0.95rem;font-family:\'Space Grotesk\',sans-serif;outline:none;transition:all 200ms;" onfocus="this.style.borderColor=\'#DC2626\';" onblur="this.style.borderColor=\'#2a2a2a\';"/></div>'
    // District + Date Needed (2 columns)
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'
    + '<div>'
    + '<label style="display:block;font-size:0.75rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;">District</label>'
    + '<input type="text" id="edit-req-district" style="width:100%;background:#141414;border:1px solid #2a2a2a;color:#fff;padding:14px 16px;border-radius:10px;font-size:0.95rem;font-family:\'Space Grotesk\',sans-serif;outline:none;transition:all 200ms;" onfocus="this.style.borderColor=\'#DC2626\';" onblur="this.style.borderColor=\'#2a2a2a\';"/></div>'
    + '<div>'
    + '<label style="display:block;font-size:0.75rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;">Date Needed</label>'
    + '<input type="date" id="edit-req-date" style="width:100%;background:#141414;border:1px solid #2a2a2a;color:#fff;padding:14px 16px;border-radius:10px;font-size:0.95rem;font-family:\'Space Grotesk\',sans-serif;outline:none;color-scheme:dark;transition:all 200ms;" onfocus="this.style.borderColor=\'#DC2626\';" onblur="this.style.borderColor=\'#2a2a2a\';"/></div>'
    + '</div>'
    // Contact Number (full width)
    + '<div>'
    + '<label style="display:block;font-size:0.75rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;">Contact Number</label>'
    + '<input type="tel" id="edit-req-contact" style="width:100%;background:#141414;border:1px solid #2a2a2a;color:#fff;padding:14px 16px;border-radius:10px;font-size:0.95rem;font-family:\'Space Grotesk\',sans-serif;outline:none;transition:all 200ms;" onfocus="this.style.borderColor=\'#DC2626\';" onblur="this.style.borderColor=\'#2a2a2a\';"/></div>'
    + '</div>'
    // Error message
    + '<div id="edit-req-error" style="display:none;margin-top:20px;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);color:#fca5a5;font-size:0.85rem;border-radius:10px;padding:12px 16px;"></div>'
    // Buttons
    + '<div style="display:flex;justify-content:flex-end;gap:12px;margin-top:32px;">'
    + '<button id="edit-modal-cancel" type="button" style="background:transparent;color:rgba(255,255,255,0.5);border:1px solid #2a2a2a;padding:12px 24px;border-radius:10px;font-size:0.9rem;font-weight:500;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;transition:all 200ms;" onmouseover="this.style.color=\'#fff\';this.style.borderColor=\'#3a3a3a\';" onmouseout="this.style.color=\'rgba(255,255,255,0.5)\';this.style.borderColor=\'#2a2a2a\';">Cancel</button>'
    + '<button id="edit-modal-save" type="button" style="background:#DC2626;color:#fff;border:none;padding:12px 28px;border-radius:10px;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;box-shadow:0 4px 14px rgba(220,38,38,0.3);transition:all 200ms;display:flex;align-items:center;gap:8px;" onmouseover="this.style.background=\'#b91c1c\';this.style.boxShadow=\'0 6px 20px rgba(220,38,38,0.4)\';" onmouseout="this.style.background=\'#DC2626\';this.style.boxShadow=\'0 4px 14px rgba(220,38,38,0.3)\';"><i class="fas fa-save"></i> Save</button>'
    + '</div></div>';

  document.body.appendChild(modal);
  document.getElementById('edit-modal-close').addEventListener('click', closeEditModal);
  document.getElementById('edit-modal-cancel').addEventListener('click', closeEditModal);
  modal.addEventListener('click', function(e) { if (e.target === modal) closeEditModal(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeEditModal(); });
  document.getElementById('edit-modal-save').addEventListener('click', saveEdit);
}

window.openEditModal = function(jsonStr) {
  const r = JSON.parse(jsonStr);
  document.getElementById('edit-req-id').value      = r.id;
  document.getElementById('edit-req-patient').value  = r.patientName   || '';
  document.getElementById('edit-req-bg').value       = r.bloodGroup    || '';
  document.getElementById('edit-req-units').value    = r.unitsNeeded   || 1;
  document.getElementById('edit-req-hospital').value = r.hospitalName  || '';
  document.getElementById('edit-req-district').value = r.district      || '';
  document.getElementById('edit-req-date').value     = r.dateNeeded    || '';
  document.getElementById('edit-req-contact').value  = r.contactNumber || '';
  document.getElementById('edit-req-error').style.display = 'none';
  const modal = document.getElementById('edit-req-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

function closeEditModal() {
  const modal = document.getElementById('edit-req-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

async function saveEdit() {
  const id      = document.getElementById('edit-req-id').value;
  const errBox  = document.getElementById('edit-req-error');
  const saveBtn = document.getElementById('edit-modal-save');

  const body = {
    patientName:   document.getElementById('edit-req-patient').value.trim(),
    bloodGroup:    document.getElementById('edit-req-bg').value,
    unitsNeeded:   parseInt(document.getElementById('edit-req-units').value) || 1,
    hospitalName:  document.getElementById('edit-req-hospital').value.trim(),
    district:      document.getElementById('edit-req-district').value.trim(),
    dateNeeded:    document.getElementById('edit-req-date').value || null,
    contactNumber: document.getElementById('edit-req-contact').value.trim(),
  };

  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;

  try {
    const res = await fetch('/api/v1/requests/' + id, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + userToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json();
      errBox.textContent = err.error || 'Failed to save. Please try again.';
      errBox.style.display = 'block';
      return;
    }
    closeEditModal();
    window.toast?.('Request updated successfully!', 'success');
    await loadRequests();
  } catch {
    errBox.textContent = 'Network error. Please try again.';
    errBox.style.display = 'block';
  } finally {
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    saveBtn.disabled = false;
  }
}

// ── Status change ─────────────────────────────────────────

window.changeStatus = async function(id, status) {
  if (!userToken) return;
  const res = await fetch('/api/v1/requests/' + id + '/status', {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + userToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (res.ok) {
    window.toast?.(status === 'FULFILLED' ? 'Marked as fulfilled!' : 'Request cancelled.', 'success');
    await loadRequests();
  } else {
    window.toast?.('Failed to update status.', 'error');
  }
};

// ── Nav setup ─────────────────────────────────────────────

function setupNav() {
  if (typeof window._navApplyAuthState === 'function') {
    window._navApplyAuthState(true);
  }
}

// ── Helpers ───────────────────────────────────────────────

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// For use inside onclick attributes (single-quote-safe)
function escAttr(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;');
}

function fmtDateTime(str) {
  try { return new Date(str).toLocaleString('en-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return str || '—'; }
}
