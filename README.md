# Elder's Veil — Comic Reading Platform

Elder's Veil is a full-stack comic/manga reading platform with PostgreSQL support, creator uploads, admin review, premium controls, in-app notifications, and **email-only authentication/notifications**.

## Email architecture
- Nodemailer + SMTP only
- Registration → email OTP → verification → login/dashboard
- Forgot password → email OTP → verify → new password + confirm password
- Welcome, comic/chapter review, new comic/chapter, premium, payment, admin and account emails
- OTPs are 6 digits, hashed in the database, expire after 10 minutes, and have a 5-attempt limit

## SMTP environment variables
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASSWORD=your_16_character_gmail_app_password
EMAIL_FROM=yourgmail@gmail.com
EMAIL_FROM_NAME="Elder's Veil"
```
For Gmail, use a Google App Password rather than your normal account password. Keep all SMTP credentials only in Render/server environment variables and never in frontend code or GitHub.

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:5000`.

## Render
Set `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, upload settings, and all `EMAIL_*` variables in the Render service environment. The backend runs migrations from `backend/migrations/schema.sql` at startup.

## Auth API
- `POST /api/auth/register`
- `POST /api/auth/verify-email-otp`
- `POST /api/auth/resend-email-otp`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-otp`
- `POST /api/auth/reset-password`

## Security notes
- Do not commit `.env`.
- Never put SMTP passwords or JWT secrets in frontend JavaScript.
- Existing users are treated as verified by the migration default; newly registered users must verify their email.
- Password reset responses are intentionally generic to reduce account enumeration.
