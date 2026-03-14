

# Fix Completion Flow: Always Capture "What Happened" First

## Problem
1. **Wrong label**: "Log follow-up" CTAs should read "Complete follow-up"
2. **Skipping step 1**: The `CompleteFollowupSheet` starts at step 2 ("What's next") when `hasInteraction` is true. It should **always** start at step 1 ("What happened") so users can log what actually occurred before scheduling the next follow-up.

## Changes

### 1. `src/components/CompleteFollowupSheet.tsx`
- Change initial step to always be `1` (remove the `hasInteraction ? 2 : 1` conditional)
- Always show the `StepIndicator` (remove the `!hasInteraction &&` guard)
- The `logMutation` (step 1 submit) already correctly updates the task record with `connect_type`, `connect_date`, `note`, and marks it completed — no change needed there
- Update `handleClose` reset to always reset to step `1`

### 2. `src/pages/InteractionDetail.tsx`
- Rename the "Log follow-up" button text to "Complete follow-up"

### 3. `src/components/FollowupCard.tsx` (if applicable)
- No "Log follow-up" label exists here, but the checkmark triggers completion which is correct

No other files need changes — the label only appears in `InteractionDetail.tsx`, and the step-skip logic is isolated to `CompleteFollowupSheet.tsx`.

