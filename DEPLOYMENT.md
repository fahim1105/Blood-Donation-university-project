# 🚀 HEMO Blood Donation - Deployment Instructions

## Environment Variables Required

Add these in Render.com Dashboard → Environment:

```env
# MongoDB
MONGODB_URI=mongodb+srv://blood-donaiton:6Hnxawh0AcBoiCeC@cluster0.mcccn4v.mongodb.net/blood_donation?retryWrites=true&w=majority

# Email
EMAIL_USERNAME=hemo.blood.donation.web.service@gmail.com
EMAIL_PASSWORD=izoeepzanxtqmqqa

# Spring Profile
SPRING_PROFILES_ACTIVE=prod

# JVM Settings
JAVA_TOOL_OPTIONS=-Xmx400m -Xss512k
```

## Firebase Secret File

Upload as Secret File in Render Dashboard:
- **Filename:** `blood-donation-admin-SDK.json`
- **Location:** Root directory
- **Contents:** Copy from `src/main/resources/blood-donation-admin-SDK.json`

## Build Command
```bash
./render-build.sh
```

## Start Command
```bash
./render-start.sh
```

## Post-Deployment

1. **Firebase Console:**
   - Add Render domain to authorized domains
   - Example: `hemo-blood-donation.onrender.com`

2. **MongoDB Atlas:**
   - Whitelist all IPs: `0.0.0.0/0`
   - Or specific Render IP if available

3. **Test Application:**
   - Visit your Render URL
   - Test login/register
   - Test blood request posting
   - Test email notifications

## Monitoring

- **Logs:** Render Dashboard → Logs
- **Restart:** Render Dashboard → Manual Deploy
- **Sleep Prevention:** Use UptimeRobot (free) to ping every 14 minutes

## Important Notes

- Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes 20-30 seconds
- Always use HTTPS in production
- Monitor logs for errors

---

**Deployed Application URL:** https://YOUR-APP-NAME.onrender.com
