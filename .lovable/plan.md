

## Step 2 & Task Record Fixes (Round 2) — 6 Fixes

### Fix 1: "Planned planned" duplicate text
**ContactFollowupCard.tsx** line 104: `{plannedType ? (typeLabels[plannedType] || plannedType) : "Planned"} planned` produces "Planned planned" when null. Change to:
```
{plannedType ? `${typeLabels[plannedType] || plannedType} planned` : "Planned"}
```

### Fix 2: Pluralization — "In 1 days"
**InteractionDetail.tsx** `getDaysLabel()` (lines 119-124):
- Line 120: `${days} days overdue` → `${days} day${days !== 1 ? "s" : ""} overdue`
- Line 124: `In ${days} days` → `In ${days} day${days !== 1 ? "s" : ""}`

### Fix 3: Edit screen toggle state for tails-only
**EditTaskRecord.tsx** line 67: `setFollowUpOn(!!task.planned_follow_up_type)` misses records with only a date. Change to:
```js
setFollowUpOn(!!task.planned_follow_up_type || !!task.planned_follow_up_date);
```

### Fix 4: Tails-only task record — show both halves
**InteractionDetail.tsx** lines 174-215: Remove the `{!isTailsOnly && (...)}` conditional. Always render the "What happened" section. The existing dashed "Log an interaction" button (line 201) already handles the empty state when `!hasInteraction`. For tails-only, it shows the section header + the dashed button — intentionally minimal, not broken.

Line 220: Revert header to always say "What's next" (remove the `isTailsOnly ? "Follow-up scheduled" :` ternary).

### Fix 5: Remove "Want to add one?" link from nudge
**LogStep2.tsx** lines 87-98: Replace with passive-only text:
```tsx
<p className="text-[14px]" style={{ color: "#7a746c", fontFamily: "var(--font-body)" }}>
  No interaction logged.
</p>
```
Remove the `onBack` conditional and button element.

### Fix 6: Heads-only task record — "No follow-up" nudge
**InteractionDetail.tsx** lines 245-249: Replace the current dashed "Add a follow-up" button in the `!hasFollowUp` branch of the "What's next" section with a passive nudge + optional link:

```tsx
<div className="rounded-[10px] py-[10px] px-[14px]" style={{ background: "#fdf5f0", border: "0.5px solid rgba(200,98,42,0.2)" }}>
  <p className="text-[13px]" style={{ color: "#7a746c", fontFamily: "var(--font-body)" }}>
    No follow-up scheduled.{" "}
    <button onClick={() => setScheduleOpen(true)} className="underline font-medium" style={{ color: "#c8622a" }}>
      Add one?
    </button>
  </p>
</div>
```

Uses existing `setScheduleOpen(true)` which already opens `ScheduleFollowupSheet` (line 268-269). Styling matches the tails-only nudge in LogStep2.

### Files changed (4)
1. `src/components/ContactFollowupCard.tsx` — fix pill text duplication
2. `src/pages/InteractionDetail.tsx` — pluralization, show both halves, heads-only nudge
3. `src/pages/EditTaskRecord.tsx` — fix followUpOn initial state
4. `src/components/LogStep2.tsx` — passive nudge text only

