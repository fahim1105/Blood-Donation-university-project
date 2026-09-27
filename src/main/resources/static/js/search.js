// ══════════════════════════════════════════════════════════
// search.js — Donor search with location, GPS, distance badges
// ══════════════════════════════════════════════════════════

(function () {
  let seekerLat = null;
  let seekerLng = null;

  const PAGE_SIZE   = 12;
  let   allResults  = [];
  let   currentPage = 0;

  const searchBtn    = document.getElementById('search-btn');
  const gpsBtn       = document.getElementById('gps-search-btn');
  const grid         = document.getElementById('donors-grid');
  const emptyState   = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');
  const resultsCount = document.getElementById('results-count');

  if (!searchBtn || !grid) return;

  // ── Cascading dropdowns from BD_LOCATIONS ─────────────────
  function initCascadingDropdowns() {
    const locs    = window.BD_LOCATIONS || {};
    const divSel  = document.getElementById('search-division');
    const distSel = document.getElementById('search-district');
    const upaSel  = document.getElementById('search-upazila');
    if (!divSel) return;

    divSel.innerHTML = '<option value="">All Divisions</option>';
    Object.keys(locs).sort().forEach(div => {
      const opt = document.createElement('option');
      opt.value = div; opt.textContent = div;
      divSel.appendChild(opt);
    });

    divSel.addEventListener('change', function () {
      const div = this.value;
      distSel.innerHTML = '<option value="">All Districts</option>';
      upaSel.innerHTML  = '<option value="">All Upazilas</option>';
      if (div && locs[div]) {
        Object.keys(locs[div]).sort().forEach(d => {
          const opt = document.createElement('option');
          opt.value = d; opt.textContent = d;
          distSel.appendChild(opt);
        });
      }
    });

    distSel.addEventListener('change', function () {
      const div  = divSel.value;
      const dist = this.value;
      upaSel.innerHTML = '<option value="">All Upazilas</option>';
      if (div && dist && locs[div] && locs[div][dist]) {
        locs[div][dist].sort().forEach(u => {
          const opt = document.createElement('option');
          opt.value = u; opt.textContent = u;
          upaSel.appendChild(opt);
        });
      }
    });
  }

  initCascadingDropdowns();

  // ── Search button ─────────────────────────────────────────
  searchBtn.addEventListener('click', function () {
    currentPage = 0;
    allResults  = [];
    runSearch();
  });

  async function runSearch() {
    grid.innerHTML = '';
    if (resultsCount) resultsCount.textContent = 'Searching…';
    emptyState?.classList.add('hidden');
    if (loadingState) { loadingState.classList.remove('hidden'); loadingState.classList.add('flex'); }

    const bloodGroup = document.getElementById('search-blood-group')?.value.trim() || '';
    const division   = document.getElementById('search-division')?.value.trim()    || '';
    const district   = document.getElementById('search-district')?.value.trim()    || '';
    const upazila    = document.getElementById('search-upazila')?.value.trim()     || '';

    const params = new URLSearchParams();
    if (bloodGroup) params.append('bloodGroup', bloodGroup);
    if (division)   params.append('division',   division);
    if (district)   params.append('district',   district);
    if (upazila)    params.append('upazila',    upazila);
    if (seekerLat != null) params.append('seekerLat', seekerLat);
    if (seekerLng != null) params.append('seekerLng', seekerLng);

    // Get token to send for self-exclusion
    const token = localStorage.getItem('hemo_id_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    try {
      const res = await fetch('/api/v1/donors/search?' + params.toString(), {
        headers: headers
      });
      if (!res.ok) throw new Error('Search failed');
      allResults = await res.json();

      if (loadingState) { loadingState.classList.add('hidden'); loadingState.classList.remove('flex'); }

      if (!allResults.length) { renderEmpty(bloodGroup, district, division); return; }

      if (resultsCount) {
        resultsCount.textContent = allResults.length + ' donor' + (allResults.length !== 1 ? 's' : '') + ' found';
      }
      renderPage(0);

    } catch {
      if (loadingState) { loadingState.classList.add('hidden'); loadingState.classList.remove('flex'); }
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:80px 0;">
          <div style="font-size:3rem;opacity:0.3;margin-bottom:12px;">⚠️</div>
          <p style="color:rgba(255,255,255,0.4);">Search failed. Please try again.</p>
        </div>`;
      if (resultsCount) resultsCount.textContent = 'Error';
    }
  }

  function renderPage(page) {
    currentPage = page;
    const start = page * PAGE_SIZE;
    const slice = allResults.slice(start, start + PAGE_SIZE);
    grid.innerHTML = '';
    slice.forEach(d => {
      const card = document.createElement('div');
      card.innerHTML = donorCardHtml(d).trim();
      grid.appendChild(card.firstChild);
    });
    renderPagination();
  }

  function renderEmpty(bloodGroup, district, division) {
    if (resultsCount) resultsCount.textContent = 'No donors found';
    let hint = '';
    if (bloodGroup) hint += '<strong style="color:rgba(255,255,255,0.6);">' + esc(bloodGroup) + '</strong> ';
    if (division)   hint += 'in ' + esc(division) + ' ';
    if (district)   hint += '/ ' + esc(district);

    grid.innerHTML = `
      <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;
                  justify-content:center;padding:80px 0;text-align:center;">
        <i class="fas fa-tint" style="font-size:3.5rem;margin-bottom:16px;opacity:0.3;color:#dc3545;"></i>
        <p style="color:#fff;font-size:1.1rem;font-weight:600;margin-bottom:8px;">No available donors found</p>
        <p style="color:rgba(255,255,255,0.35);font-size:0.85rem;margin-bottom:6px;">${hint}</p>
        <p style="color:rgba(255,255,255,0.25);font-size:0.78rem;margin-bottom:24px;">
          Donors must be 90+ days since last donation to appear here
        </p>
        <a href="/register"
           style="background:#DC2626;color:#fff;text-decoration:none;padding:10px 24px;
                  border-radius:8px;font-size:0.85rem;font-weight:600;">
          Register as a Donor →
        </a>
      </div>`;
  }

  // ── Donor card HTML ───────────────────────────────────────

  function donorCardHtml(d) {
    const initial    = (d.name || '?').charAt(0).toUpperCase();
    const lastDonated = d.lastDonationDate ? fmtDate(d.lastDonationDate) : 'First-time donor';
    const isLoggedIn = !!localStorage.getItem('hemo_id_token');

    const locationParts = [d.upazila, d.district, d.division].filter(Boolean);
    const locationStr   = locationParts.slice(0, 2).join(', ') || '—';

    // ── Distance badge ─────────────────────────────────────
    let distanceBadge = '';
    if (d.distanceKm != null) {
      let bgColor, label;
      if (d.distanceKm < 5) {
        bgColor = 'rgba(34,197,94,0.15)'; label = '<i class="fas fa-map-marker-alt"></i> ' + d.distanceKm + ' km — Very Close';
      } else if (d.distanceKm < 20) {
        bgColor = 'rgba(234,179,8,0.15)'; label = '<i class="fas fa-map-marker-alt"></i> ' + d.distanceKm + ' km away';
      } else if (d.distanceKm < 50) {
        bgColor = 'rgba(249,115,22,0.15)'; label = '<i class="fas fa-map-marker-alt"></i> ' + d.distanceKm + ' km away';
      } else {
        bgColor = 'rgba(220,38,38,0.12)'; label = '<i class="fas fa-map-marker-alt"></i> ' + d.distanceKm + ' km away';
      }
      const textColor = d.distanceKm < 5 ? '#86efac' : d.distanceKm < 20 ? '#fde047' : d.distanceKm < 50 ? '#fb923c' : '#fca5a5';
      distanceBadge = `<span style="display:inline-block;background:${bgColor};color:${textColor};
                              border-radius:20px;padding:3px 10px;font-size:0.72rem;font-weight:600;">
                         ${esc(label)}
                       </span>`;
    }

    const callBtn = (d.phone && isLoggedIn)
      ? `<a href="tel:${esc(d.phone)}"
            style="flex:1;background:#DC2626;color:#fff;text-decoration:none;padding:10px 0;
                   border-radius:8px;font-size:0.8rem;font-weight:600;text-align:center;
                   display:block;transition:background 200ms;letter-spacing:0.03em;"
            onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#DC2626'">
           <i class="fas fa-phone"></i> Call
         </a>`
      : `<a href="/login"
            style="flex:1;background:#1C1C1C;color:rgba(255,255,255,0.35);text-decoration:none;
                   padding:10px 0;border-radius:8px;font-size:0.8rem;font-weight:500;
                   text-align:center;display:block;border:1px solid #2a2a2a;">
           <i class="fas fa-lock"></i> Login to Call
         </a>`;

    const reqBtn = `<button
        onclick="window.openDirectRequestModal({
          firebaseUid: '${esc(d.firebaseUid || '')}',
          name: '${esc(d.name || '')}',
          bloodGroup: '${esc(d.bloodGroup || '')}',
          district: '${esc(d.district || '')}',
          division: '${esc(d.division || '')}',
          upazila: '${esc(d.upazila || '')}'
        })"
        style="flex:1;background:transparent;color:#DC2626;border:1px solid rgba(220,38,38,0.4);
               padding:10px 0;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;
               font-family:'Space Grotesk',sans-serif;transition:all 200ms;"
        onmouseover="this.style.background='rgba(220,38,38,0.08)'"
        onmouseout="this.style.background='transparent'">
      <i class="fas fa-tint"></i> Request
    </button>`;

    return `
    <div style="background:#141414;border:1px solid #1C1C1C;border-radius:12px;padding:20px;
                display:flex;flex-direction:column;transition:border-color 200ms;"
         onmouseover="this.style.borderColor='#333'" onmouseout="this.style.borderColor='#1C1C1C'">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:44px;height:44px;background:rgba(220,38,38,0.12);border-radius:50%;
                      display:flex;align-items:center;justify-content:center;
                      color:#DC2626;font-size:1.1rem;font-weight:700;flex-shrink:0;
                      border:1px solid rgba(220,38,38,0.2);">
            ${esc(initial)}
          </div>
          <div>
            <div style="font-size:0.92rem;font-weight:600;color:#fff;">${esc(d.name || 'Anonymous')}</div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.35);margin-top:2px;">${esc(locationStr)}</div>
          </div>
        </div>
        <div style="display:inline-flex;align-items:center;justify-content:center;
                    width:40px;height:40px;border-radius:50%;background:#DC2626;
                    color:#fff;font-size:0.78rem;font-weight:700;flex-shrink:0;">
          ${esc(d.bloodGroup || '?')}
        </div>
      </div>

      ${distanceBadge ? '<div style="margin-bottom:10px;">' + distanceBadge + '</div>' : ''}

      <div style="display:flex;flex-direction:column;gap:6px;padding:10px 0;
                  border-top:1px solid #1C1C1C;border-bottom:1px solid #1C1C1C;margin-bottom:14px;">
        <div style="font-size:0.78rem;color:rgba(255,255,255,0.45);">
          <i class="fas fa-tint"></i> Last donated: <span style="color:rgba(255,255,255,0.65);">${esc(lastDonated)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:0.78rem;">
          <span style="width:7px;height:7px;border-radius:50%;
                       background:${d.available ? '#22c55e' : '#555'};flex-shrink:0;"></span>
          <span style="color:${d.available ? '#86efac' : 'rgba(255,255,255,0.3)'};">
            ${d.available ? 'Available to donate' : 'Unavailable'}
          </span>
        </div>
      </div>

      <div style="display:flex;gap:8px;">
        ${callBtn}
        ${reqBtn}
      </div>
    </div>`;
  }

  // ── Pagination ────────────────────────────────────────────

  function renderPagination() {
    const old = document.getElementById('search-pagination-wrap');
    if (old) old.remove();

    const totalPages = Math.ceil(allResults.length / PAGE_SIZE);
    if (totalPages <= 1) return;

    const wrap = document.createElement('div');
    wrap.id = 'search-pagination-wrap';
    wrap.style.cssText = 'grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:8px;';

    const info = document.createElement('p');
    info.style.cssText = 'font-size:0.75rem;color:rgba(255,255,255,0.3);';
    info.textContent = 'Showing '
      + Math.min((currentPage + 1) * PAGE_SIZE, allResults.length)
      + ' of ' + allResults.length + ' donors';
    wrap.appendChild(info);

    const pgRow = document.createElement('div');
    pgRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;justify-content:center;';

    for (let i = 0; i < totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      const isActive = i === currentPage;
      btn.style.cssText =
        'background:' + (isActive ? 'rgba(220,38,38,0.15)' : 'transparent') + ';' +
        'border:1px solid ' + (isActive ? '#DC2626' : '#333') + ';' +
        'color:' + (isActive ? '#DC2626' : 'rgba(255,255,255,0.5)') + ';' +
        'padding:6px 12px;border-radius:6px;font-size:0.8rem;font-weight:' + (isActive ? '700' : '500') + ';' +
        'cursor:pointer;font-family:\'Space Grotesk\',sans-serif;min-width:36px;transition:all 200ms;';
      if (!isActive) {
        btn.addEventListener('click', (function (p) {
          return function () { renderPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        })(i));
      }
      pgRow.appendChild(btn);
    }
    wrap.appendChild(pgRow);
    grid.appendChild(wrap);
  }

  // ── Helpers ───────────────────────────────────────────────

  function fmtDate(str) {
    try { return new Date(str).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return str; }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.requestFromDonor = function (bloodGroup, district) {
    let url = '/request-blood?';
    if (bloodGroup) url += 'bloodGroup=' + encodeURIComponent(bloodGroup) + '&';
    if (district)   url += 'district='   + encodeURIComponent(district);
    window.location.href = url;
  };

  // ── Blood Requests — "I Can Donate" section ───────────────

  async function loadBloodRequests() {
    const grid = document.getElementById('blood-requests-grid');
    if (!grid) return;

    const token      = localStorage.getItem('hemo_id_token');
    const isLoggedIn = !!token;

    // Get current user UID to filter out their own requests
    let currentUserUid = null;
    if (isLoggedIn && window.firebase && window.firebase.auth) {
      const user = window.firebase.auth().currentUser;
      if (user) currentUserUid = user.uid;
    }

    try {
      const res = await fetch('/api/v1/requests');
      if (!res.ok) throw new Error();
      let requestsData = await res.json();

      // Filter out current user's own requests
      // API returns {request: BloodRequest, activeResponseCount: number}
      if (currentUserUid) {
        requestsData = requestsData.filter(item => {
          const req = item.request || item;
          return req.requestedByUid !== currentUserUid;
        });
      }

      if (!requestsData.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:0.85rem;">No active blood requests at this time.</div>';
        return;
      }

      // Extract actual requests from wrapper objects
      const requests = requestsData.map(item => item.request || item);
      grid.innerHTML = requests.map(r => bloodRequestCardHtml(r, isLoggedIn)).join('');

    } catch {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:0.85rem;">Failed to load requests.</div>';
    }
  }

  function bloodRequestCardHtml(r, isLoggedIn) {
    const myResponses = (r.donorResponses || []).filter(function(x) { return x.status === 'OFFERED'; });
    const token       = localStorage.getItem('hemo_id_token');

    // Try to detect if current user already responded (by checking localStorage cached UID is unavailable,
    // so we track respond state via button rendering — updated on click)
    const respondBtn = isLoggedIn
      ? '<button id="respond-btn-' + esc(r.id) + '" onclick="respondToRequest(\'' + esc(r.id) + '\', this)"'
        + ' style="width:100%;background:#DC2626;color:#fff;border:none;padding:10px 0;border-radius:8px;'
        + 'font-size:0.82rem;font-weight:600;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;'
        + 'transition:background 200ms;" onmouseover="this.style.background=\'#b91c1c\'"'
        + ' onmouseout="this.style.background=\'#DC2626\'"><i class="fas fa-tint"></i> I Can Donate</button>'
      : '<a href="/login" style="display:block;width:100%;background:#1C1C1C;color:rgba(255,255,255,0.4);'
        + 'border:1px solid #2a2a2a;padding:10px 0;border-radius:8px;font-size:0.82rem;font-weight:500;'
        + 'text-align:center;text-decoration:none;"><i class="fas fa-lock"></i> Login to Respond</a>';

    const responseCount = myResponses.length > 0
      ? '<span style="font-size:0.72rem;color:#86efac;background:rgba(34,197,94,0.1);'
        + 'border-radius:20px;padding:2px 8px;">' + myResponses.length + ' donor' + (myResponses.length > 1 ? 's' : '') + ' responded</span>'
      : '';

    return '<div style="background:#141414;border:1px solid #1C1C1C;border-radius:12px;padding:18px;'
      + 'transition:border-color 200ms;" onmouseover="this.style.borderColor=\'#333\'"'
      + ' onmouseout="this.style.borderColor=\'#1C1C1C\'">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">'
      + '<div style="width:44px;height:44px;border-radius:50%;background:#DC2626;color:#fff;'
      + 'display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;flex-shrink:0;">'
      + esc(r.bloodGroup || '?') + '</div>'
      + '<div><div style="font-size:0.92rem;font-weight:600;color:#fff;">' + esc(r.patientName || '—') + '</div>'
      + '<div style="font-size:0.75rem;color:rgba(255,255,255,0.35);margin-top:2px;">' + esc(r.hospitalName || '') + '</div>'
      + '</div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px 0;'
      + 'border-top:1px solid #1C1C1C;border-bottom:1px solid #1C1C1C;margin-bottom:14px;">'
      + '<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);"><i class="fas fa-map-marker-alt"></i> ' + esc(r.district || '—') + '</div>'
      + '<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);"><i class="fas fa-tint"></i> ' + (r.unitsNeeded || 1) + ' units</div>'
      + '<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);"><i class="fas fa-calendar"></i> ' + (r.dateNeeded || '—') + '</div>'
      + '<div>' + responseCount + '</div>'
      + '</div>'
      + respondBtn
      + '</div>';
  }

  window.respondToRequest = async function(requestId, btn) {
    const token = localStorage.getItem('hemo_id_token');
    if (!token) {
      window.toast?.('Please log in first.', 'error');
      setTimeout(() => {
        window.RedirectHandler?.redirectToLogin() || (window.location.href = '/login');
      }, 1500);
      return;
    }

    // Custom confirmation dialog
    const confirmed = await window.customConfirm(
      'Confirm Blood Donation',
      'Are you sure you can donate? The requester will be notified with your contact information including name, phone number, and blood group.',
      'Yes, I Can Donate',
      'Cancel'
    );
    
    if (!confirmed) {
      return;
    }

    const originalHtml = btn.outerHTML;
    btn.disabled  = true;
    btn.textContent = 'Responding…';

    try {
      const res = await fetch('/api/v1/requests/' + requestId + '/respond', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (res.ok) {
        // Replace button with "Responded" + withdraw link
        const wrap = btn.parentElement;
        wrap.innerHTML = '<div style="display:flex;gap:8px;align-items:center;">'
          + '<button disabled style="flex:1;background:rgba(34,197,94,0.1);color:#86efac;border:1px solid rgba(34,197,94,0.2);'
          + 'padding:10px 0;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:default;font-family:\'Space Grotesk\',sans-serif;">✓ Responded</button>'
          + '<button onclick="withdrawFromRequest(\'' + esc(requestId) + '\', this)"'
          + ' style="background:transparent;color:rgba(255,255,255,0.35);border:1px solid #2a2a2a;'
          + 'padding:10px 14px;border-radius:8px;font-size:0.78rem;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;'
          + 'transition:all 200ms;" onmouseover="this.style.color=\'#fff\'" onmouseout="this.style.color=\'rgba(255,255,255,0.35)\'">Withdraw</button>'
          + '</div>';
        window.toast?.('✅ Response sent! The requester has been notified with your contact information.', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        let errorMsg = err.error || 'Failed to respond. Please try again.';
        
        // Better error messages
        if (res.status === 400) {
          if (errorMsg.includes('not eligible') || errorMsg.includes('90') || errorMsg.includes('days ago')) {
            // Extract days info if available
            const match = errorMsg.match(/(\d+) days ago/);
            const daysAgo = match ? match[1] : '';
            const waitMatch = errorMsg.match(/wait (\d+) more days/);
            const waitDays = waitMatch ? waitMatch[1] : '';
            
            if (daysAgo && waitDays) {
              errorMsg = '⏳ You cannot donate yet!<br><br>You donated ' + daysAgo + ' days ago.<br>Please wait <b>' + waitDays + ' more days</b> (90-day gap required).';
            } else {
              errorMsg = '⏳ You cannot donate yet!<br><br>You must wait 90 days since your last donation.';
            }
          } else if (errorMsg.includes('unavailable') || errorMsg.includes('availability')) {
            errorMsg = '<i class="fas fa-times-circle" style="color:#DC2626;"></i> You are currently unavailable!<br><br>Your profile is marked as "Not Available to Donate".<br>Please go to your <b>Profile</b> and turn ON the availability toggle.';
          } else if (errorMsg.includes('blood group') && errorMsg.includes('does not match')) {
            errorMsg = '🩸 ' + errorMsg; // Keep blood group mismatch message as-is
          }
        } else if (res.status === 401) {
          errorMsg = '<i class="fas fa-lock"></i> Please log in to respond to requests.';
        } else if (res.status === 409) {
          errorMsg = '✓ You have already responded to this request.';
        }
        
        window.toast?.(errorMsg, 'error', 5000); // Longer duration for detailed messages
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-tint"></i> I Can Donate';
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      window.toast?.('Network error. Please check your connection and try again.', 'error');
      btn.disabled = false;
      btn.textContent = '🩸 I Can Donate';
    }
  };

  window.withdrawFromRequest = async function(requestId, btn) {
    const token = localStorage.getItem('hemo_id_token');
    if (!token) return;

    // Custom confirmation
    const confirmed = await window.customConfirm(
      '⚠️ Withdraw Response',
      'Are you sure you want to withdraw your response? The requester will no longer see your contact information.',
      'Yes, Withdraw',
      'Cancel'
    );
    
    if (!confirmed) {
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Withdrawing…';

    try {
      const res = await fetch('/api/v1/requests/' + requestId + '/respond', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (res.ok) {
        const wrap = btn.parentElement;
        wrap.innerHTML = '<button id="respond-btn-' + esc(requestId) + '" onclick="respondToRequest(\'' + esc(requestId) + '\', this)"'
          + ' style="width:100%;background:#DC2626;color:#fff;border:none;padding:10px 0;border-radius:8px;'
          + 'font-size:0.82rem;font-weight:600;cursor:pointer;font-family:\'Space Grotesk\',sans-serif;"><i class="fas fa-tint"></i> I Can Donate</button>';
        window.toast?.('✅ Response withdrawn successfully.', 'success');
      } else {
        btn.disabled = false;
        btn.textContent = 'Withdraw';
        window.toast?.('Failed to withdraw response. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error withdrawing response:', error);
      btn.disabled = false;
      btn.textContent = 'Withdraw';
      window.toast?.('Network error. Please try again.', 'error');
    }
  };

  // Load blood requests on page load
  loadBloodRequests();

})();


// ══════════════════════════════════════════════════════════
// Direct Request Modal Logic
// ══════════════════════════════════════════════════════════

let selectedDonor = null;

// Open modal function
window.openDirectRequestModal = function(donor) {
  selectedDonor = donor;
  
  const modal = document.getElementById('direct-request-modal');
  const donorNameEl = document.getElementById('modal-donor-name');
  
  if (!modal) {
    console.error('Direct request modal not found');
    return;
  }
  
  // Set donor name
  if (donorNameEl) donorNameEl.textContent = donor.name || 'this donor';
  
  // Show modal
  modal.style.display = 'flex';
  
  // Set min date to today
  const dateInput = document.getElementById('modal-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.value = today;
  }
  
  // Reset form
  const form = document.getElementById('direct-request-form');
  if (form) form.reset();
  
  const errorEl = document.getElementById('modal-error');
  if (errorEl) errorEl.style.display = 'none';
  
  // Setup close button (ensure it works even if called multiple times)
  setupModalCloseHandlers();
};

// Close modal
window.closeDirectRequestModal = function() {
  console.log('Closing modal...');
  const modal = document.getElementById('direct-request-modal');
  if (modal) {
    modal.style.display = 'none';
    console.log('Modal closed');
  }
  selectedDonor = null;
};

// Setup close handlers
function setupModalCloseHandlers() {
  // Close button
  const closeBtn = document.getElementById('close-modal-btn');
  if (closeBtn) {
    // Remove old listener (if any) by cloning
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window.closeDirectRequestModal();
    });
  }
  
  // Cancel button
  const cancelBtn = document.getElementById('cancel-modal-btn');
  if (cancelBtn) {
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window.closeDirectRequestModal();
    });
  }
  
  // Click outside to close
  const modal = document.getElementById('direct-request-modal');
  if (modal) {
    modal.onclick = function(e) {
      if (e.target === modal) {
        window.closeDirectRequestModal();
      }
    };
  }
}

// Form submission - Initialize once on page load
document.addEventListener('DOMContentLoaded', function() {
  const directRequestForm = document.getElementById('direct-request-form');
  if (directRequestForm) {
    directRequestForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      if (!selectedDonor) {
        alert('No donor selected');
        return;
      }
      
      const token = localStorage.getItem('hemo_id_token');
      if (!token) {
        window.toast?.('Please log in to send a request', 'error');
        setTimeout(() => {
          window.RedirectHandler?.redirectToLogin() || (window.location.href = '/login');
        }, 1500);
        return;
      }
      
      // Get form values
      const patientName = document.getElementById('modal-patient-name').value.trim();
      const hospitalName = document.getElementById('modal-hospital').value.trim();
      const unitsNeeded = parseInt(document.getElementById('modal-units').value, 10);
      const contactPhone = document.getElementById('modal-contact').value.trim();
      const requiredDate = document.getElementById('modal-date').value;
      
      // Validate
      if (!patientName || !hospitalName || !contactPhone || !requiredDate) {
        showModalError('Please fill in all required fields');
        return;
      }
      
      // UI state
      const submitBtn = document.getElementById('confirm-request-btn');
      const submitText = document.getElementById('submit-text');
      const submitSpinner = document.getElementById('submit-spinner');
      const errorEl = document.getElementById('modal-error');
      
      if (submitBtn) submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'Sending...';
      if (submitSpinner) submitSpinner.style.display = 'inline-block';
      if (errorEl) errorEl.style.display = 'none';
      
      // Prepare request body
      const body = {
        donorUid: selectedDonor.firebaseUid,
        patientName: patientName,
        bloodGroup: selectedDonor.bloodGroup,
        hospitalName: hospitalName,
        division: selectedDonor.division || '',
        district: selectedDonor.district || '',
        upazila: selectedDonor.upazila || '',
        unitsNeeded: unitsNeeded,
        contactPhone: contactPhone,
        requiredDate: requiredDate
      };
      
      console.log('Sending direct request:', body);
      
      try {
        const res = await fetch('/api/v1/requests/direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(body)
        });
        
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to send request');
        }
        
        const result = await res.json();
        console.log('Direct request sent successfully:', result);
        
        // Success!
        window.closeDirectRequestModal();
        window.toast?.('✅ Request sent! The donor will receive an email notification.', 'success');
        
      } catch (err) {
        console.error('Error sending direct request:', err);
        showModalError(err.message || 'Failed to send request. Please try again.');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Confirm Request';
        if (submitSpinner) submitSpinner.style.display = 'none';
      }
    });
  }
});

function showModalError(message) {
  const errorEl = document.getElementById('modal-error');
  const errorMsg = document.getElementById('modal-error-msg');
  if (errorEl && errorMsg) {
    errorMsg.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }
}
