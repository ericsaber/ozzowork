

## Quick Visual Fixes — Today Screen

Four targeted style tweaks, no functionality changes.

### 1. FollowupCard — Pill font size revert
Current pills use `text-[10px]`. Revert to `text-[12px] font-medium` to match the reference screenshot showing larger, more readable badge text.

### 2. FollowupCard — Remove colored left borders, fix check hover
Remove the `border-l-[3px] border-l-[hsl(...)]` classes entirely from the card container. Change the check circle hover color from `hover:border-primary hover:bg-primary/10` (burnt sienna) to green `hover:border-[hsl(142,60%,40%)] hover:bg-[hsl(142,60%,40%)]/10`, and the check icon hover from `group-hover:text-primary` to `group-hover:text-[hsl(142,60%,40%)]`. Same for the completing state.

### 3. FollowupCard — Flush-right pills
Change the name+badge row from `flex items-center gap-2` to `flex items-center justify-between gap-2` so the pill always aligns to the right edge, consistent with the "See all" pill on the Coming Up strip.

### 4. Today.tsx — Coming Up strip spacing
The Coming Up strip currently has `mt-6`. Change to `mt-6 mb-2` or wrap sections with consistent spacing. The Overdue section below already has `mt-8` which should be enough, but adding a small bottom margin on the strip ensures visual separation. Alternatively, just ensure the strip has `mt-6` and the Overdue label keeps `mt-8`.

### Files

| File | Changes |
|------|---------|
| `src/components/FollowupCard.tsx` | Revert pill to `text-[12px]`, remove left border, green hover on check, justify-between on name row |
| `src/pages/Today.tsx` | No changes needed (spacing already looks correct with mt-6/mt-8) |

