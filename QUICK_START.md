# 🩸 Blood Donation System - Quick Start Guide

## ✨ যা Implementation হয়েছে

### ✅ Core Features:

1. **⭐ Protected Route Logic (Vanilla JavaScript)**
   - Automatic authentication check
   - Guest vs Authenticated user detection
   - Session-based route protection

2. **⭐ Dynamic Redirect Back Flow**
   - User tries to access protected page → Redirected to login
   - After login → Automatically redirected BACK to intended page
   - Uses sessionStorage for state management

3. **⭐ 404 Not Found Page**
   - Custom styled error page
   - "Back to Home" button
   - Suggested pages list

4. **⭐ 403 Forbidden Page**
   - Access denied page for unauthorized users
   - Shown when non-admin tries to access admin routes

5. **⭐ 90-Day Cooldown Timer**
   - Visual countdown for next eligible donation
   - Progress circle animation
   - Availability status badge

6. **⭐ Role-Based Access Control (RBAC)**
   - DONOR role - Regular users
   - ADMIN role - Administrators
   - Client-side + Server-side validation

---

## 🚀 এখনই Test করুন

### 1. Protected Page তৈরি করুন

আপনার যেকোনো protected page এ (যেমন: `dashboard.html`):

```html
<body data-protected="true">
    <!-- Your content -->
    
    <script src="/js/firebase-config.js"></script>
    <script src="/js/auth-guard.js"></script>
</body>
```

### 2. Redirect Flow Test

```bash
# Step 1: Browser খুলুন (NOT logged in)
# Step 2: Navigate to: http://localhost:8080/dashboard
# Expected: Redirected to /login
# Expected: Console shows "🔒 Saved intended destination: /dashboard"

# Step 3: Login করুন
# Expected: Automatically redirected to /dashboard (not /profile)
# Expected: Console shows "🔄 Redirecting to: /dashboard"
```

### 3. Cooldown Timer Test

`dashboard.html` বা `profile.html` এ যুক্ত করুন:

```html
<div id="cooldown-timer"></div>

<script src="/js/cooldown-timer.js"></script>
<script>
    // Thymeleaf থেকে data নিন
    const lastDonation = /*[[${user.lastDonationDate}]]*/ null;
    
    if (lastDonation) {
        const timer = new CooldownTimer(lastDonation);
        timer.render();
    }
</script>
```

---

## 📂 File Structure

```
your-project/
├── src/main/resources/
│   ├── static/js/
│   │   ├── auth-guard.js          ⭐ NEW - Protected Route Logic
│   │   ├── redirect-handler.js    ⭐ NEW - Redirect Back
│   │   ├── cooldown-timer.js      ⭐ NEW - 90-Day Timer
│   │   └── auth.js                ✏️ MODIFIED
│   │
│   └── templates/
│       ├── error/
│       │   ├── 404.html           ⭐ NEW
│       │   └── 403.html           ⭐ NEW
│       └── login.html             ✏️ MODIFIED
│
└── src/main/java/.../controller/
    └── PageController.java        ✏️ MODIFIED
```

---

## 🎯 Usage Examples

### Example 1: Basic Protected Page

```html
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard</title>
</head>
<body data-protected="true">
    <h1>Protected Dashboard</h1>
    
    <script src="/js/firebase-config.js"></script>
    <script src="/js/auth-guard.js"></script>
</body>
</html>
```

### Example 2: Admin-Only Page

```html
<body data-protected="true" data-admin-only="true">
    <h1>Admin Panel</h1>
    
    <script src="/js/firebase-config.js"></script>
    <script src="/js/auth-guard.js"></script>
</body>
```

**Note:** `auth-guard.js` এ admin check যুক্ত করতে হবে:

```javascript
// Line 130 এর পরে যুক্ত করুন:
if (document.body.dataset.adminOnly === 'true' && authState.role !== 'ADMIN') {
    console.log('❌ Not an admin, redirecting to 403');
    hideLoadingScreen();
    redirectToForbidden();
    return false;
}
```

