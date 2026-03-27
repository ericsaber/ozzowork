

## Remove `related_task_record_id` exclusion from latest interaction queries

Two one-line removals.

### Fix 1 — `src/pages/InteractionDetail.tsx`
Remove `.is("related_task_record_id", null)` from the `latestInteraction` query (around line 163).

### Fix 2 — `src/pages/ContactHistory.tsx`
Remove `!item.record.related_task_record_id` from the `featuredItem` find condition (around line 133).

No other changes. All console.log statements preserved.

