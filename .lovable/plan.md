

## Fix: Standalone log thread line — keep vs reschedule label and date

### Problem
The current keep/reschedule detection in `getThreadLine` relies on `rescheduleInfo` from `rescheduleMap`, which only holds one entry per coin. Multiple standalone logs pointing at the same coin break this lookup.

### Solution
Store the action type (`'kept'` or `'rescheduled'`) directly on each standalone log record via a new `follow_up_action` column, then read it in `getThreadLine` instead of inferring from edits.

### Changes

**1. Database migration** — Add `follow_up_action` column to `task_records`
```sql
ALTER TABLE task_records ADD COLUMN IF NOT EXISTS follow_up_action text;
```

**2. `src/components/LogInteractionSheet.tsx` → `handleOutstandingUpdate`** (lines 436-442)

Update the draft promotion to include `follow_up_action`:
- `follow_up_action: isKeep ? 'kept' : 'rescheduled'`
- `planned_follow_up_date: isKeep ? previousDate : newDate` (keep stores the original date, reschedule stores the new date)
- Add console.log after the update

**3. `src/pages/ContactHistory.tsx` → `getThreadLine`** (lines 204-214)

Replace the active related record branch with direct reads from `record.follow_up_action` and `record.planned_follow_up_date`:
- `'kept'` → `→ Follow-up kept for [date]`
- `'rescheduled'` → `→ Follow-up rescheduled to [date]`
- Add console.log for debugging

All existing console.logs, rescheduleMap usage elsewhere, and other logic remain untouched.

