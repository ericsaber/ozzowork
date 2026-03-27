

## ContactHistory + InteractionDetail — Round 3 Fixes

Six fixes across two files.

---

### 1. Follow-up event rows — only for non-active coins with history (ContactHistory.tsx, lines 100–121)

Replace the current `followUpEvents` construction logic with:

```typescript
(taskRecords || []).forEach((coin: any) => {
  if (!coin.planned_follow_up_date || coin.related_task_record_id) return;
  const edits = (coin.follow_up_edits || []).sort(...);

  // Only emit scheduled/rescheduled for non-active coins
  if (coin.status !== 'active') {
    if (edits.length > 0 || coin.status === 'cancelled') {
      followUpEvents.push({
        type: 'scheduled', date: coin.created_at,
        targetDate: edits.length > 0 ? edits[0].previous_due_date : coin.planned_follow_up_date
      });
    }
    edits.forEach((edit, i) => {
      const newDate = edits[i + 1]?.previous_due_date ?? coin.planned_follow_up_date;
      followUpEvents.push({ type: 'rescheduled', date: edit.changed_at, newDate });
    });
  }

  if (coin.status === 'cancelled') {
    followUpEvents.push({ type: 'cancelled', date: coin.completed_at || coin.updated_at });
  }
});
```

This eliminates duplicate "Follow-up scheduled" rows for the active coin.

### 2. History row borders — use `#e8e4de` color (ContactHistory.tsx, lines 370, 395, 432, 464, 498)

The current `borderBottom` uses `var(--border)`. Change all five occurrences to `'1px solid #e8e4de'`. No `divide-y` class is present — this is just a color update for consistent hairline dividers.

### 3. Next Follow-Up card background (ContactHistory.tsx, lines 264–278)

The `ContactFollowupCard` wrapper `<div className="space-y-3">` doesn't set background. The card component itself needs `bg-white` or `background: 'white'`. Check `ContactFollowupCard.tsx` — if its root element doesn't have explicit white background, add `style={{ background: 'white' }}` on the wrapper div at line 264, or pass it through. Simpler: wrap each card in a div with `style={{ background: 'white', borderRadius: '14px' }}`.

### 4. Event row text color — all labels use `#71717a` (ContactHistory.tsx, line 375)

Change `color: isCancelled ? iconColor : '#999'` to `color: '#71717a'` for all event types. The cancelled row's X icon keeps `#a32d2d` but the label text becomes `#71717a` like the others.

### 5. EditTaskRecord — already correct

The `useEffect` at line 62–74 already computes `hist` locally and sets `followUpOn(false)` for historical records. The `{!isHistorical && (...)}` guard at line 209 correctly wraps the What's Next card. No changes needed.

### 6. Vertical centering — already correct

Line 498 already uses `${record.note && record.note.trim() ? 'items-start' : 'items-center'}`. No changes needed.

---

### Files modified

| File | Changes |
|------|---------|
| `src/pages/ContactHistory.tsx` | Fixes 1, 2, 3, 4 |
| `src/components/ContactFollowupCard.tsx` | Fix 3 (verify bg) |

