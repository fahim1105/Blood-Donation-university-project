// ══════════════════════════════════════════════════════════
// firebase-config.js  —  Firebase Client SDK setup
// ══════════════════════════════════════════════════════════

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAeNA33Uj-arCk2uTBqaACJBmvxcXkfnRg",
  authDomain:        "blood-donation-f6ba8.firebaseapp.com",
  projectId:         "blood-donation-f6ba8",
  storageBucket:     "blood-donation-f6ba8.firebasestorage.app",
  messagingSenderId: "1036211368431",
  appId:             "1:1036211368431:web:36543c6b04e52518e3061a"
};

const app     = initializeApp(firebaseConfig);
const auth    = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };
