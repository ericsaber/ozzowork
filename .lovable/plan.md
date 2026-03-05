

## Spacing & Font Size Fixes — Today Screen

Three quick changes:

### 1. Coming Up strip — add top margin matching overdue gap
The "Coming Up" strip has `mt-6` but it's visually crashing into the cards above. Change to `mt-8` to match the same gap used before the Overdue label (`mt-8 mb-3`).

### 2. "Last Interaction" label — bump to 11px
Currently `text-[9px]`. The section labels (Due Today, Overdue) are `text-[11px]`. Update the "LAST INTERACTION" label in FollowupCard to `text-[11px]` so it matches as the minimum font size on the screen.

### 3. Match fonts to task page
The FollowupTask page uses `text-xs` (12px) for its uppercase labels and `text-sm` (14px) for values. The card's company text at `11px` and note at `12px` are close enough. The "LAST INTERACTION" label going from 9px→11px aligns it with the section labels. No other font changes needed.

### Files

| File | Change |
|------|--------|
| `src/components/FollowupCard.tsx` | Line 105: `text-[9px]` → `text-[11px]` |
| `src/pages/Today.tsx` | Line 155: `mt-6` → `mt-8` on Coming Up strip |

