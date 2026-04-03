

# Today Card Redesign

## Overview
Full rewrite of `FollowupCard.tsx` and update `Today.tsx` to pass the new `reminderNote` prop and support the new `"upcoming"` variant.

## Changes

### 1. FollowupCard.tsx — Full Rewrite
- **New prop interface**: Add `reminderNote: string | null`, expand `variant` to `"overdue" | "today" | "upcoming"`; remove `isCompleting`
- **State**: Add `expanded` toggle for upcoming cards (collapsed by default; today/overdue always show full content)
- **Tokens**: Derive color palette per variant (green for today, sienna for upcoming, red for overdue) as specified in the design tokens
- **Layout** — three vertical sections:
  1. **Top row**: Name (15px/600/#383838) + company (11px/400/#777) + chevron (upcoming) or vertical dots menu (today/overdue)
  2. **Action subframe**: Colored background with icon + label + "Done" pill button; optional reminder note row below with dashed border
  3. **Previously section**: Gray background (#f7f5f2) with last interaction verb/date and 2-line clamped note; shown when data exists and card is not collapsed
- **Imports**: Add `ChevronDown`, `CornerDownRight`, `CornerUpRight`; remove `Check`, `ClipboardList`; keep `useNavigate`
- **Click behavior**: Upcoming cards toggle expand/collapse; today/overdue navigate to contact

### 2. Today.tsx — Minimal Updates
- Update `renderCard` signature to accept `"overdue" | "today" | "upcoming"` variant
- Pass `reminderNote={item.reminder_note || null}` to `FollowupCard`
- Pass `company={item.contacts?.company ?? null}` (already close, ensure `?? null`)
- No other changes; all console.logs preserved

## Technical Notes
- Card uses inline styles per the spec (no Tailwind for the card internals)
- `useState` import added to FollowupCard for `expanded` state
- The "Coming Up" section in Today.tsx remains unchanged (it's a summary link, not individual cards)

