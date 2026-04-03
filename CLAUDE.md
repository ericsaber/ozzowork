# CLAUDE.md — ozzo

This file encodes the conventions, data model, design system, and standing
rules for ozzo. Read this before generating any code.

---

## What ozzo is

ozzo is a mobile-first relationship management app for anyone who builds
relationships for a living — sales professionals, recruiters, freelancers,
consultants, financial advisors. Beachhead market is real estate agents,
but UI copy and design must never feel narrowly real-estate-specific.

**Primary tagline:** Follow Through
**Secondary taglines:** "The follow-up app for people who build relationships,
not pipelines." / "What Happened. What's Next." / "Log a call and set a
follow-up in under 30 seconds."

It is not a CRM. It is not a task manager. It is a lightweight, glanceable
tool that makes follow-up feel like accomplishment, not data entry.

**Stack:** Lovable + Supabase + React + TypeScript.
**Pricing:** $10/month, hard paywall after trial.

---

## Design system

### Fonts
- **Display/serif:** Crimson Pro
- **Body/UI:** Outfit

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary accent | `#c8622a` | Buttons, active states, brand moments |
| Background | `#f0ede8` | App background |
| Card background | `#faf8f5` | Cards, elevated surfaces |

### Icons
**Lucide** — always use Lucide. No other icon library.

### Accessibility
All color usage must meet **WCAG AA** contrast minimum. Color is never the
sole communicator — always pair with icon or label.

### Safe area
Root layout must include:
```css
padding-top: env(safe-area-inset-top);
```
This ensures content never starts behind the dynamic island or punch-hole
camera on any iPhone model.

---

## Data model

Three tables. No foreign keys between `interactions` and `follow_ups`.

### `interactions`
Standalone logs. One row per logged connection.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| contact_id | uuid | FK → contacts |
| user_id | uuid | FK → auth.users |
| connect_type | text | call/email/text/meet/video. Null = "Connected" |
| connect_date | timestamptz | Today or past only. Never future. |
| note | text | Optional |
| status | text | draft / published |
| created_at | timestamptz | |

### `follow_ups`
One active follow-up per contact at a time. On completion, status is set to
'completed' and completed_at is set. Interaction details are stored in a
separate `interactions` row — not written onto the follow_up row.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| contact_id | uuid | FK → contacts |
| user_id | uuid | FK → auth.users |
| planned_type | text | call/email/text/meet/video. Optional. |
| planned_date | date | Today or future only. Never past. |
| status | text | active / completed / cancelled |
| completed_at | timestamptz | Set on completion or cancellation |
| reminder_note | varchar(55) | Optional. Always fully visible. No truncation. |
| created_at | timestamptz | |

### `follow_up_edits`
One row per date change (reschedule). Type/reminder changes do NOT create
a row here.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| follow_up_id | uuid | FK → follow_ups |
| user_id | uuid | FK → auth.users |
| previous_type | text | |
| previous_due_date | date | |
| changed_at | timestamptz | |

### `contacts`
Schema unchanged. Client-side validation only:
- `first_name` varchar(50) — required
- `last_name` varchar(50) — required
- `company` varchar(100) — optional
- `phone` varchar(15) — optional, digits only, display formatted
- `email` varchar(254) — optional, RFC 5321 format


---

## RLS — non-negotiable

Every table must have Row Level Security enabled. All policies must scope
to `auth.uid() = user_id`. The Supabase service role key must never appear
in client-side code. Use the Lovable secrets manager for environment variables.

---

## Terminology

### Use these terms
| Term | Meaning |
|------|---------|
| interaction | A logged connection (call, text, email, meeting, video, or generic "Connected") |
| follow-up | A planned future touchpoint |
| log | The act of recording an interaction |
| What Happened | Step 1 of the log flow |
| What's Next | Step 2 of the log flow |
| active follow-up | A follow-up with status = 'active' |
| reminder note | The optional short note on a follow-up (reminder_note field) |

