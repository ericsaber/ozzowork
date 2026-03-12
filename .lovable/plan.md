

# Follow-up & Interaction Architecture Overhaul

This is a large, interconnected change touching the data model, multiple screens, and several components. I'll break it into phases.

---

## Phase 1 — Database Migration

### New tables

**`follow_ups`** table:
- `id` uuid PK default gen_random_uuid()
- `contact_id` uuid NOT NULL FK → contacts (ON DELETE CASCADE)
- `interaction_id` uuid NULLABLE FK → interactions (ON DELETE SET NULL) ← orphans on interaction delete
- `follow_up_type` text NOT NULL
- `due_date` date NOT NULL
- `completed` boolean NOT NULL default false
- `completed_at` timestamptz NULLABLE
- `created_at` timestamptz NOT NULL default now()
- `user_id` uuid NOT NULL

RLS: same pattern as interactions — users can CRUD own rows via `auth.uid() = user_id`.

**`follow_up_edits`** table:
- `id` uuid PK default gen_random_uuid()
- `follow_up_id` uuid NOT NULL FK → follow_ups (ON DELETE CASCADE)
- `previous_type` text NOT NULL
- `previous_due_date` date NOT NULL
- `changed_at` timestamptz NOT NULL default now()
- `user_id` uuid NOT NULL

RLS: users can SELECT/INSERT own rows.

### Data migration
Insert into `follow_ups` for every interaction row where `follow_up_date IS NOT NULL`:
```sql
INSERT INTO follow_ups (contact_id, interaction_id, follow_up_type, due_date, user_id)
SELECT contact_id, id, planned_follow_up_type, follow_up_date, user_id
FROM interactions WHERE follow_up_date IS NOT NULL;
```

Note: We will NOT drop `planned_follow_up_type` / `follow_up_date` columns yet — they'll be deprecated in code only, to avoid breaking anything during rollout.

---

## Phase 2 — Update all queries to use `follow_ups` table

### Files affected for read queries:

| File | Current behavior | New behavior |
|------|-----------------|--------------|
| `src/pages/Today.tsx` | Queries `interactions` with `follow_up_date` filter | Query `follow_ups` where `completed = false` and `due_date <= weekEnd`, join contacts via `contact_id` |
| `src/pages/Upcoming.tsx` | Queries `interactions` with `follow_up_date > today` | Query `follow_ups` where `completed = false` and `due_date > today` |
| `src/pages/ContactHistory.tsx` | Filters interactions by `follow_up_date` for upcoming/overdue sections | Query `follow_ups` for this contact where `completed = false` |
| `src/pages/FollowupTask.tsx` | Queries single interaction by id | Redesigned — now queries a `follow_up` by id, joins interaction via `interaction_id` |

### Files affected for write operations:

| File | Change |
|------|--------|
| `src/pages/LogInteraction.tsx` | Step 2 creates a `follow_ups` row instead of updating `interactions.follow_up_date` |
| `src/components/CompleteFollowupSheet.tsx` | Step 2 creates a `follow_ups` row; completing marks `follow_ups.completed = true` |
| `src/components/RescheduleSheet.tsx` | Updates `follow_ups` row, writes `follow_up_edits` row |
| `src/components/EditInteractionDialog.tsx` | Replaced by two new sheets (see Phase 4) |

---

## Phase 3 — Context menus (Section 3)

**On follow-up cards** (`ContactFollowupCard`):
- Edit follow-up → opens Edit Follow-up Sheet
- Remove follow-up → deletes the `follow_ups` row (with confirmation)
- Reschedule (overdue only)

**On interaction history items** (in `ContactHistory.tsx`):
- Edit interaction → opens Edit Interaction Sheet
- Delete interaction → deletes interaction, orphans follow-up (sets `interaction_id = null`)

These are two separate, non-overlapping menus.

---

## Phase 4 — Two distinct edit sheets (Section 4)

