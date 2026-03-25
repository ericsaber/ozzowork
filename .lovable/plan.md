

## Plan: Completion Context in History Thread Line

Three targeted edits across two files.

### 1. CompleteFollowupSheet.tsx — Link new record to completed coin

**File:** `src/components/CompleteFollowupSheet.tsx` (lines 89-98)

Add `related_task_record_id: taskRecordId` to the insert object, and add a console.log after the insert call.

### 2. ContactHistory.tsx — Update `getThreadLine` related record block

**File:** `src/pages/ContactHistory.tsx` (lines 170-184)

Replace the existing `related_task_record_id` handling block with expanded logic covering:
- **Cancelled**: Show `→ Follow-up cancelled · Was due {date}` (gray)
- **Completed**: Show `→ Was due {plannedDate} · Completed {completedDate}` (green)
- **Rescheduled** (active with date): Keep existing `→ Follow-up rescheduled to {date}` (sienna)
- Add a console.log for debugging related record lookups

### 3. ContactHistory.tsx — Reschedule annotation copy

**File:** `src/pages/ContactHistory.tsx` (lines 478-484)

Append `on {changed_at date}` to the "Rescheduled from" annotation when `changed_at` is available.

### Not touched
- Ghost row rendering, existing console.logs, all other files

