

## Fix: Unequal section gaps on Today screen

### Root cause

The parent `div` uses `space-y-0`, which applies `margin-top: 0` to all direct children via `> :not([hidden]) ~ :not([hidden])`. This selector competes with the explicit `mt-10` on section headers. Because the Coming Up content renders as a React fragment (its `h2` and `button` become direct children of the parent), the `space-y-0` rule can interfere with the `mt-10` differently than it does for the Overdue `<section>` wrapper.

### Fix

Remove `space-y-0` from the parent wrapper div (line ~130). The sections already manage their own spacing via `mt-10` and `mb-3` — the `space-y-0` is unnecessary and is the source of the conflict.

| File | Change |
|------|--------|
| `src/pages/Today.tsx` | Line ~130: `className="space-y-0"` → remove `space-y-0` (just use empty or no class) |

