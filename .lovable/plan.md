

## Plan: Revert hasAuthToken check in App.tsx

**File:** `src/App.tsx`

Remove the `hasAuthToken` constant and revert the loading guard back to just `if (loading) {`. The two lines defining `hasAuthToken` and the modified condition will be replaced with the original simple check.

No other files touched. All `console.log` statements preserved.

