// inbox.js - Inbox page functionality for direct blood requests

const API_BASE = '/api/v1/requests/direct';

// Helper function for authenticated API calls
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('hemo_id_token');
    if (!token) {
        window.location.href = '/login';
        throw new Error('Not authenticated');
    }
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    return fetch(url, { ...options, headers });
}

// Use window.showToast, window.customConfirm from globally loaded scripts

// State
let allRequests = [];
let currentFilter = 'PENDING';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inbox.js loaded');
    
    // Check if elements exist
    const tabs = document.querySelectorAll('.tab-btn');
    console.log('Found tabs:', tabs.length);
    
    const container = document.getElementById('requests-container');
    console.log('Container found:', !!container);
    
    initTabs();
    loadInboxRequests();
    
    // Auto-refresh every 30 seconds
    setInterval(loadInboxRequests, 30000);
});

// Initialize tab switching
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            console.log('Tab clicked:', tab.dataset.filter);
            const filter = tab.dataset.filter;
            switchTab(filter);
        });
    });
}

// Switch active tab
function switchTab(filter) {
    console.log('Switching to filter:', filter);
    currentFilter = filter;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    // Filter and render requests
    renderRequests();
}

// Load all requests from backend
async function loadInboxRequests() {
    try {
        const response = await authFetch(`${API_BASE}/received`);
        
        if (!response.ok) {
            throw new Error('Failed to load inbox requests');
        }
        
        allRequests = await response.json();
        updateStats();
        renderRequests();
        
    } catch (error) {
        console.error('Error loading inbox:', error);
        window.showToast('❌ Failed to load inbox requests', 'error');
    }
}

// Update stats cards
function updateStats() {
    const pending = allRequests.filter(r => r.status === 'PENDING').length;
    const accepted = allRequests.filter(r => r.status === 'ACCEPTED').length;
    const declined = allRequests.filter(r => r.status === 'DECLINED').length;
    const total = allRequests.length;
    
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-accepted').textContent = accepted;
    document.getElementById('stat-declined').textContent = declined;
    document.getElementById('stat-total').textContent = total;
}

