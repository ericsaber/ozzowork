

## Fix: Follow-up card navigation + Edit history redesign

### Issue 1: Follow-up cards on contact record don't navigate to task screen

The `ContactFollowupCard` component has no `onClick` handler to navigate to `/followup/:id`. The card body needs to be tappable to open the task record screen.

**Change in `src/components/ContactFollowupCard.tsx`:**
- Add `onTap` prop (or handle via wrapping the card body in a clickable area)
- Wire it to `navigate(`/followup/${followUp.id}`)` from the parent

**Change in `src/pages/ContactHistory.tsx`:**
- Pass an `onTap` handler to each `ContactFollowupCard` that navigates to `/followup/${fu.id}`

### Issue 2: Edit history layout doesn't match screenshot

The screenshot shows a two-line layout per row with icons in pills and specific labeling. Current implementation is a single-line flex with no icons and generic labels.

**Redesign the edit history section in `src/pages/FollowupTask.tsx` (lines 474-516):**

Each row becomes a two-line layout:
- Left: type pill **with icon** (e.g. phone icon + "Call")
- Right line 1: date + label context ("Mar 12 · current", "~~Mar 13~~ · original")  
- Right line 2: timestamp context

Label logic for the right-side text:
- **Current row** (the active follow-up): `"Mar 12 · current"` on line 1, `"Changed Mar 11 at 8:22am"` on line 2
- **Original row** (the oldest/last edit entry): date is struck through, `"~~Mar 13~~ · original"` on line 1, `"Set when logged Mar 10"` on line 2
- **Intermediate rows** (any edits between original and current): date is struck through, `"~~Mar 12~~ · revised"` on line 1, `"Changed Mar 11 at 3:15pm"` on line 2

The current row's pill uses burnt sienna styling with icon. Previous rows use muted styling with icon and `line-through` on the type text.

The "current" row uses `followUp.created_at` or the most recent edit's `changed_at` for the "Changed" timestamp. The "original" row (last in the list) uses the interaction date or follow-up `created_at` for "Set when logged".

**Specific changes:**
1. Add `TypeIcon` to each pill (current row and history rows)
2. Change single-line layout to two-line per row
3. Current row: line 1 = `"{date} · current"`, line 2 = `"Changed {edit.changed_at formatted}"`
4. Last history entry (original): line 1 = `"~~{date}~~ · original"` (struck through date), line 2 = `"Set when logged {followUp.created_at or interaction.date}"`
5. Middle entries: line 1 = `"~~{date}~~ · revised"`, line 2 = `"Changed {edit.changed_at}"`

### Files to modify

| File | Change |
|------|--------|
| `src/components/ContactFollowupCard.tsx` | Add `onTap` prop, make card body clickable |
| `src/pages/ContactHistory.tsx` | Pass `onTap={() => navigate(`/followup/${fu.id}`)}` to each card |
| `src/pages/FollowupTask.tsx` | Redesign edit history section with icons, two-line rows, original/revised/current labels |

