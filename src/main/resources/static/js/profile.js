// ══════════════════════════════════════════════════════════
// profile.js — User profile management
// ══════════════════════════════════════════════════════════

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let currentUser  = null;
let originalData = {};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById('auth-guard')?.classList.remove('hidden');
    document.getElementById('profile-content')?.classList.add('hidden');
    return;
  }
  document.getElementById('auth-guard')?.classList.add('hidden');
  const pc = document.getElementById('profile-content');
  if (pc) { pc.classList.remove('hidden'); pc.style.display = ''; }
  currentUser = user;
  const token = await user.getIdToken(true);
  localStorage.setItem('hemo_id_token', token);
  setupNav();
  await loadProfile(token);
  setupToggleListener();
  await loadRequests(token);
  await loadDonationHistory(token);
  setupDonationHistoryForm(token);
});

// ── Load profile ──────────────────────────────────────────

async function loadProfile(token) {
  try {
    const res = await fetch('/api/v1/users/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 404) {
      // New user (Google sign-in skipped step 2)
      set('profile-name',  currentUser.displayName || 'New User');
      set('profile-email', currentUser.email || '');
      return;
    }
    if (!res.ok) throw new Error();
    const profile = await res.json();
    originalData = profile;
    fillForm(profile);
    initLocationTab(profile);
  } catch {
    set('profile-name', 'Error loading profile');
  }
}

function fillForm(p) {
  set('profile-name',       p.name       || 'Unnamed');
  set('profile-email',      p.email      || '');
  set('profile-blood-group', p.bloodGroup || '—');

  val('edit-name',          p.name);
  val('edit-phone',         p.phone);
  val('edit-blood-group',   p.bloodGroup);
  val('edit-last-donation', p.lastDonationDate || '');

  // Profile photo
  if (p.profilePhotoUrl) {
    setAvatarPhoto(p.profilePhotoUrl);
    localStorage.setItem('hemo_user_photo', p.profilePhotoUrl);
    if (typeof window._navSetProfilePhoto === 'function') {
      window._navSetProfilePhoto(p.profilePhotoUrl);
    }
  }

  // Toggle: update value + visual but do NOT re-attach listener
  const toggle = document.getElementById('availability-toggle');
  const label  = document.getElementById('availability-status-text');
  if (toggle) {
    toggle.checked = p.available;
    updateToggleVisual(p.available);
    if (label) label.textContent = p.available
      ? 'You are available to donate'
      : 'Marked as unavailable';
  }
}

function setAvatarPhoto(url) {
  const img       = document.getElementById('avatar-img');
  const initials  = document.getElementById('avatar-initials');
  if (img) {
    img.src = url;
    img.style.display = 'block';
    if (initials) initials.style.display = 'none';
  }
}

// Toggle listener — visual only, DB save happens on form submit
function setupToggleListener() {
  const toggle = document.getElementById('availability-toggle');
  if (!toggle) return;
  toggle.addEventListener('change', (e) => {
    const isOn = e.target.checked;
    updateToggleVisual(isOn);
    const label = document.getElementById('availability-status-text');
    if (label) label.textContent = isOn
      ? 'You are available to donate'
      : 'Marked as unavailable';
    // Note: DB is NOT updated here — only updated when Save Changes is clicked
  });
}

// ── Profile form submit ───────────────────────────────────

