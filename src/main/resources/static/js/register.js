// ══════════════════════════════════════════════════════════
// register.js — Multi-step registration with Firebase
// ══════════════════════════════════════════════════════════

import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Form data storage
const formData = {
  step1: {},
  step2: {},
  step3: {}
};

// Current step
let currentStep = 1;

// ══════════════════════════════════════════════════════════
// STEP NAVIGATION
// ══════════════════════════════════════════════════════════

function showStep(step) {
  // Hide all steps
  document.getElementById('step-1')?.classList.add('hidden');
  document.getElementById('step-2')?.classList.add('hidden');
  document.getElementById('step-3')?.classList.add('hidden');

  // Show target step
  document.getElementById('step-' + step)?.classList.remove('hidden');

  // Update progress indicators
  updateProgress(step);
  currentStep = step;

  // Save current step to sessionStorage for back navigation from policy pages
  sessionStorage.setItem('registration_step', step);
  sessionStorage.setItem('registration_data', JSON.stringify(formData));
}

function updateProgress(step) {
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById('progress-' + i);
    if (!dot) continue;
    
    dot.classList.remove('active', 'completed');
    if (i < step) {
      dot.classList.add('completed');
      dot.textContent = '✓';
    } else if (i === step) {
      dot.classList.add('active');
      dot.textContent = i;
    } else {
      dot.textContent = i;
    }
  }

  // Update progress lines
  const lines = document.querySelectorAll('.progress-line');
  lines.forEach((line, idx) => {
    if (idx < step - 1) {
      line.classList.add('completed');
    } else {
      line.classList.remove('completed');
    }
  });
}

// ══════════════════════════════════════════════════════════
// STEP 1: Basic Information
// ══════════════════════════════════════════════════════════

document.getElementById('register-form-step1')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();

  if (!name || !email || !phone) {
    showError('Please fill in all required fields');
    return;
  }

  // Save step 1 data
  formData.step1 = { name, email, phone };

  // Go to step 2
  showStep(2);
});

// ══════════════════════════════════════════════════════════
// STEP 2: Medical & Location Info
// ══════════════════════════════════════════════════════════

// Initialize cascading dropdowns
function initLocationDropdowns() {
  const locs = window.BD_LOCATIONS;
  const divSel  = document.getElementById('reg-division');
  const distSel = document.getElementById('reg-district');
  const upaSel  = document.getElementById('reg-upazila');

  if (!divSel || !locs) {
    console.warn('Location dropdowns or BD_LOCATIONS not available yet');
    return false;
  }

  // Populate divisions
  divSel.innerHTML = '<option value="">Select Division</option>';
  const divisions = Object.keys(locs).sort();
  
  if (divisions.length === 0) {
    console.error('No divisions found in BD_LOCATIONS');
    return false;
  }

  divisions.forEach(div => {
    const opt = document.createElement('option');
    opt.value = div;
    opt.textContent = div;
    divSel.appendChild(opt);
  });

  console.log('Populated ' + divisions.length + ' divisions');

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

  return true;
}

// Wait for BD_LOCATIONS to be available
function waitForLocations() {
  let attempts = 0;
  const maxAttempts = 50;
  
  const checkInterval = setInterval(() => {
    attempts++;
    
    if (window.BD_LOCATIONS) {
      clearInterval(checkInterval);
      const success = initLocationDropdowns();
      if (success) {
        console.log('Location dropdowns initialized successfully');
      }
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.error('BD_LOCATIONS failed to load after ' + maxAttempts + ' attempts');
    }
  }, 100);
}

// Start waiting for locations on page load
waitForLocations();

document.getElementById('register-form-step2')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const bloodGroup = document.getElementById('reg-blood-group').value;
  const gender = document.getElementById('reg-gender').value;
  const dob = document.getElementById('reg-dob').value;
  const division = document.getElementById('reg-division').value;
  const district = document.getElementById('reg-district').value;
  const upazila = document.getElementById('reg-upazila').value;
  const lastDonation = document.getElementById('reg-last-donation').value;

  if (!bloodGroup || !gender || !dob) {
    showError('Please fill in all required fields');
    return;
  }

  // Save step 2 data
  formData.step2 = {
    bloodGroup,
    gender,
    dateOfBirth: dob,
    division,
    district,
    upazila,
    lastDonationDate: lastDonation || null
  };

  // Go to step 3
  showStep(3);
});

// Back button: Step 2 → Step 1
document.getElementById('back-to-step1')?.addEventListener('click', function() {
  showStep(1);
});

// ══════════════════════════════════════════════════════════
// STEP 3: Password & Agreement
// ══════════════════════════════════════════════════════════

// Toggle password visibility
document.getElementById('toggle-password')?.addEventListener('click', function() {
  const input = document.getElementById('reg-password');
  if (input.type === 'password') {
    input.type = 'text';
    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
    this.title = 'Hide password';
  } else {
    input.type = 'password';
    this.innerHTML = '<i class="fas fa-eye"></i>';
    this.title = 'Show password';
  }
});

document.getElementById('toggle-confirm-password')?.addEventListener('click', function() {
  const input = document.getElementById('reg-confirm-password');
  if (input.type === 'password') {
    input.type = 'text';
    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
    this.title = 'Hide password';
  } else {
    input.type = 'password';
    this.innerHTML = '<i class="fas fa-eye"></i>';
    this.title = 'Show password';
  }
});

