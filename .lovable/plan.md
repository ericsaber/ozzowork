

# Task Record Architecture Update + Bug Fixes

This is a major restructuring that merges interactions and follow-ups into a unified "task record" model, updates fonts globally, and rebuilds multiple screens.

## Step 1: Database Migration — New `task_records` Table

Create a new `task_records` table and migrate existing data:

```sql
CREATE TABLE public.task_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  connect_type text,           -- "what happened" type (call/email/text/meet/video)
  connect_date timestamptz,    -- when the interaction occurred
  note text,                   -- note/summary
  planned_follow_up_type text, -- "what's next" type
  planned_follow_up_date date, -- when the follow-up is due
  status text NOT NULL DEFAULT 'active', -- 'active' or 'completed'
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_records ENABLE ROW LEVEL SECURITY;

-- RLS policies (mirroring current patterns)
CREATE POLICY "Users can view own task_records" ON public.task_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own task_records" ON public.task_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task_records" ON public.task_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own task_records" ON public.task_records FOR DELETE USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_task_records_updated_at
  BEFORE UPDATE ON public.task_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update follow_up_edits to reference task_records
ALTER TABLE public.follow_up_edits ADD COLUMN task_record_id uuid REFERENCES public.task_records(id) ON DELETE CASCADE;

-- Migrate data: pair interactions with their linked follow-ups
INSERT INTO public.task_records (contact_id, user_id, connect_type, connect_date, note, planned_follow_up_type, planned_follow_up_date, status, completed_at, created_at)
SELECT
  i.contact_id, i.user_id, i.connect_type, i.date, i.note,
  f.follow_up_type, f.due_date,
  CASE WHEN f.completed THEN 'completed' ELSE 'active' END,
  f.completed_at, i.created_at
FROM interactions i
LEFT JOIN follow_ups f ON f.interaction_id = i.id;

-- Standalone follow-ups (tails only — no linked interaction)
INSERT INTO public.task_records (contact_id, user_id, planned_follow_up_type, planned_follow_up_date, status, completed_at, created_at)
SELECT f.contact_id, f.user_id, f.follow_up_type, f.due_date,
  CASE WHEN f.completed THEN 'completed' ELSE 'active' END,
  f.completed_at, f.created_at
FROM follow_ups f WHERE f.interaction_id IS NULL;

-- Interactions without follow-ups (heads only)
INSERT INTO public.task_records (contact_id, user_id, connect_type, connect_date, note, status, created_at)
SELECT i.contact_id, i.user_id, i.connect_type, i.date, i.note, 'active', i.created_at
FROM interactions i
WHERE NOT EXISTS (SELECT 1 FROM follow_ups f WHERE f.interaction_id = i.id);
```

Note: The old `interactions` and `follow_ups` tables will remain for now but the app will only use `task_records` going forward.

## Step 2: Font Update (Global)

**`src/index.css`**: Replace the Google Fonts import and CSS variables:
- Import `Crimson+Pro:wght@400;500;600` and `Outfit:wght@400;500;600` instead of DM Sans and Instrument Serif
- `--font-heading: 'Crimson Pro', serif;`
- `--font-body: 'Outfit', sans-serif;`

**Email templates** (`supabase/functions/_shared/email-templates/*.tsx`): Update font family references from `'DM Sans'` → `'Outfit'` and `'Instrument Serif'` → `'Crimson Pro'`.

No other file changes needed for fonts since all components reference `var(--font-body)` and `var(--font-heading)`.

## Step 3: Type Definitions

**`src/types/index.ts`**: Add `TaskRecord` interface matching the new table. Remove or deprecate `Interaction`, `FollowUp`, `FollowUpEdit`, `FollowupItem`.

## Step 4: Task Record Detail View (`src/pages/InteractionDetail.tsx` → repurposed)

Complete rewrite to match `ozzo_interaction_detail.html`:

