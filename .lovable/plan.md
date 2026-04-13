

## Plan: Improve AuthCallback session detection

**File:** `src/pages/AuthCallback.tsx`

Replace the existing `useEffect` with a more robust version that:
1. Tries `getSession()` first — if session exists, navigates to `/` immediately
2. If no session yet, subscribes to `onAuthStateChange` to wait for `SIGNED_IN`
3. Adds a 5-second fallback timeout that redirects to `/auth` if nothing happens
4. Properly cleans up subscription and timer

No other files touched. All `console.log` statements preserved.