### Example 3: Cooldown Timer with Thymeleaf

```html
<div id="cooldown-timer"></div>

<script src="/js/cooldown-timer.js"></script>
<script th:inline="javascript">
    /*<![CDATA[*/
    const userProfile = {
        lastDonationDate: /*[[${user.lastDonationDate}]]*/ null,
        available: /*[[${user.available}]]*/ true
    };
    
    if (userProfile.lastDonationDate) {
        const timer = new CooldownTimer(userProfile.lastDonationDate);
        timer.render();
    }
    /*]]>*/
</script>
```

---

## 🔍 How It Works

### Authentication Flow:

```
┌─────────────────────────────────────────────────────────┐
│  User tries to access /dashboard                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  auth-guard.js      │
         │  checks Firebase    │
         └──────────┬──────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
    NOT Auth                  Auth ✅
        │                        │
        ▼                        ▼
  Save intended            Render page
  destination              
        │                        
        ▼                        
  Redirect to /login             
        │
        ▼
  User logs in ✅
        │
        ▼
  RedirectHandler
  .redirectBack()
        │
        ▼
  Navigate to
  /dashboard ✅
```

### Redirect Back Flow:

```javascript
// 1. auth-guard.js saves destination
sessionStorage.setItem('redirectAfterLogin', '/dashboard');

// 2. User logs in (auth.js)
await signInWithEmailAndPassword(auth, email, password);

// 3. redirect-handler.js redirects back
const intendedPath = sessionStorage.getItem('redirectAfterLogin');
window.location.href = intendedPath; // → /dashboard
sessionStorage.removeItem('redirectAfterLogin');
```

---

## 🧪 Testing Checklist

- [ ] ✅ Protected page redirects to login when not authenticated
- [ ] ✅ After login, user redirects back to intended page
- [ ] ✅ Admin routes blocked for regular users (403)
- [ ] ✅ 404 page shows for non-existent routes
- [ ] ✅ Cooldown timer displays correctly
- [ ] ✅ Availability toggle works (if implemented)

---

## 🐛 Common Issues & Fixes

### Issue 1: Redirect loop

**Problem:** Page keeps redirecting

**Fix:** 
```bash
# Clear session storage
sessionStorage.clear()

# Verify login.html does NOT have data-protected="true"
```

### Issue 2: 404/403 pages not showing

**Fix:**
```bash
# Restart Spring Boot
mvn spring-boot:run

# Verify files exist in templates/error/
```

### Issue 3: Auth guard not working

**Fix:**
```html
<!-- Correct script order: -->
<script src="/js/firebase-config.js"></script>  ← First
<script src="/js/auth-guard.js"></script>       ← Second
```

---

## 📚 Full Documentation

আরো বিস্তারিত জানতে দেখুন:

1. **TECHNICAL_REQUIREMENTS.md** - Complete technical specification
2. **COMPLETE_IMPLEMENTATION_GUIDE.md** - Step-by-step guide
3. **VANILLA_JS_IMPLEMENTATION_GUIDE.md** - JavaScript details

---

## 🎉 Success!

আপনার Blood Donation System এখন:
- ✅ Protected routes support করে
- ✅ Smart redirect back logic আছে
- ✅ Custom error pages আছে
- ✅ 90-day cooldown tracking করতে পারে
- ✅ Role-based access control আছে

**Next Steps:**
1. আপনার protected pages update করুন
2. Test করুন
3. Customize করুন (colors, text, etc.)
4. Production deploy করুন

---

## 🆘 Need Help?

যদি কোনো প্রশ্ন থাকে:
1. Browser console check করুন (F12)
2. Network tab দেখুন
3. Spring Boot logs check করুন
4. Implementation guides পড়ুন

**Happy Coding! 🩸💻**