- **Route stays**: `/interaction/:id` but now loads from `task_records`
- **Nav**: Back (left), three-dot menu (right) with "Edit" + "Reschedule" (no delete, no remove)
- **Contact header**: Avatar + name + subtitle (tappable to `/contact/:id`)
- **Unified card** with two sections separated by a divider with → label:
  - "WHAT HAPPENED" section: icon (gray rounded square) + type + date + relative time + note in italics. If empty: ghost "Log an interaction" button
  - Divider line with centered → label
  - "WHAT'S NEXT" section: icon (sienna/red rounded square) + type (sienna/red text) + due date + status pill (green for upcoming, red for overdue). If empty: ghost "Add a follow-up" button
- **Bottom action bar**: Varies by state (both sides shows "Log follow-up" + "Reschedule"; heads-only has no bar; tails-only shows "Log follow-up" + "Reschedule")
- **Edit menu "Edit"** navigates to the edit view (Step 5), not a bottom sheet

## Step 5: Task Record Edit View (New Page `src/pages/EditTaskRecord.tsx`)

Full-screen view matching `ozzo_edit_interaction.html`:

- **Nav**: Cancel (left), "Edit interaction" (center, Crimson Pro), Save (right, sienna)
- **Contact header**: Small avatar + name + subtitle
- **"What happened" card**: Toggle "Interaction logged" (sienna when on). When ON: type chips, date row with picker, note textarea. When OFF: fields collapse
- **"What's next" card**: Toggle "Follow-up planned" (sienna when on). When ON: type chips (smaller), date chips (Tomorrow/3 days/1 week/2 weeks/Pick date). When OFF: fields collapse
- **Bottom**: "Delete this interaction" red underlined text link
- **Save logic**: Updates the single `task_records` row. Writes to `follow_up_edits` if the follow-up type/date changed. If "what happened" toggle is turned off, clears `connect_type`, `connect_date`, `note`. If "what's next" toggle is turned off, clears `planned_follow_up_type`, `planned_follow_up_date`.
- **Route**: `/edit-task/:id`

## Step 6: Contact Record Updates (`src/pages/ContactHistory.tsx`)

Rewrite to query `task_records` instead of separate tables:

- **Action row**: Flush left (remove `justify-center`, use `justify-start`)
- **"Next follow-up" section**: Cards from active task_records where `planned_follow_up_date` is not null and status is active, sorted soonest first. Each card: checkbox circle (gray border, gray check icon — no colored borders), due date label, type pill (green bg for upcoming, red for overdue), relative time sub-line, three-dot menu with only "Edit" + "Reschedule"
- **"Overdue" section**: Same card format, label "OVERDUE" in neutral tertiary (not red), red pills
- **Remove**: Completed follow-ups subsection entirely (Step 8 revert)
- **"History" section**: Rows from task_records where `connect_type` is populated (interaction logged), sorted reverse chronological. Each row: icon (gray rounded square) + type verb ("Emailed", "Called", etc.) + date + note preview + follow-up thread line (`→ [Type] [Date] · Done` / `→ [Type] [Date] · Overdue` / `→ No follow-up`) + chevron. Tapping navigates to task record detail
- **Footer**: "[X] interactions · First contact [date]"
- **Remove**: `EditInteractionSheet`, `EditFollowupSheet` imports (edit is now full-screen)

## Step 7: Completion Flow (Bug Fix — Step 5 from prompt)

Create `src/hooks/useCompleteTask.ts` — shared completion handler:

```typescript
// Opens CompleteFollowupSheet which:
// 1. Updates task_records row: status = 'completed', completed_at = now()
// 2. Shows celebration header (first vs repeat)
// 3. Prompts to log the interaction (fills in connect_type/note on the SAME record)
// 4. Optionally creates a NEW task_record as the next follow-up
```

Replace every inline completion handler across:
- `ContactHistory.tsx` (contact record task cards)
- `Today.tsx` (today screen cards)
- `FollowupTask.tsx` → repurpose as redirect to `/interaction/:id`

