

## Plan: Add magic link verification to AuthCallback.tsx

**File:** `src/pages/AuthCallback.tsx`

Inside the `useEffect`, before the existing hash-based token check, read `token_hash` and `type` from `window.location.search` (query params). If both are present, call `supabase.auth.verifyOtp({ token_hash, type })`. On success, log and redirect to `/`. On error, log the error and redirect to `/auth?error=link_expired`. Return early so the existing OAuth flow below is not triggered.

The existing `access_token`/`refresh_token` hash handling remains unchanged beneath this new block.

### Pseudocode

```ts
useEffect(() => {
  const searchParams = new URLSearchParams(window.location.search);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  if (token_hash && type) {
    supabase.auth.verifyOtp({ token_hash, type: type as any }).then(({ error }) => {
      if (error) {
        console.error('[AuthCallback] verifyOtp error:', error);
        window.location.replace('/auth?error=link_expired');
      } else {
        console.log('[AuthCallback] verifyOtp success');
        window.location.replace('/');
      }
    });
    return; // skip hash-based OAuth handling
  }

  // ... existing hash-based setSession logic unchanged ...
}, []);
```

No other files touched. All `console.log` statements preserved.

