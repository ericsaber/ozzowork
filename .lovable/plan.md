

## Steps 3 & 4: Rewrite log flow for new tables

Two files modified. No other files touched.

### File 1: `src/components/LogInteractionSheet.tsx`

**Props & state cleanup:**
- Remove `existingTaskRecordId` from props interface and destructuring
- Remove `savedTaskRecordId` state
- Add skipFollowupStep stub at top of logMutation that logs and returns early

**Query changes:**
- `activeFollowup` query: read from `follow_ups` table instead of `task_records`. Select `id, planned_type, planned_date, status`. Remove `planned_follow_up_date`/`related_task_record_id` filters.
- `invalidateAll`: replace `task-records*` keys with `interactions` and `follow-ups`

**Mutation rewrites (all switching from `task_records` to `interactions` + `follow_ups`):**
- `logMutation`: write drafts to `interactions` table. Remove skipFollowupStep DB path (stub instead). On success, reference `activeFollowup.planned_type`/`planned_date` instead of old field names.
- `followupMutation`: complete path marks existing `follow_ups` row as completed (writing connect_type/connect_date/note onto it), publishes interaction draft, optionally inserts new `follow_ups` row. Normal path publishes draft + inserts `follow_ups`. Remove all `isTailsOnly` logic.
- `handleSkip`: complete path marks follow_up completed + publishes draft. Normal path just publishes draft (no "promote to active" — it's already a separate interaction).
- `handleOutstandingUpdate`: insert `follow_up_edits` (without `task_record_id`), update `follow_ups.planned_date`, publish interaction draft. Remove `related_task_record_id`/`follow_up_action` fields.
- `handleOutstandingCancelConfirm`: mark `follow_ups` cancelled, publish interaction draft. Remove `related_task_record_id`.
- `handleChangeContact`: delete draft from `interactions` table
- `handleUpdateLog`: update draft in `interactions` table
- Discard dialog: delete from `interactions` table

**Remove all references to:** `related_task_record_id`, `follow_up_action`, `isTailsOnly`, `planned_follow_up_date`, `planned_follow_up_type`, `savedTaskRecordId`

### File 2: `src/components/OutstandingFollowupStep.tsx`

**Props interface:** change to `{ id: string; planned_type: string | null; planned_date: string; status: string }`

**Field references throughout:**
- `planned_follow_up_date` → `planned_date` (lines 40, 47, 54, 101, 190, 195, 256)
- `planned_follow_up_type` → `planned_type` (lines 49, 75, 76)
- Remove `isTailsOnly` log line (line 50) — replace with just `status: existingFollowup.status`
- Remove references to `connect_type` and `note` on the followup object

All existing `console.log` statements preserved (updated to use new field names).