The `CompleteFollowupSheet` already exists and has the right UX (celebration header + log step 1 + step 2). Modify it to:
- UPDATE the existing `task_records` row's `connect_type`, `connect_date`, `note` instead of inserting a new interaction
- Set `status = 'completed'`
- Step 2 creates a NEW `task_records` row (tails-only) for the next follow-up

## Step 8: Revert Completed Follow-ups Visual Treatment

- Remove the `completed` variant from `ContactFollowupCard.tsx`
- Remove the "Completed" section from `ContactHistory.tsx`
- Completed records just appear in History as normal rows with `→ [Type] [Date] · Done`

## Step 9: Schedule Follow-up Sheet Update

**`src/components/ScheduleFollowupSheet.tsx`**:
- Remove the note textarea (only type pills + date chips)
- When opened from a heads-only task record detail, UPDATE the existing `task_records` row's `planned_follow_up_type` and `planned_follow_up_date` instead of creating a new record
- When opened from contact record empty state, INSERT a new tails-only `task_records` row

## Step 10: Three-Dot Menu Cleanup

**`ContactFollowupCard.tsx`**: Remove "Remove follow-up" from dropdown menu. Only "Edit" (navigates to `/edit-task/:id`) and "Reschedule" (opens reschedule sheet).

## Step 11: Today Screen Updates (`src/pages/Today.tsx`)

- Query `task_records` where `planned_follow_up_date` is set, `status = 'active'`, due within the week
- Completion checkmark calls the shared completion handler (opens `CompleteFollowupSheet`)
- Remove direct `completeMutation` that just marks completed without the sheet

## Step 12: FollowupTask Page Redirect

`src/pages/FollowupTask.tsx` will be simplified or redirected. Since follow-ups are now task records, `/followup/:id` should redirect to `/interaction/:id` for the corresponding task record. Or repurpose the route to query `task_records` by ID.

## Step 13: Log Interaction Flow Update (`src/pages/LogInteraction.tsx`)

- Step 1: Creates a new `task_records` row with `connect_type`, `connect_date = now()`, `note`
- Step 2: Updates that same row's `planned_follow_up_type` and `planned_follow_up_date`
- Edit log: Uses upsert pattern on the same `task_records` row (already working pattern, just change table)

## Step 14: Routing Updates (`src/App.tsx`)

- Add route: `/edit-task/:id` → `EditTaskRecord`
- Keep `/interaction/:id` → repurposed `InteractionDetail` (now task record detail)
- `/followup/:id` → redirect to the task record detail

## Files Modified/Created

| File | Action |
|------|--------|
| `src/index.css` | Font swap |
| `src/types/index.ts` | Add TaskRecord, deprecate old types |
| `src/pages/InteractionDetail.tsx` | Complete rewrite (task record detail) |
| `src/pages/EditTaskRecord.tsx` | **New** — full-screen edit view |
| `src/pages/ContactHistory.tsx` | Major rewrite (query task_records, new layout) |
| `src/pages/Today.tsx` | Update queries + completion flow |
| `src/pages/LogInteraction.tsx` | Update to use task_records |
| `src/pages/FollowupTask.tsx` | Redirect to task record detail |
| `src/pages/Upcoming.tsx` | Update queries |
| `src/components/ContactFollowupCard.tsx` | Remove completed variant, update menu |
| `src/components/FollowupCard.tsx` | Update to use task_records |
| `src/components/CompleteFollowupSheet.tsx` | Update to write to task_records |
| `src/components/ScheduleFollowupSheet.tsx` | Remove note field, update logic |
| `src/components/CelebrationHeader.tsx` | Update query to count task_records |
| `src/hooks/useCompleteTask.ts` | **New** — shared completion handler |
| `src/App.tsx` | Add edit-task route |
| `supabase/functions/_shared/email-templates/*.tsx` | Font update |
| `supabase/functions/send-followup-reminders/index.ts` | Update to query task_records |
| Database migration | New table + data migration |

