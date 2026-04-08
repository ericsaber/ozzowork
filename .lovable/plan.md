

## Plan: Change featured card row alignment

**File:** `src/pages/ContactHistory.tsx`, line 520

**Change:** Replace `items-center` with `items-start` in the className string inside the `cn()` call.

```ts
// Before
editingInteractionId === record.id ? "p-0" : "flex gap-3 p-3 items-center"

// After
editingInteractionId === record.id ? "p-0" : "flex gap-3 p-3 items-start"
```

Single word change. No other modifications.

