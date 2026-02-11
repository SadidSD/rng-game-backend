# Production Backend Fix - Environment Variables for Render

## Problem
Your production backend at `https://rng-game-backend.onrender.com` is crashing with 500 errors because it doesn't have the required environment variables configured.

---

## Solution: Add These Environment Variables to Render

### Step-by-Step:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Click on your backend service

2. **Go to Environment Tab**
   - Click "Environment" in the left sidebar

3. **Add These Variables** (Click "Add Environment Variable" for each):

```bash
# Database Connection (CRITICAL)
DATABASE_URL=postgresql://postgres.lalcsglawekqukzvpyjd:itsyour SD@123@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=20&pool_timeout=60

DIRECT_URL=postgresql://postgres.lalcsglawekqukzvpyjd:itsyourSD@123@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# Security (CRITICAL)
JWT_SECRET=6b36953516e53ecaa1c7e8e1839319d7a21c27cc228a5f14d0c8f2feaf3110ab5c61ab1afff505b2a91310

FRONTEND_API_KEY=2feaf3110ab5c61ab1afff505b2a91310

# Store Configuration (CRITICAL)
SINGLE_TENANT_STORE_ID=d02dbcba-81b5-4f9d-831c-54fe9a803081

# Frontend URL (CRITICAL)
FRONTEND_URL=https://rng-game-backend.vercel.app

# Environment Mode
NODE_ENV=production

# Stripe (Placeholder - Payment won't work until you add real keys)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# Monitoring
SENTRY_DSN=https://eacd527dce567cb827fc3fb0cd5830f8@o4510856614445056.ingest.us.sentry.io/4510856620605440

# Manapool Integration
MANAPOOL_ACCESS_TOKEN=mpat_e8en2ug93ymnry741xuh6t62d
```

4. **Click "Save Changes"**

5. **Wait for Redeploy** (~2-3 minutes)
   - Render will automatically redeploy
   - Check the "Logs" tab to verify it starts successfully

---

## After Adding Environment Variables

**What should happen:**
- ✅ Backend starts successfully (no crash)
- ✅ `/health` endpoint responds
- ✅ Login works with `admin@tcg.com` / `tcgadmintestpass`

**Check logs for:**
```
[Nest] Starting Nest application...
[Nest] PrismaService initialized
[Nest] Application is running on: http://0.0.0.0:10000
```

---

## Quick Verification

After Render redeploys, try these:

**1. Test health endpoint:**
```
https://rng-game-backend.onrender.com/health
```
Should return:
```json
{
  "status": "ok",
  "checks": { "database": { "status": "up" } }
}
```

**2. Try logging in:**
```
Email: admin@tcg.com
Password: tcgadmintestpass
```

---

## Troubleshooting

**If it still crashes:**
1. Check Render Logs tab for exact error
2. Verify DATABASE_URL is exactly as shown above
3. Make sure there are no extra spaces in the values

**Common issues:**
- Missing `DATABASE_URL` → "Cannot connect to database"
- Missing `JWT_SECRET` → "JWT secret not configured"
- Missing `SINGLE_TENANT_STORE_ID` → "Store not found"

---

## Important Notes

⚠️ **PASSWORD IN DATABASE_URL:** The connection string contains the password `itsyourSD@123` - this is YOUR Supabase password. Keep this secure!

⚠️ **STRIPE PLACEHOLDER:** Payments won't work until you replace with real Stripe keys. But the backend will start and login will work.

---

## After This Works

Once login works in production:
1. ✅ Your shop customers can sign up/login
2. ✅ Admin dashboard login works
3. ✅ All API endpoints work
4. ⚠️ Payments disabled until Stripe keys added
5. ⚠️ Emails disabled until SMTP configured

**Next step after login works:** Add real Stripe keys for payments
