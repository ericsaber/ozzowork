

## Update Coming Up Section on Today Screen

### Changes to `src/pages/Today.tsx`

**1. Expand query window to 14 days**
- Replace `weekEnd` calculation with `format(addDays(new Date(), 14), "yyyy-MM-dd")` (import `addDays` from date-fns)
- The `.lte("planned_follow_up_date", weekEnd)` filter already covers this — just change the variable value
- The `comingUp` bucket already filters `d > today`, so tomorrow through day 14 is captured correctly

**2. Always render Coming Up section**
- Move the Coming Up block out of the `comingUp.length > 0 &&` conditional
- Also update the `isEmpty` check: remove `comingUp.length === 0` from the condition so the "All clear" empty state only shows when overdue and dueToday are both empty (Coming Up section always renders regardless)

**3. Update filled-state copy**
- Change `"{comingUp.length} follow-up{s} this week"` to `"{comingUp.length} follow-up{s}"` — drop "this week"

**4. Add empty state card**
- When `comingUp.length === 0`, render a non-clickable card (a `div` instead of `button`) with:
  - Calendar icon in muted gray rounded square
  - Primary: "No follow-ups in the next 2 weeks"
  - Secondary: "You're all caught up"
  - No "See all" pill, no navigation

**5. Minor structural adjustment**
- The Coming Up section currently lives inside the `else` branch that only renders when `!isEmpty`. Since Coming Up should always show, it needs to render outside that conditional — after the overdue/dueToday sections but always visible, even if overdue and dueToday are empty.

### File: `src/pages/Today.tsx` — summary of edits
- Import `addDays` from date-fns
- Replace `endOfWeek` with `addDays(new Date(), 14)` for the query upper bound
- Restructure the render: always show Coming Up after the overdue/dueToday block
- Update `isEmpty` to only consider `overdue.length === 0 && dueToday.length === 0`
- Split Coming Up rendering into filled (existing button with updated copy) and empty (static div) states

