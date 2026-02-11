# How to Check Render Logs for Login Error

Since environment variables are configured but login still fails, we need to see the exact error in Render logs.

## Step-by-Step:

1. **Go to Render Dashboard**
   - https://dashboard.render.com
   - Click on your backend service

2. **Click "Logs" Tab**
   - Should be in the top menu

3. **Try to Log In**
   - Go to your login page
   - Try logging in with `admin@tcg.com` / `tcgadmintestpass`
   - It will fail (we know this)

4. **Look at Logs Immediately After**
   - You should see error messages appear in red
   - Look for lines containing:
     - `ERROR`
     - `[ExceptionHandler]`
     - Stack traces

5. **Copy the Error Message**
   - Copy the full error text
   - Share with me

## Common Errors & Fixes:

### Error: "User not found"
**Cause:** Production database is different from local  
**Fix:** Run password reset script against production database

### Error: "Invalid password"
**Cause:** Password hash mismatch  
**Fix:** Reset password in production database

### Error: "Cannot connect to database"
**Cause:** DATABASE_URL is incorrect  
**Fix:** Verify DATABASE_URL matches your local .env

### Error: "emailVerified is not a column"
**Cause:** Database schema not updated  
**Fix:** Run `prisma db push` in Render

## What to Share:

Please copy the error message that appears in Render logs when you try to log in. It should look something like:

```
[Nest] 142  - 02/11/2026, 7:49:42 PM   ERROR [ExceptionHandler] ...
Error: [SPECIFIC ERROR HERE]
    at ...
```

Share that with me and I'll tell you exactly how to fix it!
