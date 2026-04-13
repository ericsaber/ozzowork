

## Plan: Switch PasswordGate from sessionStorage to localStorage

**File:** `src/components/PasswordGate.tsx`

Two changes:
1. Line 14: `sessionStorage.getItem` → `localStorage.getItem`
2. Line 33: `sessionStorage.setItem` → `localStorage.setItem`

No other changes.

