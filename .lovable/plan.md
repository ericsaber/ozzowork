

## Plan: Tomorrow Label in Outstanding Follow-up Card

**File:** `src/components/OutstandingFollowupStep.tsx`

### Change

Add an `isTomorrow` check to the `dueDateStr` computation to display "Tomorrow" when the follow-up is due tomorrow:

```tsx
// After line 74 (after isOverdue computation):
const isTomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd") === existingFollowup.planned_date;

// Replace lines 111-115 (dueDateStr computation):
const dueDateStr = isToday
  ? "Today"
  : isOverdue
  ? `Was due ${format(fuDate, "MMM d")}`
  : isTomorrow
  ? "Tomorrow"
  : format(fuDate, "MMM d");
```

### Preserved
- All `console.log` statements
- `addDays` and `format` are already imported from `date-fns`
- All other component logic unchanged

### Checklist
- ✅ Only `OutstandingFollowupStep.tsx` touched
- ✅ `isTomorrow` computed by comparing tomorrow's date string to `existingFollowup.planned_date`
- ✅ `dueDateStr` returns "Tomorrow" when `isTomorrow` is true
- ✅ No other changes
- ✅ All `console.log` preserved

