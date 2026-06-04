- [x] Fix server/otp-service.ts: make nodemailer import optional to avoid crash when nodemailer missing.

- [x] Verify server starts on port 3000 (stop old process if needed).


- [x] Test endpoints:

  - [x] POST /api/auth/send-otp with email
  - [x] POST /api/auth/send-otp with phone
  - [x] POST /api/auth/verify-otp for both

- [ ] If email OTP depends on SMTP env, surface clear error to client when unavailable.
- [ ] Ensure frontend signup/login uses OTP endpoints if present.

