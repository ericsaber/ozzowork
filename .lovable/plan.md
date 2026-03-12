

## Plan: Redesign Contact Detail Page + Global "Meeting" Label Fix + Stepper Fix

### 1. Global Label Fix: "Meet" → "Meeting"

Update `typeLabels` map in **all files** that display follow-up type labels. Change `meet: "Meet"` to `meet: "Meeting"` everywhere except `pastVerb` maps (which stay "Met").

**Files to update:**
- `src/components/ContactFollowupCard.tsx` — `typeLabels`
- `src/components/RescheduleSheet.tsx` — `typeOptions` label
- `src/components/LogStep1.tsx` — type option label
- `src/components/LogStep2.tsx` — type option label
- `src/components/InteractionItem.tsx` — `typeLabels`
- `src/components/FollowupCard.tsx` — no typeLabels map here, skip
- `src/pages/ContactHistory.tsx` — `typeLabels`
- `src/pages/FollowupTask.tsx` — `typeLabels`
- `src/components/EditInteractionDialog.tsx` — type option label

### 2. Redesign `ContactFollowupCard.tsx` — Two-Zone Card Layout

Complete rewrite to match the screenshot design:

**Top zone** (white bg, padding 11px 12px):
- Left: 26px checkmark circle (1.5px border `#e8e4de`, on hover border turns `#4a9e4a`, bg `#eef7ee`, checkmark visible in green). Tapping triggers `onLogIt`.
- Center: date text (14px weight 500 ink). Overdue shows "Due [date]" on first line, "10 days ago" on second line in 10px muted.
- Top-right: bare ⋯ dots (#aaa, hover #666) → dropdown with Edit/Delete.

**Bottom strip** (1px divider top, padding 8px 12px):
- Left: colored pill — green (`#eef7ee` bg, `#3a7e3a` text) for upcoming, red (`#fdf2f0` bg, `#b83e22` text) for overdue. Shows type icon + "[Type] planned".
- Right: for overdue only, a "Reschedule" text button (no border, red `#d94f2e`, calendar icon + label).

Remove the old "Last connect" section, divider, and full-width action buttons.

### 3. Rewrite `ContactHistory.tsx` — Minor Adjustments

- Update `typeLabels` for the "Meeting" fix
- History section: add `pt-[10px]` to section label
- Follow-up indicator in history: change format to "Follow-up · [date] · [type]" for pending, "Follow-up · [date]" for resolved (with green check)
- Interaction history dots: remove `opacity-0 group-hover:opacity-100` — always visible on mobile
- Date format in history rows: change from "MMM d, yyyy" to "MMM d"

### 4. Fix `StepIndicator.tsx`

Rewrite to match the screenshot:
- Full-width flex container with step 1 flush left, step 2 flush right
- Circles: 28px. Active = white bg, 1.5px `#c8622a` border, accent number. Completed = `#c8622a` filled bg, white checkmark. Idle = `#f0ede8` bg, 1.5px `#e0dbd3` border, muted number.
- Connecting line: 1px height, `#e8e4de` color (completed state: `#c8622a`), connects between circles at vertical midpoint
- Labels below circles with 4px gap: DM Sans 11px weight 500. Active = `#18181a`. Idle = `#888`.
- Step 1 label left-aligned under step 1 circle. Step 2 label right-aligned under step 2 circle.

### Files Summary

| Action | File |
|--------|------|
| Rewrite | `src/components/ContactFollowupCard.tsx` |
| Rewrite | `src/components/StepIndicator.tsx` |
| Edit | `src/pages/ContactHistory.tsx` (typeLabels + history tweaks) |
| Edit | `src/components/RescheduleSheet.tsx` (Meet → Meeting) |
| Edit | `src/components/LogStep1.tsx` (Meet → Meeting) |
| Edit | `src/components/LogStep2.tsx` (Meet → Meeting) |
| Edit | `src/components/InteractionItem.tsx` (Meet → Meeting) |
| Edit | `src/pages/FollowupTask.tsx` (Meet → Meeting) |
| Edit | `src/components/EditInteractionDialog.tsx` (Meet → Meeting) |

No database changes needed.

