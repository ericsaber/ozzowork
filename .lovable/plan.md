

## Plan: Replace AuthCallback useEffect with explicit token extraction

**File:** `src/pages/AuthCallback.tsx`

Replace the entire `useEffect` with a new implementation that:
1. Extracts `access_token` and `refresh_token` from the URL hash
2. Calls `supabase.auth.setSession()` with those tokens
3. On success: `window.location.replace('/')`
4. On error or missing tokens: `window.location.replace('/auth')`

Remove the `useNavigate` import if still present. Keep `useEffect` from React and `supabase` import. Preserve all existing `console.log` statements and add the new ones specified.

