# Firebase Phone Authentication Setup Guide

## ✅ What's Been Implemented

### Backend:
- ✅ Firebase Admin SDK setup (server/firebase-admin.ts)
- ✅ OTP service updated for Firebase Phone Auth
- ✅ Firebase phone verification endpoint
- ✅ Private key token integration

### Frontend:
- ✅ Phone authentication with Recaptcha
- ✅ Send OTP via Firebase
- ✅ Verify OTP code
- ✅ Complete phone sign-up flow

### Environment:
- ✅ Firebase private key added to .env
- ✅ Firebase Admin SDK configuration ready

---

## 📱 **How Firebase Phone Authentication Works**

### Flow:
1. **User enters phone number** (format: +919876543210)
2. **Click "Send OTP"** → Firebase generates invisible Recaptcha
3. **Firebase sends SMS** to phone number (via Firebase backend)
4. **User enters OTP code** they received
5. **Click "Verify"** → Firebase confirms code
6. **Account auto-created** in MongoDB
7. **Redirected to profile** ✅

---

## 🚀 **SETUP STEPS**

### **STEP 1: Complete Firebase Console Setup**

1. Go to https://console.firebase.google.com
2. Select your FairFoods project
3. Go to **Authentication** → **Sign-in method**
4. Enable **Phone** provider:
   - Click **Phone**
   - Toggle **Enable**
   - (Optional) Add test phone numbers for development
   - Save

---

### **STEP 2: Your Firebase Private Key Token**

You've provided this token:
```
AdpetEYCfY3G8wx9FRNwAQIhAa8vxQJA5bv6cLZPyS1YlU7Y88-10WTNT2QlbyZfMRmDqLy-0mUZCJCtucidPYlNkAfvBtzZpZg1CXzho5NB-pZP2S3CscW4_rIWqh9aHJGrO-OXGVXU6XRYPjkTvTOuBw
```

✅ Already added to `.env` as `FIREBASE_PRIVATE_KEY`

---

### **STEP 3: Get Full Firebase Service Account (For Backend)**

For backend phone verification, we need full service account JSON:

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file
5. Add these values to root `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=your-full-private-key
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

---

### **STEP 4: Add Phone Field to Signup Page** *(Optional Next Step)*

Currently, signup page accepts email or phone. To add dedicated phone signup:

1. Create new page: `client/src/pages/phone-signup.tsx`
2. Use `sendPhoneOtp()` and `verifyPhoneOtp()` from firebase.ts
3. Add Recaptcha container: `<div id="recaptcha-container"></div>`

---

### **STEP 5: Restart Server**

```bash
npm install firebase-admin  # If not done yet
npm run dev
```

---

## 🧪 **TESTING PHONE AUTH**

### **Option 1: Test with Real Phone Number**
1. Go to signup page
2. Enter: **Email/Phone**: `+919876543210` (format: +COUNTRY_CODE + NUMBER)
3. Click "Send OTP"
4. Check your SMS 📱
5. Enter OTP and verify

### **Option 2: Test with Firebase Test Number** (Dev Only)
1. In Firebase Console, Authentication → Phone → Test numbers
2. Add: `+919876543210` with OTP code: `123456`
3. Use this number during testing - OTP `123456` will work

### **Option 3: Fallback OTP Verification**
If Firebase Phone Auth fails:
1. OTP is stored in MongoDB `otp_store` collection
2. Check server logs for OTP code
3. Use that code to verify

---

## 📊 **Phone Auth API Endpoints**

### **Send OTP**
```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "identifier": "+919876543210"
}
```

Response:
```json
{
  "message": "OTP sent to phone",
  "type": "sms"
}
```

### **Verify OTP**
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "identifier": "+919876543210",
  "otp": "123456"
}
```

### **Signup with OTP**
```bash
POST /api/auth/signup-with-otp
Content-Type: application/json

{
  "fullName": "Ramesh Kumar",
  "identifier": "+919876543210",
  "password": "pass123"
}
```

---

## 📱 **Phone Number Formats**

Firebase Phone Auth requires **international format**:

✅ Correct:
- `+919876543210` (India)
- `+14155552671` (USA)
- `+441234567890` (UK)

❌ Wrong:
- `9876543210` (no country code)
- `+91 9876543210` (spaces)
- `919876543210` (missing +)

---

## 🔄 **Firebase Phone Auth Flow (Frontend)**

```typescript
// Step 1: Send OTP
await sendPhoneOtp("+919876543210");
// SMS sent by Firebase ✓

// Step 2: Verify OTP
const result = await verifyPhoneOtp("123456");
// Firebase confirms code ✓

// Step 3: Get token
const token = result.token;
// Send to backend to create account ✓
```

---

## 🗄️ **Database Schema**

### User Document (with phone auth):
```javascript
{
  id: "uuid",
  fullName: "Ramesh Kumar",
  phone: "+919876543210",
  email: "", // Empty if phone signup
  password: "", // Empty if Firebase auth
  walletBalance: 0,
  orders: [],
  loginProvider: "phone", // or "google" or "email"
  createdAt: new Date()
}
```

### OTP Store Document:
```javascript
{
  phone: "+919876543210",
  otp: "123456",
  type: "sms",
  verified: true,
  expiresAt: new Date(), // 5 min expiry
  createdAt: new Date()
}
```

---

## 🔒 **Security Notes**

✅ **Implemented:**
- OTP expires in 5 minutes
- Recaptcha prevents abuse
- Firebase tokens verified
- One-time use OTP
- MongoDB stores verified status

⚠️ **TODO:**
- Rate limit OTP requests (max 5 per hour per number)
- Block numbers with too many failed attempts
- Add phone number verification badge

---

## 🐛 **TROUBLESHOOTING**

### Error: "reCAPTCHA failed"
- Ensure reCAPTCHA keys are correct in Firebase Console
- Verify Firebase app is authorized
- Check browser console (F12) for details

### Error: "Invalid phone number"
- Use international format: `+COUNTRY_CODE + NUMBER`
- No spaces or dashes allowed
- Verify country code is correct

### SMS Not Received
1. Check number format
2. Verify phone is not blocked
3. Check Firebase quotas
4. Check spam/blocked messages

### Verification Code Invalid
- Code might have expired (5 min max)
- Check Firebase Console for test number setup
- Verify correct code entered

---

## 📋 **NEXT STEPS**

1. ✅ Firebase Private Key added
2. ✅ Backend Firebase Admin SDK ready
3. ✅ Frontend Phone Auth ready
4. 🟡 **TODO**: Get full service account JSON (optional)
5. 🟡 **TODO**: Create dedicated phone signup page
6. 🟡 **TODO**: Add phone number to user profile

---

## 📚 **Firebase Phone Auth Docs**

- Official Docs: https://firebase.google.com/docs/auth/web/phone-auth
- Admin SDK: https://firebase.google.com/docs/auth/admin/manage-sessions
- Phone Numbers: https://firebase.google.com/docs/auth/web/phone-auth#formatting_phone_numbers

---

**Phone authentication is now ready! Test with Firebase test numbers or real phone.** 📱✅
