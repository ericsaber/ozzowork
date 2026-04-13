

## Plan: Use window.location.replace in AuthCallback

**File:** `src/pages/AuthCallback.tsx`

1. Remove `useNavigate` import from `react-router-dom` and the `const navigate = useNavigate()` line
2. Replace both `navigate("/", { replace: true })` → `window.location.replace("/")`
3. Replace `navigate("/auth", { replace: true })` → `window.location.replace("/auth")`
4. Remove unused `useNavigate` import from `react-router-dom` (keep `useEffect` from `react`)

No other files touched. All `console.log` statements preserved.

