

## ContactHistory History Display Fix

Single file change: `src/pages/ContactHistory.tsx`

### Changes

1. **historyRecords filter** — add `|| r.status === 'cancelled'` to include cancelled tails-only records in history

2. **Replace `getThreadLine`** — new version handles completed ("Done"), cancelled ("Cancelled"), overdue, and active states with proper `typeLbl · Was due [date]` formatting and a new `console.log('[getThreadLine]', ...)` call

3. **Add cancelled record case in history map** — after the existing `cleared` block and before the normal record rendering, add a `status === 'cancelled'` branch that renders a non-tappable div at 0.55 opacity with Calendar icon, type label, planned date, optional "Cancelled [date] · Was due [date]" subline, and a "Cancelled" pill. Full-coin cancelled records (with `connect_type`) fall through to normal rendering where `getThreadLine` handles the thread line.

All existing console.log statements preserved. No other files touched.

