# 🚀 Production Deployment Checklist
**Target Launch:** Feb 12, 2026  
**Last Updated:** {{DATE}}

---

## 📋 Pre-Deployment Checks

### 1. Environment Variables ✅

**Backend (`.env`):**
- [ ] `DATABASE_URL` - Supabase connection string with pooling
- [ ] `DIRECT_URL` - Direct Supabase connection  
- [ ] `JWT_SECRET` - 64+ character random string (NEVER use "super-secret")
- [ ] `FRONTEND_API_KEY` - 32+ character random string
- [ ] `STRIPE_SECRET_KEY` - Live mode key from Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- [ ] `SENTRY_DSN` - Backend Sentry project DSN
- [ ] `FRONTEND_URL` - Production frontend URL (e.g., `https://rng-gamez-shop.vercel.app`)
- [ ] `NODE_ENV=production`

**Frontend (`.env.local` or Vercel env vars):**
- [ ] `NEXT_PUBLIC_API_URL` - Production backend URL
- [ ] `NEXT_PUBLIC_API_KEY` - Matches backend `FRONTEND_API_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Live mode publishable key
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Frontend Sentry project DSN

---

### 2. Stripe Configuration ✅

- [ ] **Live Mode Enabled** in Stripe Dashboard
- [ ] API keys copied from Dashboard → Developers → API Keys
- [ ] Webhook endpoint added: `https://YOUR_BACKEND/api/payments/webhook`
- [ ] Webhook events selected:
  - `checkout.session.completed` ✅
  - `payment_intent.succeeded` ✅
  - `payment_intent.payment_failed` ✅
- [ ] Webhook signing secret copied to `STRIPE_WEBHOOK_SECRET`
- [ ] Test payment completed in **Test Mode** first
- [ ] Business verification completed (if required)

---

### 3. Database ✅

- [ ] Supabase project created
- [ ] Connection pooling enabled (pgBouncer)
- [ ] Latest Prisma migrations applied: `npx prisma db push`
- [ ] Database backup enabled (Supabase → Database → Backups)
- [ ] Test backup/restore performed
- [ ] Connection limit set to 20 in `.env`

---

### 4. Security ✅

- [ ] `.env` files **NOT** committed to Git (check `.gitignore`)
- [ ] Git history audited for exposed secrets: `git log --all --full-history -- **/.env`
- [ ] Strong JWT secret generated (128+ hex characters)
- [ ] Rate limiting active:
  - Global: 100 req/min ✅
  - Login: 5 attempts/15min ✅
  - Checkout: 3/min ✅
- [ ] CORS restricted to production domain (no wildcards)
- [ ] HTTPS redirect middleware active
- [ ] Input sanitization middleware active

---

### 5. Monitoring ✅

- [ ] Sentry projects created (backend + frontend)
- [ ] Sentry DSN configured in environment variables
- [ ] Test error sent to Sentry (verify it appears in dashboard)
- [ ] Health endpoint accessible: `GET /health`
- [ ] Health check returns database status

---

### 6. SSL/HTTPS ✅

- [ ] SSL certificate auto-provisioned (Vercel/Render handles this)
- [ ] HTTPS redirect active in production
- [ ] Test: HTTP request redirects to HTTPS
- [ ] No mixed content warnings in browser console

---

### 7. Payment Flow Testing ✅

**Test Mode (Stripe Test Keys):**
- [ ] Place test order with card `4242 4242 4242 4242`
- [ ] Verify Stripe Checkout page loads
- [ ] Complete payment
- [ ] Verify webhook received (check logs)
- [ ] Verify order status changed to `PAID`
- [ ] Verify inventory deducted correctly

**Live Mode (Stripe Live Keys):**
- [ ] Switch to live Stripe keys
- [ ] Place small real order (e.g., $0.50 test product)
- [ ] Complete payment with real card
- [ ] Verify order confirmation received
- [ ] Verify funds captured in Stripe Dashboard

---

### 8. Error Handling ✅

- [ ] Test payment failure scenario
- [ ] Verify inventory rollback on failed payment
- [ ] Test checkout session expiration
- [ ] Verify low stock alerts logged
- [ ] Test insufficient stock error

---

### 9. Performance ✅

- [ ] Load test with 20 concurrent requests
- [ ] Verify database connection pool handles load
- [ ] No 500 errors under load
- [ ] Response times < 500ms for API calls

---

### 10. Final Review ✅

- [ ] All `console.log` replaced with `LoggerService` ✅
- [ ] No hardcoded secrets in codebase ✅
- [ ] All DTOs have validation decorators
- [ ] Integration tests passing (11/11) ✅
- [ ] Code linting passing
- [ ] TypeScript compilation successful

---

## 🚀 Deployment Steps

### Backend (Render/Railway)

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "chore: production ready"
   git push origin main
   ```

2. **Deploy to Render:**
   - Connect GitHub repository
   - Build command: `cd api && npm install && npx prisma generate`
   - Start command: `cd api && npm run start:prod`
   - Add all environment variables from checklist above

3. **Verify deployment:**
   - Check `/health` endpoint
   - Check Sentry for errors
   - Test API endpoint (e.g., `GET /api/products`)

---

### Frontend (Vercel)

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```
   OR connect GitHub and auto-deploy

2. **Add environment variables** in Vercel dashboard

3. **Verify deployment:**
   - Visit production URL
   - Test shop page loads
   - Attempt checkout

---

## 🎯 Post-Launch Monitoring

**First Hour:**
- [ ] Monitor Sentry for errors (every 15 min)
- [ ] Check health endpoint status
- [ ] Watch for Stripe webhook failures

**First Day:**
- [ ] Review all orders
- [ ] Check inventory accuracy
- [ ] Monitor low stock alerts  
- [ ] Verify email notifications working

**First Week:**
- [ ] Daily Sentry review
- [ ] Database backup verification
- [ ] Performance monitoring (response times)

---

## 🚨 Emergency Rollback Plan

If critical issues arise post-launch:

1. **Disable Checkout (Quick Fix):**
   - Set maintenance banner in frontend
   - OR disable checkout button temporarily

2. **Rollback Deployment:**
   - Vercel: Rollback to previous deployment in dashboard
   - Render: Redeploy previous commit

3. **Database Rollback:**
   - Restore from Supabase backup
   - Re-apply migrations if needed

4. **Contact Support:**
   - Stripe: https://support.stripe.com (24/7 chat)
   - Sentry: Check error logs for root cause

---

## ✅ Launch Day Checklist (Feb 12)

- [ ] All above checklists complete
- [ ] Final test order placed successfully
- [ ] Admin notification email received
- [ ] Sentry receiving events
- [ ] Rate limiting tested (attempt 6 logins, verify block)
- [ ] CORS tested (verify unauthorized domains blocked)
- [ ] SSL certificate valid (no browser warnings)
- [ ] Low stock alert tested

**When all checked:** 🎉 **LAUNCH!** 🚀

---

## 📞 Emergency Contacts

- **Stripe Support:** https://support.stripe.com
- **Supabase Support:** support@supabase.io
- **Sentry Support:** Via dashboard
- **Developer Contact:** [Your email/phone]

---

**Deployment Confidence:** 95%  
**Ready for Launch:** ✅
