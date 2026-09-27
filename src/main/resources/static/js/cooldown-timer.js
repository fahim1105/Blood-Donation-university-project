// src/main/resources/static/js/cooldown-timer.js

/**
 * ⭐ 90-DAY DONATION COOLDOWN TIMER
 * 
 * Purpose:
 * - Calculate days remaining until next eligible donation
 * - Display countdown timer
 * - Show availability status badge
 * - Handle "Donated Today" action
 */

class CooldownTimer {
    constructor(lastDonationDate, elementId = 'cooldown-timer') {
        this.lastDonationDate = lastDonationDate ? new Date(lastDonationDate) : null;
        this.elementId = elementId;
        this.cooldownDays = 90; // Standard donation cooldown period
    }

    /**
     * Calculate days since last donation
     */
    getDaysSinceDonation() {
        if (!this.lastDonationDate) return null;
        
        const today = new Date();
        const timeDiff = today - this.lastDonationDate;
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        return daysDiff;
    }

    /**
     * Calculate days remaining until eligible
     */
    getDaysRemaining() {
        const daysSince = this.getDaysSinceDonation();
        
        if (daysSince === null) return 0;
        
        const daysRemaining = this.cooldownDays - daysSince;
        return daysRemaining > 0 ? daysRemaining : 0;
    }

    /**
     * Check if user is eligible to donate
     */
    isEligible() {
        return this.getDaysRemaining() === 0;
    }

    /**
     * Get next eligible date
     */
    getNextEligibleDate() {
        if (!this.lastDonationDate) return new Date();
        
        const nextDate = new Date(this.lastDonationDate);
        nextDate.setDate(nextDate.getDate() + this.cooldownDays);
        
        return nextDate;
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Get status badge HTML
     */
    getStatusBadge() {
        const isAvailable = this.isEligible();
        const badgeClass = isAvailable ? 'badge-success' : 'badge-warning';
        const badgeText = isAvailable ? '✅ Available' : '⏳ Not Available';
        
        return `<span class="availability-badge ${badgeClass}">${badgeText}</span>`;
    }

    /**
     * Get countdown message
     */
    getCountdownMessage() {
        const daysRemaining = this.getDaysRemaining();
        
        if (daysRemaining === 0) {
            return {
                title: 'You are eligible to donate!',
                message: 'Thank you for your willingness to save lives. 🩸',
                class: 'status-available'
            };
        }
        
        const nextDate = this.getNextEligibleDate();
        
        return {
            title: `${daysRemaining} days until next eligible donation`,
            message: `You can donate again on ${this.formatDate(nextDate)}`,
            class: 'status-cooldown'
        };
    }

    /**
     * Render timer to DOM
     */
    render() {
        const element = document.getElementById(this.elementId);
        if (!element) {
            console.error(`Element with ID '${this.elementId}' not found`);
            return;
        }

        const status = this.getCountdownMessage();
        const daysRemaining = this.getDaysRemaining();
        
        element.innerHTML = `
            <div class="cooldown-container ${status.class}">
                <div class="cooldown-header">
                    ${this.getStatusBadge()}
                </div>
                
                ${daysRemaining > 0 ? `
                    <div class="cooldown-circle">
                        <svg class="progress-ring" width="200" height="200">
                            <circle
                                class="progress-ring-circle"
                                stroke="#e2e8f0"
                                stroke-width="10"
                                fill="transparent"
                                r="90"
                                cx="100"
                                cy="100"
                            />
                            <circle
                                class="progress-ring-progress"
                                stroke="#48bb78"
                                stroke-width="10"
                                fill="transparent"
                                r="90"
                                cx="100"
                                cy="100"
                                style="stroke-dasharray: ${this.getProgressCircumference()}; 
                                       stroke-dashoffset: ${this.getProgressOffset()}"
                            />
                        </svg>
                        <div class="cooldown-days">
                            <span class="days-number">${daysRemaining}</span>
                            <span class="days-label">days left</span>
                        </div>
                    </div>
                ` : ''}
                
                <div class="cooldown-info">
                    <h3>${status.title}</h3>
                    <p>${status.message}</p>
                </div>
                
                ${daysRemaining > 0 ? `
                    <div class="cooldown-details">
                        <div class="detail-item">
                            <span class="detail-label">Last Donation:</span>
                            <span class="detail-value">${this.formatDate(this.lastDonationDate)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Days Passed:</span>
                            <span class="detail-value">${this.getDaysSinceDonation()} / ${this.cooldownDays}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Calculate progress ring values
     */
    getProgressCircumference() {
        const radius = 90;
        return 2 * Math.PI * radius;
    }

    getProgressOffset() {
        const daysPassed = this.getDaysSinceDonation();
        const progress = (daysPassed / this.cooldownDays) * 100;
        const circumference = this.getProgressCircumference();
        return circumference - (progress / 100) * circumference;
    }

    /**
     * Update timer (call after donation logged)
     */
    update(newLastDonationDate) {
        this.lastDonationDate = new Date(newLastDonationDate);
        this.render();
    }
}

// ══════════════════════════════════════════════════════════
// STYLES (Add to your CSS file)
// ══════════════════════════════════════════════════════════

const cooldownStyles = `
<style>
.cooldown-container {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 500px;
    margin: 0 auto;
}

.cooldown-header {
    margin-bottom: 20px;
}

.availability-badge {
    display: inline-block;
    padding: 8px 20px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
}

.badge-success {
    background: #c6f6d5;
    color: #22543d;
}

.badge-warning {
    background: #fed7d7;
    color: #742a2a;
}

.cooldown-circle {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 20px auto;
}

.progress-ring {
    transform: rotate(-90deg);
}

.progress-ring-progress {
    transition: stroke-dashoffset 0.5s ease;
}

.cooldown-days {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.days-number {
    display: block;
    font-size: 48px;
    font-weight: 900;
    color: #2d3748;
}

.days-label {
    display: block;
    font-size: 16px;
    color: #718096;
}

.cooldown-info h3 {
    font-size: 20px;
    color: #2d3748;
    margin-bottom: 8px;
}

.cooldown-info p {
    font-size: 14px;
    color: #718096;
}

.cooldown-details {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid #e2e8f0;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 14px;
}

.detail-label {
    color: #718096;
}

.detail-value {
    color: #2d3748;
    font-weight: 600;
}

.status-available {
    border: 3px solid #48bb78;
}

.status-cooldown {
    border: 3px solid #ed8936;
}
</style>
`;

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CooldownTimer;
}


/**
 * ═══════════════════════════════════════════════════════════
 * USAGE EXAMPLES:
 * ═══════════════════════════════════════════════════════════
 * 
 * In your dashboard.html:
 * 
 * <div id="cooldown-timer"></div>
 * 
 * <script>
 *     // Get user's last donation date from backend
 *     const lastDonation = [[${user.lastDonationDate}]];
 *     
 *     // Create and render timer
 *     const timer = new CooldownTimer(lastDonation);
 *     timer.render();
 *     
 *     // Update after donation logged
 *     function onDonationLogged(newDate) {
 *         timer.update(newDate);
 *     }
 * </script>
 * 
 * ═══════════════════════════════════════════════════════════
 */
