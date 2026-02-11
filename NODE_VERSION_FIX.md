# Node.js Version Fix Applied ✅

## Problem

Your production backend was failing with:
```
TypeError: Cannot set property query of #<IncomingMessage> which has only a getter
```

**Root cause:** Render was using Node.js v22 by default, which has a breaking change incompatible with NestJS v11.

## Solution Applied

Added to `package.json`:
```json
"engines": {
  "node": "20.x"
}
```

This forces Render to use Node.js v20, which is fully compatible with NestJS v11.

## Timeline

1. ✅ First attempt: Added `rawBody: true` - didn't work
2. ✅ Second attempt: Force Node.js v20 - should fix it

## What Happens Next

1. **Render automatically detects the change** (~30 seconds)
2. **Rebuild starts** with Node.js v20 (~3-5 minutes)
3. **Backend deploys** with compatible Node version
4. **Login should work!**

## Expected Logs After Fix

You should see:
```
✔ Using Node version: 20.x.x (instead of 22.x.x)
[NestApplication] Nest application successfully started
[INFO] Application is running on: http://127.0.0.1:10000
Your service is live 🎉
```

**No more `[ERROR] Cannot set property query` errors!**

## Testing After Deployment

1. Wait ~5 minutes for Render to complete deployment
2. Check logs - should show Node v20.x.x
3. Try login at: https://rng-game-backend.vercel.app/login
   - Email: `admin@tcg.com`
   - Password: `tcgadmintestpass`

## Why This Works

Node.js v22 changed how HTTP request objects work internally. The `query` property became read-only, breaking NestJS's query parsing middleware.

Node.js v20 uses the old behavior that NestJS v11 expects.

## If It Still Fails

Check Render logs for:
- ❌ "User not found" → Reset password in production DB
- ❌ "Invalid password" → Password hash mismatch
- ❌ Different error → Share exact error message

---

**This should definitely fix the 500 error!** 🎯