document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const token = await currentUser.getIdToken();

  // Read current toggle state before anything else
  const currentToggle = document.getElementById('availability-toggle');
  const currentAvailable = currentToggle ? currentToggle.checked : null;

  const body = {
    name:             document.getElementById('edit-name').value.trim(),
    phone:            document.getElementById('edit-phone').value.trim(),
    bloodGroup:       document.getElementById('edit-blood-group').value,
    lastDonationDate: document.getElementById('edit-last-donation').value || null,
    isAvailable:      currentAvailable
  };
  try {
    const res = await fetch('/api/v1/users/me', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error();
    const updated = await res.json();

    // Auto-calculate availability based on last donation date
    if (updated.lastDonationDate) {
      const donationDate = new Date(updated.lastDonationDate);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const shouldBeAvailable = donationDate <= cutoff;
      if (updated.available !== shouldBeAvailable) {
        updated.available = shouldBeAvailable;
      }
    }

    originalData = updated;
    fillForm(updated);

    // Force toggle visual in next tick — ensures fillForm DOM updates are done
    setTimeout(() => {
      const tog = document.getElementById('availability-toggle');
      if (tog) {
        tog.checked = updated.available;
        updateToggleVisual(updated.available);
      }
      const lbl = document.getElementById('availability-status-text');
      if (lbl) lbl.textContent = updated.available
        ? 'You are available to donate'
        : 'Marked as unavailable';
    }, 0);

    flash('save-success');
  } catch {
    flash('save-error');
  }
});

document.getElementById('reset-profile-btn')?.addEventListener('click', () => {
  if (originalData) fillForm(originalData);
});

async function patchProfile(patch) {
  if (!currentUser) return;
  const token = await currentUser.getIdToken();
  await fetch('/api/v1/users/me', {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  });
}

// ── My Requests ───────────────────────────────────────────

