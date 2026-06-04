# Firebase Setup Guide for Google Login + OTP

## ✅ What's Been Implemented

### Backend:
- ✅ Email OTP service (Nodemailer)
- ✅ OTP verification endpoints
- ✅ Firebase Google login endpoint
- ✅ Auto account creation on Google login

### Frontend:
- ✅ Firebase authentication setup
- ✅ Google login button on signup page
- ✅ Email OTP on signup page
- ✅ Firebase configuration

---

## 🚀 STEP-BY-STEP SETUP

### **STEP 1: Create Firebase Project**

1. Go to https://console.firebase.google.com
2. Click "Create Project" or use existing project
3. Enter project name: `FairFoods` (or your choice)
4. Complete setup (Firebase will generate project)

---

### **STEP 2: Enable Google Authentication**

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **Sign-in method**
3. Click **Google** provider
4. Enable it
5. Set "Project support email" (any email)
6. Click Save

---

### **STEP 3: Add Web App to Firebase**

1. In Firebase Console, click **Project Settings** (gear icon, top right)
2. Go to **General** tab
3. Under "Your apps", click **Add app**
4. Select **Web** (</> icon)
5. Enter app name: `FairFoods Web`
6. Click **Register app**
7. Copy the configuration

Example config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "fairfoods-xxxxx.firebaseapp.com",
  projectId: "fairfoods-xxxxx",
  storageBucket: "fairfoods-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

---

### **STEP 4: Update .env File**

Create/update `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=fairfoods-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fairfoods-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=fairfoods-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
```

Replace all `xxxxx` with your actual Firebase values!

---

### **STEP 5: Update Root .env File**

Update `.env` (root):

```env
# ===== EMAIL OTP CONFIGURATION =====
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx

# ===== FIREBASE CREDENTIALS (Optional - for backend verification) =====
FIREBASE_PROJECT_ID=fairfoods-xxxxx
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@fairfoods-xxxxx.iam.gserviceaccount.com
```

---

### **STEP 6: Install Firebase in Client**

```bash
cd client
npm install firebase
cd ..
npm install firebase-admin  # Optional - for backend Firebase integration
```

---

### **STEP 7: Setup Email OTP (Gmail)**

1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** and **Windows Computer**
3. Google generates 16-character password
4. Add to root `.env`:
   ```
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

---

### **STEP 8: Restart Server**

```bash
npm run dev
```

---

## 🧪 TESTING

### **Test Google Login:**
1. Go to http://localhost:5173/signup
2. Click "Continue with Google"
3. Sign in with Google account
4. User auto-created in MongoDB
5. Redirected to /profile

### **Test Email OTP:**
1. On signup page, enter name, email, password
2. Click "Send OTP"
3. Check email inbox (wait 10-30 sec)
4. Copy OTP, paste in form
5. Click "Verify & Create Account"

### **Test Manual OTP (Without Gmail Setup):**
1. Check server console logs
2. Find line: `[DEMO] Email OTP for xxxx: 123456`
3. Use OTP from logs

---

## 📱 DATABASE SCHEMA

### User Document (MongoDB):
```javascript
{
  id: "uuid",
  fullName: "John Doe",
  email: "john@example.com",
  phone: "+91...",
  password: "", // Empty for Google auth
  walletBalance: 0,
  address: "",
  orders: [],
  createdAt: new Date(),
  loginProvider: "google" // or "email"
}
```

### OTP Document (MongoDB - otp_store collection):
```javascript
{
  email: "john@example.com",
  otp: "123456",
  type: "email",
  verified: false,
  expiresAt: new Date(), // 5 minutes from now
  createdAt: new Date()
}
```

---

## 🔒 Security Checklist

- ✅ OTP expires in 5 minutes
- ✅ OTP cleared after use
- ✅ Firebase tokens verified on Google login
- ✅ JWT tokens for session management
- ⚠️ TODO: Add password hashing (bcrypt) for email/password signup

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find package 'firebase'"
- Solution: `npm install firebase` in client folder

### Error: "Cannot find package 'nodemailer'"
- Solution: `npm install nodemailer` in root

### Google login not working
- Check Firebase project ID and API key in .env
- Verify Google provider is enabled in Firebase Console
- Check browser console for errors (F12)

### Email OTP not received
- Check SMTP_EMAIL and SMTP_PASSWORD in .env
- Use Gmail App Password, not regular password
- Check spam folder
- Check server logs for errors

### MongoDB OTP collection not created
- It auto-creates on first OTP
- Verify MongoDB connection string in .env

---

## 📋 NEXT STEPS

1. ✅ Nodemailer installed
2. ✅ Firebase setup file created
3. ✅ Signup page updated with Google login
4. 🟡 **TODO**: Update login.tsx with Google login
5. 🟡 **TODO**: Update forgot-password.tsx with Google option (optional)
6. 🟡 **TODO**: Test all flows end-to-end

---

**All endpoints ready! Just add your Firebase credentials to .env** 🎉
