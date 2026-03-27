

## Fix: Exclude standalone logs from featured card

**File:** `src/pages/ContactHistory.tsx`, line 133

Add `!item.record.related_task_record_id` to the featured item filter:

```typescript
const featuredItem = timelineItems.find(
  (item) => item.kind === 'interaction' && (item.record.connect_type || (item.record.note && item.record.note.trim())) && !item.record.related_task_record_id
);
```

Single line change. No other files affected.

