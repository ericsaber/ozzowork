

## Add "today" token set to ContactFollowupCard.tsx

### Change

**`src/components/ContactFollowupCard.tsx`**

1. Add a `isTodayDate` variable after `followUpDate` is computed (around line 120), using the already-imported `isToday`:
   ```ts
   const isTodayDate = isToday(followUpDate);
   ```

2. Replace the two-branch ternary for `tokens` (around lines 68-81) with a three-branch ternary:
   ```ts
   const tokens = isOverdue
     ? { /* existing overdue tokens unchanged */ }
     : isTodayDate
     ? {
         subframeBg: 'rgba(231,242,235,0.5)',
         color: '#2e7a4d',
         doneBorder: '1px solid rgba(46,122,77,0.35)',
         reminderBg: 'rgba(231,242,235,0.5)',
         reminderBorderColor: 'rgba(46,122,77,0.35)',
       }
     : { /* existing upcoming tokens unchanged */ };
   ```

   Since `tokens` references `isOverdue` which is computed early, and `isTodayDate` needs `followUpDate` which is computed later (~line 119), the `tokens` block will need to move below `followUpDate` or `isTodayDate` will need to be computed earlier using `parseISO(taskRecord.planned_date)` inline. The simplest approach: compute `isTodayDate` right after `isOverdue` and before `tokens`, using `isToday(parseISO(taskRecord.planned_date))`.

No other changes.

