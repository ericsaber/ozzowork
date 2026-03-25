

## Completed Tails-Only Ghost Row in History

Single file change: `src/pages/ContactHistory.tsx`

### Changes

1. **Expand `historyRecords` filter** — add `(r.status === 'completed' && !r.connect_type && !r.note && r.planned_follow_up_date)` condition

2. **Add completed tails-only ghost row** — after the cancelled case in `historyRecords.map()`, render a non-tappable div at 0.6 opacity with green Check icon, type label + "Was due [date]", optional "Completed [date]" subline, and green "Done" pill

3. **Verify `Check` import** from lucide-react (likely already present)

No other files touched. All existing console.log statements preserved.

