

## Plan: Switch Google sign-in from Lovable OAuth to Supabase OAuth

**File:** `src/pages/Auth.tsx`

**Important note:** This project uses Lovable Cloud, which provides managed Google OAuth via `lovable.auth.signInWithOAuth()`. Switching to `supabase.auth.signInWithOAuth()` directly means Google sign-in will only work if you have your own Google OAuth credentials configured in the backend authentication settings. The managed Lovable Cloud Google OAuth flow will no longer apply. Are you sure you want to proceed?

**Changes (if confirmed):**

1. Remove the import: `import { lovable } from "@/integrations/lovable/index";`
2. Replace `handleGoogleSignIn` to use `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })` instead of `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`

No other files touched. All existing `console.log` statements preserved.

