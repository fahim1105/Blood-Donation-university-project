# 🔧 Firebase Storage CORS Error Fix

## ❌ Error:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
has been blocked by CORS policy
```

## 🎯 Solution: 2 Methods

---

## Method 1: Firebase Console (Recommended - Easy) ✅

### Step 1: Go to Firebase Console

1. **Open**: https://console.firebase.google.com
2. **Select Project**: blood-donation-f6ba8
3. **Go to**: Storage (left sidebar)

### Step 2: Update Storage Rules

Click on **"Rules"** tab and paste this:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow anyone to read profile photos
    match /profile-photos/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Default: authenticated users only
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Click "Publish"** ✅

---

## Method 2: Enable CORS on Firebase Storage (Advanced)

### Prerequisites:
- Google Cloud SDK installed
- gcloud CLI configured

### Step 1: Install Google Cloud SDK

**Windows:**
```powershell
# Download installer
https://cloud.google.com/sdk/docs/install
```

### Step 2: Login to Google Cloud

```bash
gcloud auth login
```

### Step 3: Set Project

```bash
gcloud config set project blood-donation-f6ba8
```

### Step 4: Apply CORS Configuration

```bash
gsutil cors set firebase-storage-cors.json gs://blood-donation-f6ba8.firebasestorage.app
```

### Step 5: Verify CORS

```bash
gsutil cors get gs://blood-donation-f6ba8.firebasestorage.app
```

---

## 🎯 Quick Fix: Use Different Upload Method

আপনার code এ change করতে পারেন:

### Current Code (CORS Issue):
```javascript
// Direct upload to Storage
const storageRef = ref(storage, `profile-photos/${user.uid}/${filename}`);
await uploadBytes(storageRef, file);
```

### Fixed Code (Use Firebase SDK properly):
```javascript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function uploadProfilePhoto(file) {
  const storage = getStorage();
  const filename = `${Date.now()}.${file.name.split('.').pop()}`;
  const storageRef = ref(storage, `profile-photos/${user.uid}/${filename}`);
  
  try {
    // Upload with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'uploadedBy': user.uid,
        'uploadedAt': new Date().toISOString()
      }
    };
    
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ File uploaded:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}
```

---

## 📝 Check Your Firebase Config

### Make sure firebase-config.js has Storage initialized:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "blood-donation-f6ba8.firebaseapp.com",
  projectId: "blood-donation-f6ba8",
  storageBucket: "blood-donation-f6ba8.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);  // ← Make sure this exists!
```

---

## 🔍 Debug Steps:

### 1. Check Firebase Storage Rules

Firebase Console → Storage → Rules:
```
Should allow authenticated writes
```

### 2. Check Browser Console

F12 → Console → Look for:
```
- Firebase initialization errors
- Storage not initialized
- Authentication issues
```

### 3. Check Network Tab

F12 → Network → Filter: firebasestorage
```
- Look for OPTIONS request (preflight)
- Check response headers
- Verify CORS headers present
```

### 4. Test Storage Connection

```javascript
// In browser console
import { getStorage } from 'firebase/storage';
const storage = getStorage();
console.log('Storage bucket:', storage.app.options.storageBucket);
```

---

## ✅ Checklist:

- [ ] Firebase Storage Rules updated
- [ ] Storage initialized in firebase-config.js
- [ ] User is authenticated (logged in)
- [ ] File upload code uses Firebase SDK
- [ ] CORS configured (if using gsutil)

---

## 🚀 After Fix:

1. **Refresh browser**: Ctrl + Shift + R
2. **Clear cache**: Ctrl + Shift + Delete
3. **Try upload again**
4. **Check console** for success message

---

## 💡 Alternative: Use Backend Upload

যদি Firebase Storage CORS সমস্যা continue করে, backend দিয়ে upload করতে পারেন:

### Backend Endpoint:

```java
@PostMapping("/api/v1/users/me/profile-photo")
public ResponseEntity<?> uploadProfilePhoto(
    @RequestParam("file") MultipartFile file,
    Authentication auth
) {
    String uid = (String) auth.getPrincipal();
    
    try {
        // Save file to Firebase Storage from backend
        String downloadUrl = firebaseService.uploadFile(file, uid);
        
        // Update user profile
        userService.updateProfilePhoto(uid, downloadUrl);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "photoUrl", downloadUrl
        ));
    } catch (Exception e) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", e.getMessage()));
    }
}
```

এতে CORS issue হবে না কারণ server-side upload!

---

## 📞 Quick Reference:

**Firebase Console**: https://console.firebase.google.com  
**Project ID**: blood-donation-f6ba8  
**Storage Bucket**: blood-donation-f6ba8.firebasestorage.app  

---

## ⚠️ Common Issues:

### Issue 1: "Storage not initialized"
**Fix**: Add `export const storage = getStorage(app);` in firebase-config.js

### Issue 2: "Permission denied"
**Fix**: Update Storage Rules to allow authenticated writes

### Issue 3: "CORS preflight failed"
**Fix**: Use Method 1 (Update Storage Rules) or Method 2 (gsutil CORS)

---

**🔥 সবচেয়ে সহজ: Firebase Console এ গিয়ে Storage Rules update করুন!** ✅
