

## Plan: Show loading state during OAuth token exchange

**File:** `src/App.tsx`

In the `AppContent` component, add a `hasAuthToken` check before the loading guard so the app continues showing the loading spinner while Supabase processes the OAuth hash/code parameters — preventing a flash of the Auth page.

**Change:** Replace `if (loading) {` with:
```ts
const hasAuthToken = window.location.hash.includes('access_token') || 
                     window.location.search.includes('code=');

if (loading || hasAuthToken) {
```

No other files touched. All `console.log` statements preserved.

