

## Plan: Fix Note Card Height — Complete Flex Chain

**Files:** `src/components/LogInteractionSheet.tsx`, `src/components/LogStep1.tsx`

### Root cause
`min-height: 100%` on LogStep1 resolves against an ancestor (the `paddingTop: 20` wrapper) that has no defined height. The flex chain from the scroll container down to the note card is broken — intermediate divs shrink to content. Fix: make every ancestor a flex column with `flex: 1` so heights propagate.

### Changes

**1. LogInteractionSheet.tsx — scrollable content div**
Add `display: flex; flexDirection: column` to the existing scrollable container (`flex: 1, minHeight: 0, overflowY: auto, padding: "0 20px"`).

**2. LogInteractionSheet.tsx — Step 1 padding wrapper**
The `<div style={{ paddingTop: 20 }}>` wrapping the quick-add form + `<LogStep1>` becomes:
```tsx
{ paddingTop: 20, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }
```

**3. LogStep1.tsx — outer wrapper**
Replace `minHeight: "100%"` with `flex: 1`, add `minHeight: 0`. Keep `display: flex, flexDirection: column, gap: 16, paddingTop: 0`.

**4. LogStep1.tsx — note card**
Unchanged: keep `flex: 1, display: flex, flexDirection: column, minHeight: 200`.

**5. LogStep1.tsx — textarea**
Unchanged: keep `flex: 1, minHeight: 80`.

### Preserved
- All `console.log` statements
- All voice recording logic, refs, state, transcribeAudio
- All other styling (backgrounds, borders, radii, padding, gap)
- Contact picker, bottom action area, nudge, Next button, skip link
- Quick-add form inside the Step 1 wrapper

### Checklist
- ✅ Only `LogInteractionSheet.tsx` and `LogStep1.tsx` touched
- ✅ Scrollable content div: `display: flex; flexDirection: column` added
- ✅ Step 1 padding wrapper: `flex: 1; display: flex; flexDirection: column; minHeight: 0`
- ✅ LogStep1 outer wrapper: `flex: 1` (not `minHeight: 100%`)
- ✅ LogStep1 outer wrapper: `minHeight: 0`
- ✅ Note card retains `flex: 1; display: flex; flexDirection: column; minHeight: 200`
- ✅ Textarea retains `flex: 1; minHeight: 80`
- ✅ All `console.log` preserved

