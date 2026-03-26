

## Fix: Reorder follow_up_action check before relatedStatus in getThreadLine

### Problem
In the `related_task_record_id` branch (lines 159-219), the `cancelled` check (line 179) and `completed` check (line 188) fire before the `follow_up_action` check (line 205). When the related coin gets completed, standalone logs with `follow_up_action = 'kept'` or `'rescheduled'` incorrectly show completion text.

### Change — `src/pages/ContactHistory.tsx` (lines 159-219)

Move the `follow_up_action` check to immediately after finding `relatedRecord` and logging, **before** any `relatedRecord.status` checks:

```typescript
if (record.related_task_record_id) {
  const relatedRecord = ...find...;
  if (relatedRecord) {
    // existing console.log for related record found (keep)
    
    // NEW: check follow_up_action FIRST
    console.log('[getThreadLine] standalone log action:', { id: record.id, follow_up_action: record.follow_up_action, planned_follow_up_date: record.planned_follow_up_date });
    if (record.follow_up_action === 'kept') {
      const displayDateStr = record.planned_follow_up_date
        ? format(parseISO(record.planned_follow_up_date), 'MMM d')
        : relatedRecord.planned_follow_up_date ? format(parseISO(relatedRecord.planned_follow_up_date), 'MMM d') : '';
      return { text: `→ Follow-up kept for ${displayDateStr}`, color: '#3d7a4a' };
    }
    if (record.follow_up_action === 'rescheduled') {
      const displayDateStr = record.planned_follow_up_date
        ? format(parseISO(record.planned_follow_up_date), 'MMM d')
        : relatedRecord.planned_follow_up_date ? format(parseISO(relatedRecord.planned_follow_up_date), 'MMM d') : '';
      return { text: `→ Follow-up rescheduled to ${displayDateStr}`, color: '#3d7a4a' };
    }

    // THEN: existing cancelled/completed/fallback checks (unchanged)
    if (relatedRecord.status === "cancelled") { ... }
    if (relatedRecord.status === "completed") { ... }
    // Remove the old follow_up_action block (lines 204-218)
  }
}
```

Remove the old `if (relatedRecord.status !== 'completed' && relatedRecord.status !== 'cancelled')` block (lines 204-218) since it's now handled above. All existing console.logs remain.

