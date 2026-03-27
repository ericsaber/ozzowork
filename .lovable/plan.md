

## InteractionDetail + ContactHistory — Round 4 Fixes

Three fixes across two files.

---

### 1. InteractionDetail — tails-only coins show What Happened if prior interactions exist

**File:** `src/pages/InteractionDetail.tsx`

**a)** Line 174 — remove `!isTailsOnly` from query enabled condition:
```
enabled: !!task?.contact_id && !!isActive
```

**b)** Line 232 — update `interactionData` to use `latestInteraction` for all active coins:
```typescript
const interactionData = isActive ? latestInteraction : task;
```

**c)** Line 290 — change What Happened guard from `{!isTailsOnly && (` to:
```
{((isActive && latestInteraction) || isHistorical) && (
```

**d)** Line 325 — change divider guard from `{isActive && !isTailsOnly && (` to:
```
{isActive && latestInteraction && (
```

**e)** Remove `isTailsOnly` variable (line 154) — no longer referenced.

### 2. ContactHistory — timeline row border wrappers

**File:** `src/pages/ContactHistory.tsx`

Wrap each timeline item inside a plain `<div>` that carries the `borderBottom` style, and remove `borderBottom` from the inner elements (buttons, styled divs) that have `rounded-lg` or other border-radius.

Specifically, for each of the five return blocks in the timeline map (lines 370, 395, 430, 464, 498):
- Wrap in `<div key={...} style={{ borderBottom: idx < filteredTimeline.length - 1 ? '1px solid #e8e4de' : 'none' }}>`
- Move the `key` prop to the wrapper
- Remove `borderBottom` from the inner element's style
- Inner element keeps all its existing styling (rounded-lg, opacity, etc.)

### 3. Featured card navigation — already correct

Line 319 already uses `activeFollowups[0]?.id || record.id`. No change needed.

---

### Files modified

| File | Changes |
|------|---------|
| `src/pages/InteractionDetail.tsx` | Fix 1 (query enabled, rendering guards, remove isTailsOnly) |
| `src/pages/ContactHistory.tsx` | Fix 2 (border wrapper divs) |

