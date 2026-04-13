

## Plan: Add AuthCallback page and route

### 1. Create `src/pages/AuthCallback.tsx`
New file with the component that checks for a session on mount and redirects to `/` (if authenticated) or `/auth` (if not). Shows "ozzo" loading text while resolving.

### 2. Update `src/App.tsx`
- Add `import AuthCallback from "./pages/AuthCallback";`
- Add `<Route path="/auth/callback" element={<AuthCallback />} />` inside the `<Routes>` block (before the catch-all)

No other files touched. All existing `console.log` statements preserved.

