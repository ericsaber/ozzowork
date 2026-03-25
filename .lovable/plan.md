

## Rescheduled From Annotation on Follow-up Card

Two files changed.

### 1. `src/components/ContactFollowupCard.tsx`
- Add `rescheduledFrom?: string | null` to props interface and destructure it
- Render `"Rescheduled from [date]"` paragraph (11px, `#c8622a`) after the `relativeTime` paragraph when `rescheduledFrom` is truthy

### 2. `src/pages/ContactHistory.tsx`
- Pass `rescheduledFrom={rescheduleMap[r.id]?.previous_due_date ?? null}` to `ContactFollowupCard` in both `upcomingFollowups.map` and `overdueFollowups.map`

No new imports needed in either file. All existing console.log statements preserved.

