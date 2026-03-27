

## ContactHistory + EditTaskRecord — Round 2 Display Fixes

Five targeted fixes across two files. No logic changes beyond what's described.

---

### 1. Featured card navigates to active follow-up coin (ContactHistory.tsx, line 318)

Change `navigate(\`/interaction/${record.id}\`)` to `navigate(\`/interaction/${activeFollowups[0]?.id || record.id}\`)`. The `activeFollowups` array is already computed at line 77.

### 2. EditTaskRecord — force followUpOn false for historical (EditTaskRecord.tsx, line 69)

In the `useEffect` initializer, wrap the `setFollowUpOn` call:

```typescript
if (isHistorical) {
  setFollowUpOn(false);
} else {
  setFollowUpOn(!!task.planned_follow_up_type || !!task.planned_follow_up_date);
}
```

Note: `isHistorical` depends on `task` which is available inside this effect. Need to compute it locally: `const hist = task.status === 'completed' || task.status === 'cancelled';`

The `{!isHistorical && (...)}` guard on line 208 is already correct — this fix ensures the toggle state matches.

### 3. History row borders — replace divide-y with inline borderBottom (ContactHistory.tsx, line 344)

Remove `divide-y divide-border` from the parent `<div>`. On each timeline item's outermost element (event rows at line 370, cleared at 395, cancelled tails-only at 431, completed tails-only at 464, regular interaction at 498), add inline style `borderBottom: '1px solid var(--border)'` — except for the last item. Pass the filtered timeline length and use `idx < filteredTimeline.length - 1`.

### 4. Event row text color — scheduled/rescheduled use #999 (ContactHistory.tsx, line 375)

The event row `<span>` already uses `color: iconColor` where `iconColor = '#9e9e99'`. Change to `color: '#999'` for scheduled and rescheduled events. Cancelled keeps its red-tinted opacity treatment unchanged.

### 5. Vertical centering for interaction rows without notes (ContactHistory.tsx, line 498)

On the regular interaction row `<button>`, change from unconditional class to conditional alignment:

```
className={`flex gap-3 py-3 group w-full text-left hover:bg-secondary/50 rounded-lg px-2 -mx-2 active:scale-[0.98] transition-all cursor-pointer ${record.note && record.note.trim() ? 'items-start' : 'items-center'}`}
```

Same pattern for cancelled tails-only rows (line 431) and cleared rows (line 395) if they have similar alignment issues.

---

### Files modified

| File | Changes |
|------|---------|
| `src/pages/ContactHistory.tsx` | Fixes 1, 3, 4, 5 |
| `src/pages/EditTaskRecord.tsx` | Fix 2 |