### 4a — `EditFollowupSheet.tsx` (new component)
- Bottom sheet (Drawer)
- Title: "Edit follow-up", subtitle: "Originally set [date] · [original type]"
- Fields: follow-up type chips, due date picker
- Save button (burnt sienna). No destructive actions.
- On save: update `follow_ups` row, write `follow_up_edits` row with previous values

### 4b — `EditInteractionSheet.tsx` (new component, replaces `EditInteractionDialog.tsx`)
- Bottom sheet (Drawer) instead of Dialog
- Title: "Edit interaction"
- Interaction fields: connect type chips, date picker, note textarea
- Divider labeled "Follow-up"
- Follow-up fields: type chips, due date picker
- Save button. No destructive actions on sheet.
- On save: updates interaction row AND if follow-up fields changed, updates `follow_ups` row + writes `follow_up_edits`

Delete `EditInteractionDialog.tsx` after replacement.

---

## Phase 5 — Task record screen redesign (Section 5)

**`src/pages/FollowupTask.tsx`** — complete rewrite.

Route changes: `/followup/:id` now refers to a `follow_ups.id` instead of `interactions.id`.

**Read state layout:**
- Nav: "← Back" left, ··· menu right (Edit, Delete)
- Follow-up card: circle check (marks complete), contact name/company, footer strip with type badge + due status
- Last connect card: "LAST CONNECT" label + connect type pill, note body (from linked interaction)
- Follow-up edit history: collapsible, only renders if edits exist, newest first

**Edit state layout (triggered by ··· → Edit):**
- Nav swaps to "Editing" + "Save" pill
- Follow-up card expands with inline type chips + date picker + "Remove follow-up" red button
- Last connect card: note becomes editable textarea + "Delete interaction" red button with confirmation
- Save writes all changes; follow-up edits tracked

**New: Interaction detail screen** — when tapping an interaction history item on contact record, opens a similar detail screen but interaction-first. This will be a new route `/interaction/:id` with the same card system.

### Route additions in `App.tsx`:
- `/interaction/:id` → new `InteractionDetail.tsx` page

---

## Phase 6 — Update `Today.tsx` and `FollowupCard.tsx`

`FollowupCard` currently receives interaction data. It needs to receive follow-up data instead:
- `followUpId` instead of `interactionId`
- `followUpType` instead of `interactionType`
- `dueDate` instead of `followUpDate`
- Still needs contact info and last interaction info for the "Last connect" section

The Today screen query changes from querying `interactions` to querying `follow_ups` with a join to `contacts` and optionally to `interactions` for the last-connect display.

---

## Summary of new/modified files

| Action | File |
|--------|------|
| **New** | `src/components/EditFollowupSheet.tsx` |
| **New** | `src/components/EditInteractionSheet.tsx` |
| **New** | `src/pages/InteractionDetail.tsx` |
| **Rewrite** | `src/pages/FollowupTask.tsx` |
| **Major edit** | `src/pages/Today.tsx` |
| **Major edit** | `src/pages/ContactHistory.tsx` |
| **Major edit** | `src/components/FollowupCard.tsx` |
| **Major edit** | `src/components/ContactFollowupCard.tsx` |
| **Major edit** | `src/components/CompleteFollowupSheet.tsx` |
| **Major edit** | `src/components/RescheduleSheet.tsx` |
| **Major edit** | `src/pages/LogInteraction.tsx` |
| **Major edit** | `src/pages/Upcoming.tsx` |
| **Edit** | `src/App.tsx` (add `/interaction/:id` route) |
| **Edit** | `src/types/index.ts` (add FollowUp, FollowUpEdit types) |
| **Delete** | `src/components/EditInteractionDialog.tsx` |
| **Migration** | Create `follow_ups` and `follow_up_edits` tables, migrate data |

This is a substantial architectural change. I recommend implementing it in the order listed (database first, then queries, then UI) to minimize intermediate breakage.

