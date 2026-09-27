# ⚡ Quick Fix: 403 Forbidden Error

## 🎯 Do These 3 Steps:

### Step 1: Copy Firebase Credentials

```powershell
# Run in PowerShell:
Get-Content "src\main\resources\blood-donation-admin-SDK.json" -Raw | Set-Clipboard
```

Your Firebase JSON is now in clipboard! 📋

---

### Step 2: Add to Render

1. Go to: https://dashboard.render.com
2. Select your service: **blood-donation-backend**
3. Click **"Environment"** (left sidebar)
4. Click **"Add Environment Variable"**
5. Enter:
   - **Key**: `FIREBASE_CREDENTIALS_JSON`
   - **Value**: Paste from clipboard (Ctrl+V)
6. Click **"Save Changes"**

Render will auto-redeploy! ⏱️ Wait 5-7 minutes.

---

### Step 3: Push Code Update

```powershell
# Add all changes
git add .

# Commit
git commit -m "Fix: Firebase credentials from environment"

# Push to GitHub
git push origin main
```

Render will rebuild and deploy again.

---

## ✅ Done!

After deployment completes:

1. Clear browser cache: `Ctrl + Shift + Delete`
2. Hard refresh: `Ctrl + Shift + R`
3. Login again
4. Go to Profile → **No more 403!** 🎉

---

## 🔍 Check Success

### In Render Logs:
Look for:
```
✅ Firebase Admin SDK initialized successfully.
```

### In Browser:
```javascript
// Console:
const token = await firebase.auth().currentUser.getIdToken();
fetch('https://blood-donation-university-project.onrender.com/api/v1/users/me', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

Should return your profile data! ✅

---

## ❌ If Still Not Working:

1. **Check Firebase JSON format**:
   - Must be valid JSON
   - All quotes properly escaped
   - No missing commas

2. **Verify Environment Variable**:
   - Render Dashboard → Environment
   - `FIREBASE_CREDENTIALS_JSON` should be listed
   - Value should start with `{"type":"service_account"...`

3. **Check Render Logs**:
   - Look for errors during startup
   - Firebase initialization messages

---

**Need detailed help?** Read: `RENDER_FIREBASE_SETUP.md`

---

**🚀 Your app will work after these steps!**
