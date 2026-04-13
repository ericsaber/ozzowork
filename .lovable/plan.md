

## Plan: Update AuthCallback redirects and add /auth route

### File 1: `src/pages/AuthCallback.tsx`
- Change both `window.location.replace('/auth')` → `window.location.replace('/')`

### File 2: `src/App.tsx`
- In the unauthenticated `<Routes>` block, add `<Route path="/auth" element={<Auth />} />` before the existing `<Route path="*"` catch-all

No other files touched. All `console.log` statements preserved.