// Back button: Step 3 → Step 2
document.getElementById('back-to-step2')?.addEventListener('click', function() {
  showStep(2);
});

// Final registration submission
document.getElementById('register-form-step3')?.addEventListener('submit', async function(e) {
  e.preventDefault();

  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;
  const agree = document.getElementById('reg-agree').checked;

  if (!agree) {
    showError('You must agree to the Privacy Policy and Terms & Conditions');
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }

  // Save step 3 data
  formData.step3 = { password };

  // Show loading state
  const submitBtn = document.getElementById('reg-submit-btn');
  const submitText = document.getElementById('reg-submit-text');
  const spinner = document.getElementById('reg-spinner');
  
  submitBtn.disabled = true;
  submitText.textContent = 'Creating Account...';
  spinner.style.display = 'block';

  try {
    // Step 1: Create Firebase account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.step1.email,
      formData.step3.password
    );

    const user = userCredential.user;
    const token = await user.getIdToken();

    submitText.textContent = 'Saving Profile...';

    // Step 2: Register in backend database
    const registrationData = {
      firebaseUid: user.uid,
      name: formData.step1.name,
      email: formData.step1.email,
      phone: formData.step1.phone,
      bloodGroup: formData.step2.bloodGroup,
      gender: formData.step2.gender,
      dateOfBirth: formData.step2.dateOfBirth,
      division: formData.step2.division,
      district: formData.step2.district,
      upazila: formData.step2.upazila,
      lastDonationDate: formData.step2.lastDonationDate
    };

    const response = await fetch('/api/v1/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(registrationData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    // Success!
    localStorage.setItem('hemo_id_token', token);
    sessionStorage.removeItem('registration_step');
    sessionStorage.removeItem('registration_data');

    showSuccess('Registration successful! Redirecting...');
    
    setTimeout(() => {
      // Redirect back to intended page or home
      if (typeof RedirectHandler !== 'undefined') {
        RedirectHandler.redirectBack();
      } else {
        window.location.href = '/';
      }
    }, 1500);

  } catch (error) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please login instead.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Use at least 6 characters.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    showError(errorMessage);
    
    submitBtn.disabled = false;
    submitText.textContent = 'Complete Registration';
    spinner.style.display = 'none';
  }
});

// ══════════════════════════════════════════════════════════
// ERROR & SUCCESS MESSAGES
// ══════════════════════════════════════════════════════════

function showError(message) {
  const errorEl = document.getElementById('reg-error');
  const errorMsg = document.getElementById('reg-error-msg');
  const successEl = document.getElementById('reg-success');

  if (errorEl && errorMsg) {
    errorMsg.textContent = message;
    errorEl.classList.remove('hidden');
    successEl?.classList.add('hidden');

    // Scroll to error
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorEl.classList.add('hidden');
    }, 5000);
  }
}

function showSuccess(message) {
  const successEl = document.getElementById('reg-success');
  const successMsg = document.getElementById('reg-success-msg');
  const errorEl = document.getElementById('reg-error');

  if (successEl && successMsg) {
    successMsg.textContent = message;
    successEl.classList.remove('hidden');
    errorEl?.classList.add('hidden');
  }
}

// ══════════════════════════════════════════════════════════
// RESTORE STATE ON PAGE LOAD (for back navigation from policy pages)
// ══════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', function() {
  const savedStep = sessionStorage.getItem('registration_step');
  const savedData = sessionStorage.getItem('registration_data');

  if (savedStep && savedData) {
    try {
      const data = JSON.parse(savedData);
      Object.assign(formData, data);

      // Restore form fields
      if (data.step1) {
        document.getElementById('reg-name').value = data.step1.name || '';
        document.getElementById('reg-email').value = data.step1.email || '';
        document.getElementById('reg-phone').value = data.step1.phone || '';
      }

      if (data.step2) {
        document.getElementById('reg-blood-group').value = data.step2.bloodGroup || '';
        document.getElementById('reg-gender').value = data.step2.gender || '';
        document.getElementById('reg-dob').value = data.step2.dateOfBirth || '';
        
        // Restore location dropdowns
        setTimeout(() => {
          if (data.step2.division) {
            document.getElementById('reg-division').value = data.step2.division;
            document.getElementById('reg-division').dispatchEvent(new Event('change'));
            
            setTimeout(() => {
              if (data.step2.district) {
                document.getElementById('reg-district').value = data.step2.district;
                document.getElementById('reg-district').dispatchEvent(new Event('change'));
                
                setTimeout(() => {
                  if (data.step2.upazila) {
                    document.getElementById('reg-upazila').value = data.step2.upazila;
                  }
                }, 100);
              }
            }, 100);
          }
        }, 200);

        document.getElementById('reg-last-donation').value = data.step2.lastDonationDate || '';
      }

      // Show saved step
      showStep(parseInt(savedStep));
    } catch (e) {
      console.error('Failed to restore registration state:', e);
    }
  }
});

// ══════════════════════════════════════════════════════════
// GOOGLE SIGN-UP - Removed
// ══════════════════════════════════════════════════════════
/*
document.getElementById('google-signup-btn')?.addEventListener('click', function() {
  window.toast?.('Google Sign-up coming soon!', 'info');
  // TODO: Implement Google OAuth flow if needed
});
*/
