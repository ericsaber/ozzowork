

## Step 5: Rewrite contact record for new schema

Two files modified: `ContactFollowupCard.tsx` and `ContactHistory.tsx`.

### File 1: `ContactFollowupCard.tsx` — field rename only

Update the prop interface and all internal references:
- `planned_follow_up_type` → `planned_type` (lines 18, 47)
- `planned_follow_up_date` → `planned_date` (lines 19, 46)

### File 2: `ContactHistory.tsx` — full data layer + JSX rewrite

**Imports (lines 1-27):**
- Remove imports: `RescheduleSheet`, `ScheduleFollowupSheet`, `CompleteFollowupSheet`, `useCompleteTask`
- Remove unused icons: `ArrowRight`, `ChevronRight`, `Calendar`

**State & hooks (lines 39-53):**
- Remove: `rescheduleTask`/`setRescheduleTask`, `scheduleOpen`/`setScheduleOpen`
- Remove: `useCompleteTask` destructuring and its callback block

**Queries (lines 65-75):**
- Replace `task_records` query with three separate queries:
  1. Active follow-up from `follow_ups` (status=active, limit 1)
  2. Published interactions from `interactions` (status=published, ordered by connect_date desc)
  3. Completed/cancelled follow-ups with nested `follow_up_edits` from `follow_ups`
- Combine loading: `const isLoading = interactionsLoading || followUpsLoading`

**Derived data (lines 78-139):**
- Replace `activeFollowups`/`upcomingFollowups`/`overdueFollowups` with `hasActiveFollowup`, `isOverdue`, `isUpcoming` derived from single `activeFollowup`
- Replace `historyRecords` + `followUpEvents` + `timelineItems` with new 4-kind timeline builder (interaction, follow_up, follow_up_edit, follow_up_scheduled)
- Replace `featuredItem` with `featuredInteraction` from interactions array
- Replace `interactionCount`/`firstContactDate` to use interactions array

**Remove `handleComplete` function (lines 170-179)**

**JSX rewrites:**
- Lines 251-308: Replace schedule CTA + upcoming/overdue card sections with single `hasActiveFollowup` / `activeFollowup` block. Schedule CTA opens `setLogSheetOpen(true)`. Complete handler is a TODO stub.
- Lines 310-340: Replace featured card — remove navigate, remove ChevronRight, use "Connected" as default verb
- Lines 342-527: Replace entire timeline renderer with new 4-kind renderer (follow_up_scheduled, follow_up_edit, follow_up outcome, interaction). Remove all `cleared`/`cancelled tails-only`/`completed tails-only` legacy branches.
- Lines 539-548: Remove `ScheduleFollowupSheet`, `RescheduleSheet`, `CompleteFollowupSheet` JSX blocks. Keep `LogInteractionSheet`.

**Query invalidation:** Any remaining `invalidateQueries` calls updated from `task-records*` keys to `interactions`/`follow-ups*` keys.

