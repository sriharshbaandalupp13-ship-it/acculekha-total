# Acculekhaa Next.js Catalogue

This project migrates your static catalogue into a full-stack Next.js app with:

- Product API + admin editing
- Orders + inquiries API
- Secure admin login (HTTP-only cookie + hashed password)
- OTP send/verify API (Twilio-supported, dev fallback)
- Razorpay order API + webhook verification
- Media upload API via Vercel Blob

## 1. Install

```bash
npm install
```

## 2. Configure env

Copy `.env.example` to `.env.local` and fill values.

## 3. Database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 4. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Vercel Deploy

1. Push to GitHub
2. Import repo in Vercel
3. Add env vars from `.env.example`
4. Use Vercel Postgres for `DATABASE_URL`
5. Redeploy

## Notes

- First run auto-seeds default products.
- First run also creates admin user from `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
- OTP returns `demoOtp` only in non-production mode.
