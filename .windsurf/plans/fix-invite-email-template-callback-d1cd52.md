# Fix Supabase Invite Email Template to Work with Callback Handler

The invite email link redirects immediately to `/auth/login?error=invalid_callback` because `{{ .TokenHash }}` doesn't provide the required `access_token` and `refresh_token` parameters.

## Root Cause

**Current email template:**
```html
<a href="{{ .SiteURL }}/auth/callback#{{ .TokenHash }}">Accept the invite</a>
```

**Problem:**
- `{{ .TokenHash }}` is either empty or doesn't contain the full token parameters
- The callback page expects: `#access_token=...&refresh_token=...&type=invite`
- Without these parameters, it immediately redirects to `/auth/login?error=invalid_callback` (line 19-21 of callback/page.tsx)

**Why it redirects so fast:**
- The callback page runs client-side JavaScript that checks for tokens
- If tokens are missing, it redirects before you can see the URL

## Solution Options

### Option 1: Use ConfirmationURL directly (simplest)
**Change email template back to:**
```html
<a href="{{ .ConfirmationURL }}">Accept the invite</a>
```

**Then update callback page to handle both:**
- URLs that come to `/auth/callback#...` (direct)
- URLs that come to `/#...` (from ConfirmationURL) and need client-side redirect

**Pros:** Uses Supabase's built-in variable that we know works
**Cons:** Requires updating callback page logic

### Option 2: Research correct Supabase variable
**Find the right template variable:**
- `{{ .TokenHash }}` might not be correct for invite emails
- Check Supabase docs for invite-specific variables
- Might need to use `{{ .Token }}` or construct manually

**Pros:** Clean solution if we find the right variable
**Cons:** May not exist; documentation unclear

### Option 3: Add debug logging to callback page
**Temporarily add console.log to see what's in the URL:**
- Log `window.location.href` and `window.location.hash`
- See exactly what `{{ .TokenHash }}` outputs
- Then fix based on actual data

**Pros:** Diagnostic approach
**Cons:** Requires code change just for debugging

## Recommended Approach

**Use Option 1** - it's the most reliable:

1. **Revert email template to:**
   ```html
   <h2>You have been invited</h2>
   <p>You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite:</p>
   <p><a href="{{ .ConfirmationURL }}">Accept the invite</a></p>
   ```

2. **Update `/auth/callback/page.tsx` to handle root-path redirects:**
   - Check if we're at `/` with hash tokens
   - If yes, redirect to `/auth/callback` with same hash
   - This makes it work with Supabase's default ConfirmationURL

3. **Alternative: Add a root-level redirect handler**
   - Create `/app/page.tsx` that checks for auth tokens in hash
   - If found, redirect to `/auth/callback` with hash preserved
   - Otherwise, redirect to `/auth/login`

## Implementation Plan

1. Update callback page to add debug logging (temporary)
2. Send new invite and check browser console to see actual URL structure
3. Based on findings, either:
   - Fix email template with correct variable, OR
   - Update callback page to handle ConfirmationURL format
4. Remove debug logging
5. Test full flow: invite → email → callback → reset password → dashboard

## Files to Modify

- `src/app/auth/callback/page.tsx` - Add handling for root-path redirects or debug logging
- Supabase Email Template (dashboard) - Revert to `{{ .ConfirmationURL }}` or find correct variable
- Possibly `src/app/page.tsx` - Add redirect logic if needed

## Questions Before Implementation

1. **Should we use ConfirmationURL and handle the redirect in code?** (recommended)
2. **Or should we try to find the correct Supabase template variable?** (might not exist)
3. **Do you want to see debug output first to diagnose exactly what's happening?**
