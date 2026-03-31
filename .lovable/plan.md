

## Step 6: Rewrite Today screen for new schema

Two files modified: `FollowupCard.tsx` and `Today.tsx`.

### File 1: `FollowupCard.tsx`

**Props** (lines 5-18): Replace `connectType`, `connectDate`, `note` with single `lastInteraction` object. Change `plannedType` from `string` to `string | null`.

**Navigation** (line 45): Change `/interaction/${taskRecordId}` → `/contact/${contactId}`.

**Internal refs** (lines 36-37): Derive `ConnectIcon`/`connectVerb` from `lastInteraction?.connect_type`.

**Last connect section** (line 83): Gate on `lastInteraction?.connect_type` instead of `connectType`. Use `lastInteraction?.connect_date` and `lastInteraction?.note`.

### File 2: `Today.tsx`

**Imports** (lines 6-7): Remove `CompleteFollowupSheet`, `useCompleteTask`.

**Hooks** (lines 17-23): Remove `useCompleteTask` block.

**Query** (lines 25-56): Replace single `task_records` query with two queries:
1. `follow-ups-today` — from `follow_ups` table, status=active, planned_date ≤ windowEnd, with contacts join
2. `interactions-today` — from `interactions` table, status=published, filtered to contact IDs from query 1

Build `lastInteractionByContact` map from query 2. Categorize into overdue/dueToday/comingUp using `planned_date`.

**Remove** (lines 62-72): `handleComplete` function.

**renderCard** (lines 74-89): Pass `lastInteraction={lastInteractionByContact[item.contact_id]}`, use `planned_date`/`planned_type`, stub `onComplete` with TODO log.

**renderComingUp** (line 104, 107): Replace `planned_follow_up_date` → `planned_date`.

**JSX** (lines 166-168): Remove `CompleteFollowupSheet` block.

