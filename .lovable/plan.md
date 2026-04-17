

## Plan: Fix isDirty detection + close animation timing

**Files:** `src/components/LogInteractionSheet.tsx`, `src/components/FullscreenTakeover.tsx`

### Issue 1 — `isDirty` misses pre-Next input (LogInteractionSheet.tsx)

Current line: `const isDirty = !!draftId;`

Replace with:
```ts
const isDirty = !!draftId || note.trim().length > 0 || connectType !== "";
```

This is a single-line change. `handleOpen`, `clearAndClose`, the discard `AlertDialog`, and all other logic remain untouched. After this, typing a note or picking a connect type before tapping Next will correctly trigger the discard confirmation when the user attempts to close the sheet.

I'll verify in the file that `note` and `connectType` are the exact state variable names in scope at the `isDirty` declaration site (and adjust to the real names if they differ — e.g. `noteText`, `connect_type`) — but the shape of the change is the one-line OR above.

### Issue 2 — Close animation timing (FullscreenTakeover.tsx)

Two coordinated changes:

1. Sheet container transition — extend the transform duration so the close glide matches the open feel:
```ts
transition: "opacity 300ms ease, transform 420ms cubic-bezier(0.32, 0.72, 0, 1)",
```

2. Unmount timeout — bump from 400ms to 420ms so the sheet stays mounted through the full transform transition:
```ts
const t = setTimeout(() => setMounted(false), 420);
```

Backdrop transition stays at `opacity 200ms ease`. Close button fade timing (`200ms ease` with `250ms` appear delay) stays as-is. The `visualViewport` listener, double-`requestAnimationFrame` open trick, and `visibility: hidden` guard all stay as-is.

### Preserved
- All `console.log` statements
- All other state, handlers, mutations, props
- Discard dialog logic itself — only the `isDirty` predicate widens

### Checklist
- ✅ Only `LogInteractionSheet.tsx` and `FullscreenTakeover.tsx` touched
- ✅ `isDirty` change is exactly one line
- ✅ `setTimeout` bumped to 420ms to match the new 420ms transform transition
- ✅ No other behavior changes

