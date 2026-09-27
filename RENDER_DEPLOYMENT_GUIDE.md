# 🚀 Render Deployment Guide - Blood Donation App

## Prerequisites
- GitHub account
- Render account (free tier)
- Your code pushed to GitHub

---

## 📝 Step-by-Step Deployment

### 1️⃣ Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/blood-donation.git

# Push to GitHub
git push -u origin main
```

---

### 2️⃣ Deploy on Render

1. **Go to Render**: https://render.com/
2. **Sign up/Login** with GitHub
3. **Click "New +"** → Select **"Web Service"**
4. **Connect your repository**: blood-donation
5. **Configure the service**:

#### Basic Settings:
- **Name**: `blood-donation-backend`
- **Region**: `Singapore` (or closest to you)
- **Branch**: `main`
- **Runtime**: `Docker`

#### Build Settings:
- **Dockerfile Path**: `./Dockerfile`
- **Docker Command**: (leave empty, uses Dockerfile default)

#### Environment Variables:
Add these in "Environment" section:
```
SPRING_PROFILES_ACTIVE=prod
PORT=8080
JAVA_OPTS=-Xmx512m -XX:+UseContainerSupport
```

#### Advanced:
- **Health Check Path**: `/actuator/health`
- **Auto-Deploy**: `Yes` (deploys automatically on git push)

6. **Click "Create Web Service"**

---

### 3️⃣ Wait for Deployment

- Build takes 5-10 minutes
- Watch the logs in Render dashboard
- Once deployed, you'll get a URL like:
  ```
  https://blood-donation-backend.onrender.com
  ```

---

## 🎯 After Deployment

### Test Your API:
```bash
# Health check
curl https://your-app.onrender.com/actuator/health

# API endpoints
curl https://your-app.onrender.com/api/users
```

### Your app is now live! 🎉

Share this link with anyone:
```
https://blood-donation-backend.onrender.com
```

---

## ⚠️ Important Notes

### Free Tier Limitations:
- ✅ 750 hours/month free
- ✅ Spins down after 15 minutes of inactivity
- ⏱️ First request after sleep takes 30-60 seconds (cold start)
- 💾 512 MB RAM limit

### Keep Your App Active:
Use a service like **UptimeRobot** to ping your app every 5 minutes:
- URL to ping: `https://your-app.onrender.com/actuator/health`

---

## 🔧 Troubleshooting

### Build Failed?
1. Check Render logs
2. Common issues:
   - **Java version**: Make sure Dockerfile uses JDK 21
   - **Memory**: Reduce JAVA_OPTS if build fails
   - **Dependencies**: Check if all dependencies download correctly

### App Crashes?
1. Check Application logs in Render dashboard
2. Check MongoDB connection
3. Verify Firebase credentials are in `src/main/resources/`

### Can't Access API?
1. Check if service is running (green status)
2. Wait for cold start (30-60 seconds)
3. Check health endpoint: `/actuator/health`

---

## 📊 Monitoring

- **Logs**: Render Dashboard → Your Service → Logs
- **Metrics**: Render Dashboard → Your Service → Metrics
- **Health**: `https://your-app.onrender.com/actuator/health`

---

## 🔄 Update Deployment

Just push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push
```

Render will automatically rebuild and deploy! 🚀

---

## 💡 Tips

1. **Use environment variables** for sensitive data (in Render dashboard)
2. **Enable auto-deploy** for continuous deployment
3. **Set up health checks** to monitor uptime
4. **Use proper logging** to debug issues
5. **Monitor memory usage** to avoid crashes

---

## 🎊 Success!

Your Blood Donation app is now accessible worldwide! 🌍

Share your link:
```
https://blood-donation-backend.onrender.com
```

---

## Need Help?

- Render Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com
