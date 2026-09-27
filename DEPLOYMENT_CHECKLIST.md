# ✅ Render Deployment Checklist

## আপনার Blood Donation App Deploy করার আগে এইগুলো check করুন:

### 📋 Pre-Deployment Checklist

- [ ] **Firebase Admin SDK file আছে** `src/main/resources/blood-donation-admin-SDK.json`
- [ ] **MongoDB connection string সঠিক** `application.properties` তে
- [ ] **Email credentials configured** Gmail SMTP settings
- [ ] **Git initialized** এবং code committed
- [ ] **GitHub repository created**
- [ ] **Render account তৈরি করেছেন**

---

## 🚀 Deployment Steps

### ধাপ ১: GitHub এ Push করুন

```bash
# Check git status
git status

# Add all files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Create GitHub repo and add remote
git remote add origin https://github.com/YOUR_USERNAME/blood-donation.git

# Push to GitHub
git push -u origin main
```

### ধাপ ২: Render এ Deploy করুন

1. **Render এ যান**: https://render.com
2. **Sign in with GitHub**
3. **New + → Web Service**
4. **Repository select করুন**: blood-donation
5. **Settings configure করুন**:

#### Basic Info:
```
Name: blood-donation-backend
Region: Singapore
Branch: main
Runtime: Docker
```

#### Environment Variables:
```
SPRING_PROFILES_ACTIVE=prod
PORT=8080
JAVA_OPTS=-Xmx512m -XX:+UseContainerSupport
```

#### Advanced:
```
Health Check Path: /actuator/health
Auto-Deploy: Yes
```

6. **Create Web Service** button এ click করুন

### ধাপ ৩: Build Complete হওয়ার জন্য অপেক্ষা করুন

- ⏱️ সময় লাগবে: 5-10 মিনিট
- 📊 Logs দেখুন Render dashboard এ
- ✅ সফল হলে দেখবেন: "Your service is live 🎉"

---

## 🎯 Deployment Success এর পর

### আপনার App এর URL:
```
https://blood-donation-backend-XXXXX.onrender.com
```

### Test করুন:

```bash
# Health check
curl https://your-app.onrender.com/actuator/health

# Should return: {"status":"UP"}
```

### Browser এ open করুন:
```
https://your-app.onrender.com
```

---

## ⚠️ Important Notes

### Free Tier এ মনে রাখবেন:

1. **Cold Start**: 
   - 15 মিনিট inactive থাকলে sleep mode এ চলে যায়
   - প্রথম request এ 30-60 সেকেন্ড সময় নেয়

2. **Keep Alive Solution**:
   - UptimeRobot use করুন: https://uptimerobot.com
   - প্রতি 5 মিনিটে ping করুন: `/actuator/health`

3. **Resource Limits**:
   - 512 MB RAM
   - 750 hours/month free

---

## 🔧 Common Issues & Solutions

### ❌ Build Failed

**Check:**
```bash
# Local test
./mvnw clean package -DskipTests

# If successful locally, check Render logs
```

**Common Causes:**
- Java version mismatch
- Missing dependencies
- Memory limit exceeded

**Solution:**
- Check Dockerfile uses JDK 21
- Reduce JAVA_OPTS if needed
- Clear Render cache and redeploy

---

### ❌ Application Crashes

**Check Render Logs:**
1. Dashboard → Your Service → Logs
2. Look for errors:
   - `OutOfMemoryError` → Reduce memory usage
   - `MongoDB connection failed` → Check connection string
   - `Firebase error` → Verify SDK file

**Solutions:**
- Reduce `JAVA_OPTS` to `-Xmx400m`
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0`)
- Verify Firebase Admin SDK file is in resources

---

### ❌ Can't Access API

**Check:**
1. Service status (should be green)
2. Wait for cold start (30-60 seconds)
3. Try health endpoint: `/actuator/health`

**Solution:**
```bash
# Test with curl
curl -v https://your-app.onrender.com/actuator/health

# Check response
```

---

### ❌ CORS Issues

**If frontend can't connect:**

Check `SecurityConfig.java` has correct CORS:
```java
.cors(cors -> cors.configurationSource(request -> {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "http://localhost:3000",
        "https://your-frontend-url.com"
    ));
    // ... rest of config
}))
```

---

## 📊 Monitoring Your App

### Render Dashboard:
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Request count
- **Events**: Deploy history

### Health Monitoring:
```bash
# Check health
curl https://your-app.onrender.com/actuator/health

# Response:
{
  "status": "UP",
  "components": {
    "mongo": {"status": "UP"},
    "ping": {"status": "UP"}
  }
}
```

### UptimeRobot Setup:
1. Create free account: https://uptimerobot.com
2. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://your-app.onrender.com/actuator/health`
   - Interval: 5 minutes
3. Get alerts if app goes down

---

## 🔄 Update Your Deployed App

যখনই code change করবেন:

```bash
# Make changes
git add .
git commit -m "Update: description of changes"
git push

# Render automatically rebuilds and deploys! 🚀
```

---

## 🎊 Success Indicators

✅ **Your app is successfully deployed if:**

- [ ] Render shows "Live" status (green)
- [ ] Health check returns `{"status":"UP"}`
- [ ] API endpoints respond correctly
- [ ] No errors in Render logs
- [ ] MongoDB connection successful
- [ ] Email notifications working

---

## 📞 Need Help?

### Resources:
- **Render Docs**: https://render.com/docs
- **Community**: https://community.render.com
- **Status**: https://status.render.com

### Common Links:
- MongoDB Atlas: https://cloud.mongodb.com
- Firebase Console: https://console.firebase.google.com
- GitHub: https://github.com

---

## 🎉 আপনার App এখন Live!

**Share করুন সবার সাথে:**
```
https://blood-donation-backend.onrender.com
```

এখন যে কেউ এই link দিয়ে আপনার Blood Donation app use করতে পারবে! 🌍

---

**🩸 Made for saving lives through blood donation 🩸**
