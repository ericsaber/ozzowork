

## Wire up "New" dropdown log mode routing

Two files modified: `LogInteractionSheet.tsx` and `ContactHistory.tsx`.

### 1. `LogInteractionSheet.tsx`

**Props** (lines 24-28): Add `startStep?: 1 | 2` and `logOnly?: boolean` to interface, destructure with defaults `startStep = 1`, `logOnly = false`.

**Initial step state** (line 35): Change `useState<...>(1)` to `useState<...>(startStep)`.

**Reset on close** (line 89): Change `setStep(1)` to `setStep(startStep)`.

**logOnly mode** (lines 206-222 in `logMutation.onSuccess`): Before the `activeFollowup` check, add early return for `logOnly` — publish draft immediately, toast, close.

**StepIndicator** (line 526-528): Add `startStep !== 2` condition so stepper hides in follow-up-only mode.

**LogStep2 onSkip** (line 599): Pass `undefined` when `startStep === 2` to hide skip link.

### 2. `ContactHistory.tsx`

**State** (line 40): Replace `logSheetOpen` boolean with `logSheetMode` state: `useState<{ startStep: 1 | 2; logOnly: boolean } | null>(null)`. Derive `logSheetOpen = !!logSheetMode`.

**Dropdown handlers**: Update three option `onClick`s:
- "Log + Set Follow-up" → `setLogSheetMode({ startStep: 1, logOnly: false })`
- "Log only" → `setLogSheetMode({ startStep: 1, logOnly: true })`
- "Follow-up only" → `setLogSheetMode({ startStep: 2, logOnly: false })`

**Sheet call** (line 698): Pass `startStep`, `logOnly`, and update `onOpenChange` to set mode to `null`.