async function loadRequests(token) {
  try {
    const res = await fetch('/api/v1/requests/my', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    renderRequests(await res.json(), token);
  } catch { /* silent */ }
}

function renderRequests(list, token) {
  const c = document.getElementById('my-requests-list');
  if (!c) return;

  if (!list.length) {
    c.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  padding:60px 24px;text-align:center;">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(220,38,38,0.08);
                    display:flex;align-items:center;justify-content:center;
                    font-size:1.8rem;margin-bottom:16px;">🩸</div>
        <p style="font-weight:600;font-size:1rem;color:#fff;margin-bottom:6px;">No requests yet</p>
        <p style="color:rgba(255,255,255,0.35);font-size:0.82rem;margin-bottom:20px;">
          Post a blood request and help someone in need.
        </p>
        <a href="/request-blood"
           style="background:#DC2626;color:#fff;text-decoration:none;padding:10px 22px;
                  border-radius:8px;font-size:0.82rem;font-weight:600;transition:background 200ms;"
           onmouseover="this.style.background='#b91c1c'"
           onmouseout="this.style.background='#DC2626'">
          Post a Request →
        </a>
      </div>`;
    return;
  }

  c.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px;">${list.map(r => reqCard(r)).join('')}</div>`;
  injectProfileEditModal(token);
}

function reqCard(r) {
  const statusColor = r.status === 'PENDING'
    ? { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', dot: '#f59e0b' }
    : r.status === 'FULFILLED'
    ? { bg: 'rgba(34,197,94,0.10)', color: '#86efac', dot: '#22c55e' }
    : { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', dot: '#555' };

  const badge = `<span style="background:${statusColor.bg};color:${statusColor.color};
    padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:600;
    display:inline-flex;align-items:center;gap:5px;white-space:nowrap;">
    <span style="width:6px;height:6px;border-radius:50%;background:${statusColor.dot};flex-shrink:0;"></span>
    ${r.status}
  </span>`;

  const actions = r.status === 'PENDING' ? `
    <div style="display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05);">
      <button onclick="openProfileEditModal('${escAttr(JSON.stringify(r))}')"
              style="display:flex;align-items:center;gap:5px;font-size:0.75rem;font-weight:600;
                     color:#93c5fd;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);
                     padding:6px 12px;border-radius:7px;cursor:pointer;font-family:'Space Grotesk',sans-serif;
                     transition:background 200ms;"
              onmouseover="this.style.background='rgba(59,130,246,0.15)'"
              onmouseout="this.style.background='rgba(59,130,246,0.08)'">
        ✏️ Edit
      </button>
      <button onclick="changeStatus('${r.id}','FULFILLED')"
              style="display:flex;align-items:center;gap:5px;font-size:0.75rem;font-weight:600;
                     color:#86efac;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);
                     padding:6px 12px;border-radius:7px;cursor:pointer;font-family:'Space Grotesk',sans-serif;
                     transition:background 200ms;"
              onmouseover="this.style.background='rgba(34,197,94,0.15)'"
              onmouseout="this.style.background='rgba(34,197,94,0.08)'">
        ✅ Fulfilled
      </button>
      <button onclick="changeStatus('${r.id}','CANCELLED')"
              style="display:flex;align-items:center;gap:5px;font-size:0.75rem;font-weight:500;
                     color:rgba(255,255,255,0.35);background:transparent;border:1px solid rgba(255,255,255,0.08);
                     padding:6px 12px;border-radius:7px;cursor:pointer;font-family:'Space Grotesk',sans-serif;
                     transition:all 200ms;"
              onmouseover="this.style.background='rgba(255,255,255,0.06)';this.style.color='rgba(255,255,255,0.6)'"
              onmouseout="this.style.background='transparent';this.style.color='rgba(255,255,255,0.35)'">
        ✕ Cancel
      </button>
    </div>` : '';

  return `
  <div style="background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:18px 20px;
              transition:border-color 200ms;"
       onmouseover="this.style.borderColor='#2a2a2a'"
       onmouseout="this.style.borderColor='#1e1e1e'">

    <!-- Top row: blood group + name + status badge -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:42px;height:42px;border-radius:50%;background:rgba(220,38,38,0.15);
                    border:1px solid rgba(220,38,38,0.25);color:#DC2626;
                    display:flex;align-items:center;justify-content:center;
                    font-size:0.82rem;font-weight:700;flex-shrink:0;">
          ${esc(r.bloodGroup || '?')}
        </div>
        <div>
          <div style="font-size:0.92rem;font-weight:600;color:#fff;line-height:1.3;">${esc(r.patientName)}</div>
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:2px;">${esc(r.hospitalName)}</div>
        </div>
      </div>
      ${badge}
    </div>

    <!-- Info grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
      <div style="display:flex;align-items:center;gap:7px;">
        <span style="font-size:0.78rem;color:rgba(255,255,255,0.2);"><i class="fas fa-map-marker-alt"></i></span>
        <span style="font-size:0.78rem;color:rgba(255,255,255,0.45);">${esc(r.district || '—')}</span>
      </div>
      <div style="display:flex;align-items:center;gap:7px;">
        <span style="font-size:0.78rem;color:#DC2626;"><i class="fas fa-tint"></i></span>
        <span style="font-size:0.78rem;color:rgba(255,255,255,0.45);">${r.unitsNeeded} unit${r.unitsNeeded > 1 ? 's' : ''} needed</span>
      </div>
      <div style="display:flex;align-items:center;gap:7px;">
        <span style="font-size:0.78rem;color:rgba(255,255,255,0.2);"><i class="fas fa-calendar"></i></span>
        <span style="font-size:0.78rem;color:rgba(255,255,255,0.45);">${r.dateNeeded ? fmtDate(r.dateNeeded) : '—'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:7px;">
        <span style="font-size:0.78rem;color:rgba(255,255,255,0.2);"><i class="fas fa-phone"></i></span>
        <span style="font-size:0.78rem;color:rgba(255,255,255,0.45);">${esc(r.contactNumber || '—')}</span>
      </div>
    </div>

    ${actions}
  </div>`;
}

window.changeStatus = async function(id, status) {
  if (!currentUser) return;
  const token = await currentUser.getIdToken();
  const res = await fetch('/api/v1/requests/' + id + '/status', {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (res.ok) await loadRequests(token);
};

// ── Location Tab ──────────────────────────────────────────

function initLocationTab(profile) {
  // Populate division dropdown from BD_LOCATIONS
  const divSel  = document.getElementById('loc-division');
  const distSel = document.getElementById('loc-district');
  const upaSel  = document.getElementById('loc-upazila');
  if (!divSel) return;

  const locs = window.BD_LOCATIONS || {};

  // Build division options
  divSel.innerHTML = '<option value="">Select Division</option>';
  Object.keys(locs).sort().forEach(div => {
    const opt = document.createElement('option');
    opt.value = div; opt.textContent = div;
    divSel.appendChild(opt);
  });

  // Cascading: division → district
  divSel.addEventListener('change', function() {
    const div = this.value;
    distSel.innerHTML = '<option value="">Select District</option>';
    upaSel.innerHTML  = '<option value="">Select Upazila</option>';
    if (div && locs[div]) {
      Object.keys(locs[div]).sort().forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        distSel.appendChild(opt);
      });
    }
  });

  // Cascading: district → upazila
  distSel.addEventListener('change', function() {
    const div  = divSel.value;
    const dist = this.value;
    upaSel.innerHTML = '<option value="">Select Upazila</option>';
    if (div && dist && locs[div] && locs[div][dist]) {
      locs[div][dist].sort().forEach(u => {
        const opt = document.createElement('option');
        opt.value = u; opt.textContent = u;
        upaSel.appendChild(opt);
      });
    }
  });

  // Pre-fill from existing profile
  if (profile) {
    if (profile.division) {
      divSel.value = profile.division;
      divSel.dispatchEvent(new Event('change'));
      setTimeout(() => {
        if (profile.district) {
          distSel.value = profile.district;
          distSel.dispatchEvent(new Event('change'));
          setTimeout(() => { if (profile.upazila) upaSel.value = profile.upazila; }, 50);
        }
      }, 50);
    }
    if (profile.latitude && profile.longitude) {
      document.getElementById('loc-lat').value = profile.latitude;
      document.getElementById('loc-lng').value = profile.longitude;
      const coordWrap = document.getElementById('gps-coords-wrap');
      if (coordWrap) {
        coordWrap.style.display = 'block';
        const dispLat = document.getElementById('disp-lat');
        const dispLng = document.getElementById('disp-lng');
        if (dispLat) dispLat.textContent = profile.latitude.toFixed(6);
        if (dispLng) dispLng.textContent = profile.longitude.toFixed(6);
      }
    }
    if (profile.locationUpdatedAt) {
      const el = document.getElementById('loc-last-updated');
      if (el) {
        el.style.display = 'block';
        el.textContent = 'Last updated: ' + new Date(profile.locationUpdatedAt).toLocaleString('en-BD');
      }
    }
  }

  // GPS button
  document.getElementById('gps-btn')?.addEventListener('click', function() {
    const status = document.getElementById('gps-status');
    if (status) { status.style.display = 'block'; status.innerHTML = '<i class="fas fa-satellite-dish"></i> Getting your location...'; }

    if (!navigator.geolocation) {
      if (status) status.textContent = '❌ Geolocation is not supported by your browser.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function(pos) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        document.getElementById('loc-lat').value = lat;
        document.getElementById('loc-lng').value = lng;

        const coordWrap = document.getElementById('gps-coords-wrap');
        if (coordWrap) coordWrap.style.display = 'block';
        const dispLat = document.getElementById('disp-lat');
        const dispLng = document.getElementById('disp-lng');
        if (dispLat) dispLat.textContent = lat.toFixed(6);
        if (dispLng) dispLng.textContent = lng.toFixed(6);

        if (status) { status.textContent = '✅ GPS coordinates captured! Now select your division/district/upazila below.'; }
        window.toast?.('GPS location captured!', 'success');
      },
      function(err) {
        let msg = 'Unable to retrieve location.';
        if (err.code === 1) msg = '❌ Location permission denied. Please allow location access.';
        if (err.code === 2) msg = '❌ Location unavailable. Try again.';
        if (err.code === 3) msg = '❌ Location request timed out. Try again.';
        if (status) status.textContent = msg;
        window.toast?.(msg, 'error');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });

  // Save location button
  document.getElementById('save-location-btn')?.addEventListener('click', async function() {
    const token = currentUser ? await currentUser.getIdToken() : localStorage.getItem('hemo_id_token');
    const lat   = document.getElementById('loc-lat').value;
    const lng   = document.getElementById('loc-lng').value;

    const body = {
      latitude:  lat  ? parseFloat(lat)  : null,
      longitude: lng  ? parseFloat(lng)  : null,
      division:  divSel.value  || null,
      district:  distSel.value || null,
      upazila:   upaSel.value  || null,
    };

    if (!body.division && !body.latitude) {
      window.toast?.('Please select a division or use GPS first.', 'error');
      return;
    }

    this.textContent = 'Saving...';
    this.disabled = true;

    try {
      const res = await fetch('/api/v1/users/me/location', {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      const el = document.getElementById('loc-last-updated');
      if (el && updated.locationUpdatedAt) {
        el.style.display = 'block';
        el.textContent = 'Last updated: ' + new Date(updated.locationUpdatedAt).toLocaleString('en-BD');
      }
      window.toast?.('Location saved!', 'success');
    } catch {
      window.toast?.('Failed to save location.', 'error');
    } finally {
      this.textContent = 'Save Location';
      this.innerHTML = '<i class="fas fa-save"></i> Save Location';
      this.disabled = false;
    }
  });
}

// ── Profile-page Edit Modal ───────────────────────────────

let _profileEditToken = null;

function injectProfileEditModal(token) {
  _profileEditToken = token;
  if (document.getElementById('profile-edit-req-modal')) return;

  const bloodGroups = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
  const bgOptions = bloodGroups.map(g => `<option value="${g}">${g}</option>`).join('');

  const modal = document.createElement('div');
  modal.id = 'profile-edit-req-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.style.cssText = `
    display:none;position:fixed;inset:0;z-index:9000;
    background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);
    align-items:center;justify-content:center;padding:24px;`;

  modal.innerHTML = `
    <div style="background:#141414;border:1px solid #333;border-radius:16px;
                padding:28px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;
                position:relative;font-family:'Space Grotesk',sans-serif;">
      <button onclick="closeProfileEditModal()" type="button" aria-label="Close"
              style="position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.07);
                     border:none;color:#fff;width:30px;height:30px;border-radius:50%;
                     font-size:0.9rem;cursor:pointer;">✕</button>
      <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:20px;">✏️ Edit Blood Request</h3>
      <input type="hidden" id="pedit-req-id"/>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div style="grid-column:1/-1;">
          <label style="display:block;font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">Patient Name</label>
          <input type="text" id="pedit-patient" class="input-field" style="font-family:'Space Grotesk',sans-serif;"/>
        </div>
        <div>
          <label style="display:block;font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">Blood Group</label>
          <select id="pedit-bg" class="input-field" style="font-family:'Space Grotesk',sans-serif;">${bgOptions}</select>
        </div>
        <div>
          <label style="display:block;font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">Units</label>
          <input type="number" id="pedit-units" min="1" max="10" class="input-field" style="font-family:'Space Grotesk',sans-serif;"/>
        </div>
        <div style="grid-column:1/-1;">
          <label style="display:block;font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">Hospital Name</label>
          <input type="text" id="pedit-hospital" class="input-field" style="font-family:'Space Grotesk',sans-serif;"/>
        </div>
        <div>
          <label style="display:block;font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">District</label>
          <input type="text" id="pedit-district" class="input-field" style="font-family:'Space Grotesk',sans-serif;"/>
        </div>
        <div>
          <label style="display:block;font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">Date Needed</label>
          <input type="date" id="pedit-date" class="input-field" style="font-family:'Space Grotesk',sans-serif;color-scheme:dark;"/>
        </div>
        <div style="grid-column:1/-1;">
          <label style="display:block;font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">Contact Number</label>
          <input type="tel" id="pedit-contact" class="input-field" style="font-family:'Space Grotesk',sans-serif;"/>
        </div>
      </div>
      <div id="pedit-error" style="display:none;margin-top:12px;background:rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.3);color:#fca5a5;font-size:0.8rem;border-radius:8px;padding:10px 14px;"></div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
        <button onclick="closeProfileEditModal()" type="button" class="btn-secondary">Cancel</button>
        <button id="pedit-save-btn" onclick="saveProfileEdit()" type="button" class="btn-primary"><i class="fas fa-save"></i> Save</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeProfileEditModal(); });
}

window.openProfileEditModal = function(encodedJson) {
  const r = JSON.parse(encodedJson);
  document.getElementById('pedit-req-id').value   = r.id;
  document.getElementById('pedit-patient').value  = r.patientName  || '';
  document.getElementById('pedit-bg').value       = r.bloodGroup   || '';
  document.getElementById('pedit-units').value    = r.unitsNeeded  || 1;
  document.getElementById('pedit-hospital').value = r.hospitalName || '';
  document.getElementById('pedit-district').value = r.district     || '';
  document.getElementById('pedit-date').value     = r.dateNeeded   || '';
  document.getElementById('pedit-contact').value  = r.contactNumber|| '';
  document.getElementById('pedit-error').style.display = 'none';
  const modal = document.getElementById('profile-edit-req-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.closeProfileEditModal = function() {
  const modal = document.getElementById('profile-edit-req-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
};

window.saveProfileEdit = async function() {
  const id      = document.getElementById('pedit-req-id').value;
  const errBox  = document.getElementById('pedit-error');
  const saveBtn = document.getElementById('pedit-save-btn');
  const token   = _profileEditToken || localStorage.getItem('hemo_id_token');

  const body = {
    patientName:   document.getElementById('pedit-patient').value.trim(),
    bloodGroup:    document.getElementById('pedit-bg').value,
    unitsNeeded:   parseInt(document.getElementById('pedit-units').value) || 1,
    hospitalName:  document.getElementById('pedit-hospital').value.trim(),
    district:      document.getElementById('pedit-district').value.trim(),
    dateNeeded:    document.getElementById('pedit-date').value || null,
    contactNumber: document.getElementById('pedit-contact').value.trim(),
  };

  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;

  try {
    const res = await fetch('/api/v1/requests/' + id, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json();
      errBox.textContent = err.error || 'Failed to save.';
      errBox.style.display = 'block';
      return;
    }
    window.closeProfileEditModal();
    window.toast?.('Request updated!', 'success');
    await loadRequests(token);
  } catch {
    errBox.textContent = 'Network error.';
    errBox.style.display = 'block';
  } finally {
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
    saveBtn.disabled = false;
  }
};

// ── Donation History Tab ──────────────────────────────────

async function loadDonationHistory(token) {
  try {
    const [histRes, countRes] = await Promise.all([
      fetch('/api/v1/donations/my', { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch('/api/v1/donations/my/count', { headers: { 'Authorization': 'Bearer ' + token } })
    ]);

    const history = histRes.ok ? await histRes.json() : [];
    const countData = countRes.ok ? await countRes.json() : { count: 0 };
    const count = countData.count || 0;

    // Update tab badge
    const badge = document.getElementById('donation-count-badge');
    if (badge && count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline';
    }

    // Update sidebar donation count
    const sidebarCount = document.getElementById('sidebar-donation-count');
    if (sidebarCount) {
      sidebarCount.textContent = count + ' donation' + (count !== 1 ? 's' : '');
    }

    renderDonationHistory(history);
  } catch {
    const list = document.getElementById('donation-history-list');
    if (list) list.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);">Failed to load history.</div>';
  }
}

function renderDonationHistory(list) {
  const container = document.getElementById('donation-history-list');
  if (!container) return;

  if (!list.length) {
    container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 0;text-align:center;">'
      + '<div style="font-size:3rem;opacity:0.2;margin-bottom:12px;">🩸</div>'
      + '<p style="color:rgba(255,255,255,0.4);font-size:0.85rem;">No donations logged yet.</p>'
      + '<p style="color:rgba(255,255,255,0.25);font-size:0.78rem;margin-top:6px;">Click "Log a Donation" to add your first entry.</p>'
      + '</div>';
    return;
  }

  container.innerHTML = '<div style="display:flex;flex-direction:column;gap:12px;">'
    + list.map(function(h) {
      // Build location string
      const locationParts = [];
      if (h.upazila) locationParts.push(h.upazila);
      if (h.district) locationParts.push(h.district);
      if (h.division) locationParts.push(h.division);
      const location = locationParts.length > 0 ? locationParts.join(', ') : '';
      
      return '<div style="background:#1C1C1C;border:1px solid #1C1C1C;border-radius:10px;padding:16px;'
        + 'display:flex;align-items:flex-start;justify-content:space-between;gap:16px;'
        + 'transition:border-color 200ms;" onmouseover="this.style.borderColor=\'#333\'" onmouseout="this.style.borderColor=\'#1C1C1C\'">'
        + '<div style="display:flex;align-items:center;gap:12px;">'
        + '<div style="width:38px;height:38px;border-radius:50%;background:#DC2626;color:#fff;'
        + 'display:flex;align-items:center;justify-content:center;font-size:0.78rem;font-weight:700;flex-shrink:0;">'
        + esc(h.bloodGroup || '?') + '</div>'
        + '<div>'
        + '<div style="font-size:0.9rem;font-weight:600;color:#fff;">' + esc(h.hospitalName || '—') + '</div>'
        + '<div style="font-size:0.75rem;color:rgba(255,255,255,0.35);margin-top:2px;">'
        + (location ? esc(location) + ' · ' : '') + fmtDate(h.donatedAt)
        + '</div>'
        + (h.notes ? '<div style="font-size:0.75rem;color:rgba(255,255,255,0.25);margin-top:3px;font-style:italic;">' + esc(h.notes) + '</div>' : '')
        + '</div></div>'
        + '<div style="text-align:right;flex-shrink:0;">'
        + '<div style="background:rgba(220,38,38,0.12);color:#DC2626;border-radius:20px;padding:3px 10px;font-size:0.72rem;font-weight:600;">'
        + h.unitsGiven + (h.unitsGiven === 1 ? ' unit' : ' units') + '</div>'
        + '</div></div>';
    }).join('')
    + '</div>';
}

function setupDonationHistoryForm(token) {
  const logBtn    = document.getElementById('log-donation-btn');
  const form      = document.getElementById('log-donation-form');
  const cancelBtn = document.getElementById('dh-cancel-btn');
  const submitBtn = document.getElementById('dh-submit-btn');
  if (!logBtn || !form) return;

  // Set today as default date
  const dateInput = document.getElementById('dh-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Initialize location dropdowns
  initDonationLocationDropdowns();

  logBtn.addEventListener('click', function() {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });
  cancelBtn?.addEventListener('click', function() { form.style.display = 'none'; });

  submitBtn?.addEventListener('click', async function() {
    const errBox = document.getElementById('dh-error');
    const hospital = document.getElementById('dh-hospital')?.value.trim();
    const date     = document.getElementById('dh-date')?.value;

    if (!hospital) {
      errBox.textContent = 'Hospital name is required.';
      errBox.style.display = 'block';
      return;
    }
    if (!date) {
      errBox.textContent = 'Donation date is required.';
      errBox.style.display = 'block';
      return;
    }

    const body = {
      hospitalName: hospital,
      division:     document.getElementById('dh-division')?.value || null,
      district:     document.getElementById('dh-district')?.value || null,
      upazila:      document.getElementById('dh-upazila')?.value || null,
      unitsGiven:   parseInt(document.getElementById('dh-units')?.value) || 1,
      donatedAt:    date,
      notes:        document.getElementById('dh-notes')?.value.trim() || null,
    };

    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    errBox.style.display = 'none';

    try {
      const res = await fetch('/api/v1/donations/log', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json();
        errBox.textContent = err.error || 'Failed to save.';
        errBox.style.display = 'block';
        return;
      }
      form.style.display = 'none';
      // Reset form
      ['dh-hospital','dh-notes'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      // Reset dropdowns
      document.getElementById('dh-division').value = '';
      document.getElementById('dh-district').innerHTML = '<option value="">Select District</option>';
      document.getElementById('dh-upazila').innerHTML = '<option value="">Select Upazila</option>';
      document.getElementById('dh-units')?.setAttribute('value', '1');

      window.toast?.('Donation logged successfully!', 'success');
      await loadDonationHistory(token);
      // Reload profile to refresh lastDonationDate display
      await loadProfile(token);
    } catch {
      errBox.textContent = 'Network error. Please try again.';
      errBox.style.display = 'block';
    } finally {
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Donation';
      submitBtn.disabled = false;
    }
  });
}

// Initialize cascading location dropdowns for donation form
function initDonationLocationDropdowns() {
  const locs = window.BD_LOCATIONS;
  const divSel = document.getElementById('dh-division');
  const distSel = document.getElementById('dh-district');
  const upaSel = document.getElementById('dh-upazila');

  if (!divSel || !locs) {
    console.warn('Location dropdowns or BD_LOCATIONS not available');
    return;
  }

  // Populate divisions
  const divisions = Object.keys(locs).sort();
  divisions.forEach(div => {
    const opt = document.createElement('option');
    opt.value = div;
    opt.textContent = div;
    divSel.appendChild(opt);
  });

  // Division change → populate districts
  divSel.addEventListener('change', function() {
    const div = this.value;
    distSel.innerHTML = '<option value="">Select District</option>';
    upaSel.innerHTML = '<option value="">Select Upazila</option>';
    
    if (div && locs[div]) {
      Object.keys(locs[div]).sort().forEach(dist => {
        const opt = document.createElement('option');
        opt.value = dist;
        opt.textContent = dist;
        distSel.appendChild(opt);
      });
    }
  });

  // District change → populate upazilas
  distSel.addEventListener('change', function() {
    const div = divSel.value;
    const dist = this.value;
    upaSel.innerHTML = '<option value="">Select Upazila</option>';
    
    if (div && dist && locs[div] && locs[div][dist]) {
      locs[div][dist].sort().forEach(upa => {
        const opt = document.createElement('option');
        opt.value = upa;
        opt.textContent = upa;
        upaSel.appendChild(opt);
      });
    }
  });
}

// ── Helpers ───────────────────────────────────────────────

function fmtDate(str) {
  try { return new Date(str).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return str || '—'; }
}

function escAttr(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;');
}

function setupNav() {
  if (typeof window._navApplyAuthState === 'function') {
    window._navApplyAuthState(true);
  } else {
    const out = document.getElementById('nav-logged-out');
    const inn = document.getElementById('nav-logged-in');
    if (out) out.style.setProperty('display', 'none', 'important');
    if (inn) inn.style.setProperty('display', 'flex', 'important');
  }
  // Note: logout is handled via event delegation in auth-state.js — no listener needed here
}

function flash(id) {
  if (id === 'save-success') {
    window.toast?.('Profile updated successfully!', 'success');
  } else if (id === 'save-error') {
    window.toast?.('Failed to update profile. Try again.', 'error');
  }
  // Keep old hidden div fallback
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); setTimeout(() => el?.classList.add('hidden'), 3000); }
}

function set(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function val(id, v)    { const el = document.getElementById(id); if (el) el.value = v || ''; }

function updateToggleVisual(isOn) {
  const track = document.getElementById('toggle-track');
  const thumb = document.getElementById('toggle-thumb');
  if (track) track.style.background = isOn ? '#16a34a' : '#333';
  if (thumb) thumb.style.left = isOn ? '20px' : '2px';
}

function statusCls(s) {
  if (s === 'PENDING')   return 'background:rgba(245,158,11,0.15);color:#fbbf24;';
  if (s === 'FULFILLED') return 'background:rgba(34,197,94,0.12);color:#86efac;';
  return 'background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);';
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
