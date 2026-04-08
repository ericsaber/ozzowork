

## Plan: Add debug log in renderComingUp

**File:** `src/pages/Today.tsx`, line 182

**Change:** Insert `console.log` immediately before the `const sorted` line.

```tsx
// Before (line 182)
    const sorted = [...comingUp].sort((a, b) => a.planned_date.localeCompare(b.planned_date));

// After
    console.log('[Today] comingUp raw:', comingUp.map(i => ({ name: i.contacts?.first_name, date: i.planned_date })));
    const sorted = [...comingUp].sort((a, b) => a.planned_date.localeCompare(b.planned_date));
```

Single line addition. No other changes.