### Never use these terms in user-facing copy
| Term | Why |
|------|-----|
| coin | Internal architecture metaphor only |
| task | ozzo is not a task manager |
| pipeline | ozzo is the antithesis of pipeline thinking |
| record | Use "entry" or "log" instead |
| CRM | Never position ozzo as a CRM |

---

## Nomenclature — display rules

| Condition | Display text | Icon |
|-----------|-------------|------|
| interaction with connect_type = null | "Connected" | Rounded chat bubble |
| interaction with connect_type set | "Called" / "Texted" / "Met" / etc. | Type-specific icon |
| follow-up (active, or completed with no connect_type) | "Follow-up" | Rounded chat bubble (distinct from message icon) |
| follow-up completed with connect_type | "Called" / "Texted" / etc. | Type-specific icon |
| follow-up cancelled | "Follow-up cancelled" | X icon |
| follow_up_edits row | "Follow-up rescheduled to [date]" | Clock icon |

---

## Date rules — enforced everywhere, no exceptions

- `connect_date` (interactions): today or past. Disable future dates in all pickers.
- `planned_date` (follow_ups): today or future. Disable past dates in all pickers.

---

## Character limits

- `reminder_note`: 55 characters hard limit. Enforce at DB (varchar(55)) and
  UI (character counter). Always fully visible — no truncation, no ellipsis.
- Interaction note in history rows: 2 lines max (`-webkit-line-clamp: 2`),
  expand inline on tap.
- Today card last connect note: 2 lines max, no expand (glanceable only).

---

## FAB skip logic — do not break

The FAB opens a two-step log flow (Step 1: What Happened, Step 2: What's Next).

- User can complete Step 1 and skip Step 2 → interaction saved, no follow-up
- User can skip Step 1 and complete Step 2 → follow-up saved, no interaction
- User CANNOT skip both — if Step 1 was skipped, Step 2 cannot also be skipped
- If FAB tapped from a contact record: `contact_id` must be pre-filled into Step 1

---

## Follow-up type is always optional

`planned_type` is never required. Only `planned_date` is required when
creating or editing a follow-up. Never treat type as required anywhere
in the save flow.

---

## Cancel follow-up dialog

Three options, always in this order:
1. "Cancel and log what happened" → routes to log Step 1, cancels follow-up on save
2. "Yes, cancel" → immediate UPDATE status = cancelled, no log
3. "Don't cancel" → dismiss

---

## Reschedule count nudge

If `follow_up_edits` count for a follow-up ≥ 3: show "Rescheduled X times"
with Clock icon, color `#999`. Informational only — no judgment, no
moralizing copy, no suggestion.

---

## Full file inventory

### Pages
- `Auth.tsx`
- `ContactHistory.tsx`
- `Contacts.tsx`
- `FollowupTask.tsx`
- `LogInteraction.tsx`
- `NotFound.tsx`
- `Today.tsx`
- `Upcoming.tsx`

### Components
- `BottomNav.tsx`
- `CelebrationHeader.tsx`
- `CompleteFollowupSheet.tsx`
- `ContactCombobox.tsx`
- `ContactFollowupCard.tsx`
- `EditFollowupSheet.tsx`
- `EditInteractionSheet.tsx`
- `FollowupCard.tsx`
- `InteractionItem.tsx`
- `LogInteractionSheet.tsx` — primary log flow handler
- `LogStep1.tsx` — presentational only
- `LogStep2.tsx` — presentational only
- `NavLink.tsx`
- `OutstandingFollowupStep.tsx`
- `PasswordGate.tsx`
- `ScrollToTop.tsx`
- `StepIndicator.tsx`

---

## Standing implementation rules

1. **Leave all existing console.log statements in place.** Never remove them.
2. **Always run plan mode before implementing** multi-file changes.
3. **RLS is always highest-priority** — no table exists without it.
4. **No undo flows** — completed and deleted records are permanent.
5. **Lucide icons only** — no other icon library.
6. **WCAG AA contrast** on all color usage.
