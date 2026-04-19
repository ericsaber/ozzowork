

## Plan: CompleteFollowupSheet Fix + Celebration Overlay

**File:** `src/components/CompleteFollowupSheet.tsx` only.

### Fix 1 — Remove StepIndicator
- Remove `import StepIndicator from "@/components/StepIndicator"`
- Remove `<StepIndicator currentStep={step} />` render
- `StepIndicator.tsx` file untouched

### Fix 2 — Remove CelebrationHeader usage
- Remove `import CelebrationHeader from "@/components/CelebrationHeader"`
- Remove the `{showToast && <CelebrationHeader … />}` render block
- `CelebrationHeader.tsx` file untouched (still used elsewhere)

### Fix 3 — Step 1 bottom action area
- Wrap both `LogStep1` and `LogStep2` renders in a `paddingTop: 20` div to clear the × close button
- Remove `onSubmit` and `isSubmitting` props from `LogStep1` call
- Add a fixed bottom area mirroring the existing step 2 pattern, rendered when `step === 1`:
  - Next button (full-width, sienna `#c8622a` when valid, `#ddd8d1`/`#b0ada8` when disabled, ArrowRight icon)
  - Disabled when `logMutation.isPending || (!note.trim() && !connectType)`
  - On click: `logMutation.mutate()`
  - Skip follow-up link below (calls `handleSkip`)

### Fix 4 — Full-screen celebration overlay
**New state:**
```ts
const [showCelebration, setShowCelebration] = useState(false);
const [celebrationText, setCelebrationText] = useState("Logged.");
```

**Update `followupMutation.onSuccess`:** replace immediate `handleClose()`/`navigate()` with:
```ts
invalidateAll();
setCelebrationText(pendingDate ? "Logged & set." : "Logged.");
setShowCelebration(true);
setTimeout(() => {
  setShowCelebration(false);
  handleClose();
  navigate(`/contact/${contactId}`);
}, 1800);
```
(Remove the existing `toast.success(...)` call here — celebration overlay replaces it.)

**Update `handleSkip`:** after `invalidateAll()`, replace `toast.success`/`handleClose`/`navigate` with the same celebration trigger pattern (text always "Logged.").

**Update `handleClose`:** add `setShowCelebration(false)` to the reset block.

**Overlay JSX** (sibling of `FullscreenTakeover`, inside outer `<>` fragment, before `AlertDialog`):
- Fixed full-screen, `zIndex: 70`, bg `#f0f7f4` (green), centered column flex
- Lucide `Check` icon, size 32, stroke `#2d6a4f`, strokeWidth 2.5, with `celebCheck` scale animation
- `celebrationText` in Crimson Pro, size 32, color `#2d6a4f`
- `contactName` in Outfit, size 16, color `#888480`
- `<style>` tag with `celebFadeIn` and `celebCheck` keyframes
- Container animated with `celebFadeIn`

**New import:** `Check` from `lucide-react` (in addition to existing `ArrowRight`).

### Preserved
- All `console.log` statements
- All mutations, state, handlers (only `onSuccess` bodies updated)
- All `invalidateAll` calls
- `AlertDialog` discard flow

### Checklist
- ✅ Only `CompleteFollowupSheet.tsx` touched
- ✅ `StepIndicator` import + render removed
- ✅ `CelebrationHeader` import + render removed (file untouched)
- ✅ Step 1 bottom area with Next + Skip
- ✅ Next disabled when `!note.trim() && !connectType`
- ✅ `paddingTop: 20` wrapper around both step renders
- ✅ `onSubmit`/`isSubmitting` removed from `LogStep1`
- ✅ Celebration overlay at `zIndex: 70`
- ✅ `showCelebration` reset in `handleClose`
- ✅ Text "Logged & set." when `pendingDate`, else "Logged."
- ✅ Auto-dismiss 1800ms → close + navigate
- ✅ All `console.log` preserved