// Render filtered requests
function renderRequests() {
    const container = document.getElementById('requests-container');
    
    // Filter requests based on current tab
    let filtered = allRequests;
    if (currentFilter !== 'ALL') {
        filtered = allRequests.filter(r => r.status === currentFilter);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox" style="font-size: 64px; color: #333; margin-bottom: 16px;"></i>
                <p style="color: #666; font-size: 18px;">No ${currentFilter.toLowerCase()} requests</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(req => createRequestCard(req)).join('');
    
    // Attach event listeners
    attachCardListeners();
}

// Create request card HTML
function createRequestCard(request) {
    const isPending = request.status === 'PENDING';
    const isAccepted = request.status === 'ACCEPTED';
    const isDeclined = request.status === 'DECLINED';
    
    const statusColor = {
        'PENDING': '#ff9800',
        'ACCEPTED': '#4caf50',
        'DECLINED': '#f44336'
    }[request.status];
    
    const statusIcon = {
        'PENDING': 'fa-clock',
        'ACCEPTED': 'fa-check-circle',
        'DECLINED': 'fa-times-circle'
    }[request.status];
    
    const formattedDate = new Date(request.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const respondedDate = request.respondedAt 
        ? new Date(request.respondedAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : null;
    
    // Format location
    let location = '';
    if (request.upazila && request.district) {
        location = `${escapeHtml(request.upazila)}, ${escapeHtml(request.district)}`;
    } else if (request.district) {
        location = escapeHtml(request.district);
    }
    if (request.division && location) {
        location += `, ${escapeHtml(request.division)}`;
    }
    
    return `
        <div class="request-card" data-request-id="${request.id}">
            <div class="request-header">
                <div class="requester-info">
                    <i class="fas fa-user-circle" style="font-size: 24px; color: #dc3545; margin-right: 12px;"></i>
                    <div>
                        <div class="requester-name">${escapeHtml(request.requesterName)}</div>
                        <div class="request-date">
                            <i class="far fa-calendar-alt"></i> ${formattedDate}
                        </div>
                    </div>
                </div>
                <div class="request-status" style="background: ${statusColor};">
                    <i class="fas ${statusIcon}"></i> ${request.status}
                </div>
            </div>
            
            <div class="request-body">
                ${request.patientName ? `
                <div style="margin-bottom: 12px;">
                    <strong style="color: rgba(255,255,255,0.6); font-size: 0.85rem;">Patient:</strong>
                    <span style="color: white; font-size: 0.95rem; margin-left: 8px;">${escapeHtml(request.patientName)}</span>
                </div>
                ` : ''}
                
                <div class="blood-info">
                    <div class="blood-badge">
                        <i class="fas fa-tint"></i> ${request.bloodGroup}
                    </div>
                    <div class="units-badge">
                        <i class="fas fa-flask"></i> ${request.unitsNeeded} unit${request.unitsNeeded > 1 ? 's' : ''}
                    </div>
                </div>
                
                <div class="request-details">
                    ${location ? `
                    <div class="detail-row">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${location}</span>
                    </div>
                    ` : ''}
                    ${request.hospitalName ? `
                    <div class="detail-row">
                        <i class="fas fa-hospital"></i>
                        <span>${escapeHtml(request.hospitalName)}</span>
                    </div>
                    ` : ''}
                    ${request.requiredDate ? `
                    <div class="detail-row">
                        <i class="fas fa-calendar-check"></i>
                        <span>Required by: ${new Date(request.requiredDate).toLocaleDateString()}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                        <i class="fas fa-phone"></i>
                        <span>${escapeHtml(request.contactPhone || request.requesterPhone)}</span>
                    </div>
                </div>
                
                ${!isPending && request.responseMessage ? `
                <div class="response-message">
                    <div class="response-header">
                        <span><i class="fas fa-reply"></i> Your Response</span>
                        ${respondedDate ? `<span class="response-date">${respondedDate}</span>` : ''}
                    </div>
                    <p>${escapeHtml(request.responseMessage)}</p>
                </div>
                ` : ''}
            </div>
            
            <div class="request-actions">
                ${isPending ? `
                    <button class="btn-accept" data-action="accept">
                        <i class="fas fa-check"></i> Accept Request
                    </button>
                    <button class="btn-decline" data-action="decline">
                        <i class="fas fa-times"></i> Decline
                    </button>
                ` : ''}
                <a href="tel:${request.contactPhone || request.requesterPhone}" class="btn-call">
                    <i class="fas fa-phone"></i> Call
                </a>
            </div>
        </div>
    `;
}

// Attach event listeners to card buttons
function attachCardListeners() {
    document.querySelectorAll('.btn-accept').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.request-card');
            const requestId = card.dataset.requestId;
            handleAccept(requestId);
        });
    });
    
    document.querySelectorAll('.btn-decline').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.request-card');
            const requestId = card.dataset.requestId;
            handleDecline(requestId);
        });
    });
}

// Handle accept request
async function handleAccept(requestId) {
    const confirmed = await window.customConfirm(
        'Accept Blood Donation Request?',
        'You will be confirming your availability to donate blood for this request. The requester will be notified via email.',
        'Yes, Accept',
        'Cancel'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await authFetch(`${API_BASE}/${requestId}/accept`, {
            method: 'PUT'
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to accept request');
        }
        
        window.showToast('✅ Request accepted successfully!', 'success');
        await loadInboxRequests(); // Refresh
        
    } catch (error) {
        console.error('Error accepting request:', error);
        window.showToast('❌ ' + error.message, 'error');
    }
}

// Handle decline request
async function handleDecline(requestId) {
    const confirmed = await window.customConfirm(
        'Decline Blood Donation Request?',
        'Would you like to add an optional message explaining why you cannot donate? The requester will be notified.',
        'Continue',
        'Cancel'
    );
    
    if (!confirmed) return;
    
    // Show message input dialog
    const message = await promptMessage();
    
    try {
        const response = await authFetch(`${API_BASE}/${requestId}/decline`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: message ? JSON.stringify({ message }) : null
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to decline request');
        }
        
        window.showToast('✅ Request declined', 'success');
        await loadInboxRequests(); // Refresh
        
    } catch (error) {
        console.error('Error declining request:', error);
        window.showToast('❌ ' + error.message, 'error');
    }
}

// Prompt for decline message
function promptMessage() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-alert-overlay';
        modal.innerHTML = `
            <div class="custom-alert-box" style="max-width: 500px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <i class="fas fa-comment-dots" style="color: #dc3545; font-size: 48px; margin-bottom: 16px;"></i>
                    <h3 style="margin: 0; color: white; font-size: 20px;">Optional Message</h3>
                </div>
                <textarea 
                    id="decline-message-input" 
                    placeholder="Add a reason for declining (optional)..."
                    style="width: 100%; min-height: 100px; padding: 12px; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; color: white; font-family: inherit; resize: vertical; font-size: 14px;"
                    maxlength="500"
                ></textarea>
                <div style="margin-top: 20px; display: flex; gap: 12px;">
                    <button id="decline-skip-btn" style="flex: 1; padding: 12px; background: #333; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Skip
                    </button>
                    <button id="decline-send-btn" style="flex: 1; padding: 12px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        Send
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const input = modal.querySelector('#decline-message-input');
        const skipBtn = modal.querySelector('#decline-skip-btn');
        const sendBtn = modal.querySelector('#decline-send-btn');
        
        input.focus();
        
        skipBtn.onclick = () => {
            document.body.removeChild(modal);
            resolve(null);
        };
        
        sendBtn.onclick = () => {
            const message = input.value.trim();
            document.body.removeChild(modal);
            resolve(message || null);
        };
        
        // ESC key to cancel
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                document.body.removeChild(modal);
                resolve(null);
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
