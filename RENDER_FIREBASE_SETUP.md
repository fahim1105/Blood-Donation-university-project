# 🔥 Render Firebase Setup Guide

## ✅ সমস্যার আসল কারণ:

Firebase Admin SDK credentials **Render এ নেই**! 

`.gitignore` তে `blood-donation-admin-SDK.json` থাকায় এটা GitHub এ push হয়নি। তাই Render এ deploy করার সময় Firebase token verify করতে পারছে না।

Result: **403 Forbidden** on all authenticated endpoints! 🚫

---

## 🛠️ সমাধান: Environment Variable হিসেবে Add করুন

### ধাপ ১: Firebase Credentials JSON কপি করুন

```powershell
# PowerShell এ এই command run করুন:
Get-Content "src\main\resources\blood-donation-admin-SDK.json" | Set-Clipboard
```

এটা আপনার Firebase credentials clipboard এ কপি করবে।

---

### ধাপ ২: Render Dashboard এ যান

1. **Render Dashboard**: https://dashboard.render.com
2. আপনার **blood-donation-backend** service select করুন
3. বাম পাশে **"Environment"** tab এ click করুন

---

### ধাপ ৩: Environment Variable Add করুন

**Add Environment Variable** button এ click করুন এবং:

#### Key:
```
FIREBASE_CREDENTIALS_JSON
```

#### Value:
Firebase credentials JSON paste করুন (clipboard থেকে - আপনার local file থেকে কপি করবেন):

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...your-private-key...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...",
  "universe_domain": "googleapis.com"
}
```

**⚠️ IMPORTANT**: আপনার **actual credentials** use করবেন যেটা আপনার local `src/main/resources/blood-donation-admin-SDK.json` file এ আছে। উপরেরটা শুধু example structure।

**⚠️ Important**: 
- সম্পূর্ণ JSON paste করুন (সব curly braces সহ)
- কোনো space বা newline মিস করবেন না
- এটা একটা **single line** হিসেবে paste করুন অথবা JSON minify করে নিন

---

### ধাপ ৪: Save করুন

"Add Environment Variable" button click করুন।

Render automatically **redeploy** শুরু করবে! ⏱️ 5-7 minutes

---

## 🚀 Deploy করুন (Code Update)

আগে code update push করুন:

```powershell
# Add changes
git add .

# Commit
git commit -m "Fix: Firebase credentials from environment variable"

# Push
git push origin main
```

---

## ✅ Verify করুন

### Deploy Complete হলে:

1. **Render Logs check** করুন:
   - Dashboard → Your Service → Logs
   - খুঁজুন: `✅ Firebase Admin SDK initialized successfully.`
   - যদি দেখেন: `❌ Firebase initialization failed` → credentials সঠিক নেই

2. **Test API**:
```bash
# Login করুন এবং browser console এ:
const token = await firebase.auth().currentUser.getIdToken();
console.log("Token:", token);

# এটা দিয়ে test করুন:
fetch('https://blood-donation-university-project.onrender.com/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json()).then(console.log);
```

3. **Expected Result**:
   - ✅ Profile data return করবে
   - ❌ 403 error আসবে না!

---

## 🔍 Troubleshooting

### Problem 1: "Firebase initialization failed"

**Cause**: JSON format ভুল বা incomplete

**Solution**:
1. JSON minify করুন: https://jsonformatter.org/json-minify
2. আবার environment variable এ paste করুন
3. Redeploy করুন

---

### Problem 2: Still 403 Error

**Check**:
1. Frontend থেকে token পাঠাচ্ছে কিনা:
```javascript
// Browser console:
const token = await firebase.auth().currentUser.getIdToken();
console.log("Token present:", token ? "✅" : "❌");
```

2. Request headers:
   - F12 → Network tab
   - যেকোনো API request click করুন
   - Headers → Request Headers
   - দেখুন: `Authorization: Bearer <long-token>` আছে কিনা

3. Render logs:
```
Look for: "Authenticated uid=..."
```

---

### Problem 3: Environment Variable না দেখাচ্ছে

**Check**:
- Render Dashboard → Environment tab
- `FIREBASE_CREDENTIALS_JSON` listed আছে কিনা
- যদি না থাকে, manually add করুন

---

## 📋 Complete Environment Variables List

Render এ এই environment variables থাকতে হবে:

```bash
# Firebase
FIREBASE_CREDENTIALS_JSON={...your-json...}

# Spring Profile
SPRING_PROFILES_ACTIVE=prod

# Port
PORT=8080

# Java Options
JAVA_OPTS=-Xmx512m -XX:+UseContainerSupport
```

---

## 🎯 After Success

সব ঠিক হলে:

✅ Login working  
✅ Profile loads  
✅ My Requests shows data  
✅ Inbox loads  
✅ All API calls return 200 OK  
✅ No more 403 Forbidden! 🎉  

---

## 💡 Pro Tips

### JSON Minify করুন:

Multi-line JSON environment variable এ issue করতে পারে। Minify করুন:

```bash
# PowerShell:
$json = Get-Content "src\main\resources\blood-donation-admin-SDK.json" -Raw
$minified = $json -replace '\s+', ' '
$minified | Set-Clipboard
```

এখন `$minified` paste করুন Render এ।

---

### Alternative: Base64 Encode

যদি JSON paste করে কাজ না করে:

```powershell
# Base64 encode:
$json = Get-Content "src\main\resources\blood-donation-admin-SDK.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Set-Clipboard
```

তারপর code এ decode করুন (optional - শুধু troubleshooting এর জন্য)

---

## 🎊 Success!

Firebase credentials সঠিকভাবে configure হলে আপনার সব API endpoints কাজ করবে!

**Deploy করুন এবং test করুন!** 🚀

---

**🔥 Firebase + Render = ❤️**
