

## Plan: Allow /auth/callback route when unauthenticated

**File:** `src/App.tsx`

Replace the early `if (!session) return <Auth />;` with a `<Routes>` block that renders `<AuthCallback />` on `/auth/callback` and `<Auth />` on all other paths. This ensures the OAuth callback can process the session token before the app redirects to the login page.

No other files touched. All `console.log` statements preserved.

