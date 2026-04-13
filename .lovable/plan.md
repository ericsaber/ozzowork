

## Plan: Update Google OAuth redirect URL

**File:** `src/pages/Auth.tsx`

Single change: update `redirectTo` in `handleGoogleSignIn` from `window.location.origin` to `` `${window.location.origin}/auth/callback` ``.

No other changes.

