

## Plan: Fix animation + discard dialog wiring

**Files:** `src/components/FullscreenTakeover.tsx`, `src/components/LogInteractionSheet.tsx`

### Issue 1 — Animation fix (FullscreenTakeover.tsx)

Add a `visible` state separate from `mounted`. The current code drives transitions off the `open` prop, which changes in the same paint as the initial mount — the browser never sees the `translateY(100%)` start state.

Update the open-effect:
```tsx
const [visible, setVisible] = useState(false);

useEffect(() => {
  if (open) {
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  } else {
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 400);
    return () => clearTimeout(t);
  }
}, [open]);
```

Replace every `open ? ... : ...` style on the backdrop, sheet, and close button with `visible ? ... : ...`:
- Backdrop: `opacity`, `pointerEvents`
- Sheet: `opacity`, `transform`, `visibility`
- Close button: `opacity`, `transitionDelay`

The `visualViewport` listener and the `if (!mounted && !open) return null` guard stay as-is.

### Issue 2 — Discard dialog wiring (LogInteractionSheet.tsx)

**Trace results:**
1. ✅ `<FullscreenTakeover open={open} onOpenChange={handleOpen}>` — correct, `handleOpen` is passed (line 554), not raw `onOpenChange`.
2. ✅ Backdrop and × button in `FullscreenTakeover` both call the prop `onOpenChange(false)`, which routes to `handleOpen(false)`.
3. ✅ `handleOpen` (line 119) calls `setShowDiscardDialog(true)` when `isDirty` is true and returns early — and the `<AlertDialog open={showDiscardDialog}>` is rendered (line 662) with `z-[60]`.

**Root cause:** the wiring is correct, but the dialog is being dismissed instantly. The new `FullscreenTakeover` overlay is a fixed `<div>` that calls `onOpenChange(false)` on **any** click. When the AlertDialog mounts, Radix portals it to `document.body`. The backdrop click bubbles up — but more importantly, the AlertDialog's own overlay sits at `z-50` (shadcn default) while our sheet's backdrop is also `z-49` and our sheet body `z-50`. A tap on the AlertDialog's overlay can fall through to our backdrop click handler if the AlertDialog overlay portal mounts before our sheet in DOM order.

**Fix:** raise the `<AlertDialog>` portal stacking so it sits unambiguously above both the FullscreenTakeover backdrop and sheet body. Two parts:

1. The two existing `<AlertDialogContent className="z-[60]">` instances (discard + cancel-confirm) — already done.
2. Bump the FullscreenTakeover backdrop to be **non-interactive while a sheet-internal AlertDialog is open** is not feasible without prop drilling. Simpler: the actual cause of the dialog "not showing" is most likely that on mobile the same tap that closes the sheet via the backdrop synthesizes a second event that hits the alert dialog's overlay and dismisses it. To prevent this, in `FullscreenTakeover.tsx` change the backdrop click handler to fire on `onPointerDown` instead of `onClick`, and `stopPropagation` on the sheet container's pointer events so taps inside the sheet don't bubble.

Concretely in `FullscreenTakeover.tsx`:
- Backdrop: replace `onClick={() => onOpenChange(false)}` with `onPointerDown={(e) => { e.stopPropagation(); onOpenChange(false); }}`
- Close button: keep `onClick` but add `e.stopPropagation()` in the handler.

This guarantees the close gesture fires exactly once, on a single pointer event, and the resulting `setShowDiscardDialog(true)` lands and the dialog renders cleanly above the still-open sheet (`handleOpen` already returned early without closing).

No other behavior changes. All existing `console.log` statements preserved.

### Checklist
- ✅ Only `FullscreenTakeover.tsx` and `LogInteractionSheet.tsx` touched
- ✅ Double `requestAnimationFrame` used to force paint before transition
- ✅ `visible` state (not `open`) drives all transition styles
- ✅ Discard dialog trigger path traced; fix is to switch backdrop close handler to `onPointerDown` + `stopPropagation` so a single tap cleanly triggers `handleOpen(false)` once
- ✅ No discard dialog logic changes — only event wiring
- ✅ All `console.log` statements preserved

