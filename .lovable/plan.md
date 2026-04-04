

## Upcoming Screen Redesign + FollowupCard Chevron Fix

Two files modified: `FollowupCard.tsx` and `Upcoming.tsx`.

### 1. `FollowupCard.tsx` — Conditional chevron + click behavior

**Chevron** (around line 145): Wrap `ChevronDown` in a `hasLastInteraction` check so it only renders when there's prior interaction data to expand. If no last interaction, render nothing.

**onClick** (line 101): Update to navigate to contact record when upcoming card has no last interaction (nothing to expand), otherwise toggle expand as before.

### 2. `Upcoming.tsx` — Full rewrite using FollowupCard

**New imports**: `useState`, `useMutation`, `useQueryClient` from tanstack, `FollowupCard`, `CompleteFollowupSheet`, `EditFollowupSheet`, `AlertDialog` components, `addDays` from date-fns.

**New state**: `completeTarget`, `editTarget`, `cancelTarget`, `showCancelDialog`, `openMenuId`.

**New cancel mutation**: Updates follow-up status to `cancelled`, sets `completed_at`, invalidates relevant query keys (`follow-ups-upcoming`, `follow-ups-today`, `follow-ups`).

**New interactions query**: Fetches last published interaction per contact to pass as `lastInteraction` prop to each FollowupCard.

**Replace item list**: Swap plain button list with `FollowupCard` components using `variant="upcoming"`, passing all required props: `taskRecordId`, `contactId`, `name`, `company`, `dueDate`, `plannedType`, `reminderNote`, `lastInteraction`, `menuOpen`, `onMenuOpenChange`, `onComplete`, `onEdit`, `onCancel`.

**Add bottom sheets/dialogs**: `CompleteFollowupSheet`, `EditFollowupSheet`, and the three-button cancel `AlertDialog` (Cancel and log / Yes cancel / Don't cancel) — same pattern as Today.tsx.

Keep existing query, console.logs, back button, heading, loading skeleton, and empty state unchanged.

### Technical notes
- The existing deduplication logic (one card per contact) stays in the main query
- `lastInteractionByContact` reduce pattern matches Today.tsx implementation
- No other files touched

