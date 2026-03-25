

## Reschedule Display Cleanup

Three targeted changes to consolidate reschedule context into history thread lines and remove it from follow-up cards.

### Changes

**1. `src/components/ContactFollowupCard.tsx`**
- Remove `rescheduledFrom` from the props interface and destructuring
- Remove the `{rescheduledFrom && ...}` JSX paragraph block
- Remove `parseISO` from imports if no longer used (keep `format` for `dateLabel`)

**2. `src/pages/ContactHistory.tsx` — Card renders**
- Remove `rescheduledFrom={rescheduleMap[r.id]?.previous_due_date ?? null}` from both `upcomingFollowups.map` and `overdueFollowups.map` `<ContactFollowupCard>` renders

**3. `src/pages/ContactHistory.tsx` — Thread line & annotation**
- Remove the separate `{rescheduleMap[record.id] && ...}` annotation block from the normal record render
- Update `getThreadLine` signature to accept `rescheduleInfo?: any` as second parameter
- Add reschedule-aware logic before the default active return: if `rescheduleInfo` exists, format as `→ Follow-up planned for [date] · Rescheduled from [previousDate]`
- Update all `getThreadLine(record)` call sites to `getThreadLine(record, rescheduleMap[record.id])`

### Not touched
- Ghost row rendering, rescheduleMap query/build logic, all console.log statements, all other files

