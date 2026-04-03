

## Step 10: Rewrite CompleteFollowupSheet + wire up completion flow

Four files modified: `CompleteFollowupSheet.tsx`, `LogInteractionSheet.tsx`, `Today.tsx`, `ContactHistory.tsx`

### 1. CompleteFollowupSheet.tsx — full rewrite

- **Props**: Replace `taskRecordId` → `followUpId`, `followUpType` → `plannedType` (nullable), remove `hasInteraction`. Remove `useRef` import, add `draftId` state.
- **invalidateAll**: Replace task-record keys with `interactions`, `follow-ups`, `follow-ups-active`, `follow-ups-today`, `follow-ups-upcoming`, `follow-ups-history`, `active-followup`.
- **logMutation** (Step 1): Create an interaction draft in `interactions` table (status: "draft"). Store `draftId` in state. Move to step 2 on success.
- **followupMutation** (Step 2 save): Mark follow-up completed (write connect_type/connect_date/note onto `follow_ups` row), publish interaction draft, optionally insert new active follow-up.
- **handleSkip** (Step 2 skip): Same as followupMutation but no new follow-up created.
- **handleClose**: Reset `draftId`, `connectType` from `plannedType`, `note`, `step`.
- **handleUpdateLog**: Update local state + update draft in DB if exists.
- **JSX**: `onBack` always `() => setStep(1)`. Remove `hasInteraction` conditional.

### 2. LogInteractionSheet.tsx — remove skipFollowupStep

- Remove `skipFollowupStep` from props interface and destructuring.
- Remove the TODO stub block (lines 169-174).
- Remove `onSuccess` guard for `skipFollowupStep` stub (line 214 `if (!result) return;`).
- Line 219: `activeFollowup && !skipFollowupStep` → `activeFollowup`.
- Line 539: `!skipFollowupStep && step !== "outstanding"` → `step !== "outstanding"`.
- Line 576: `skipFollowupStep || activeFollowup ? undefined :` → `activeFollowup ? undefined :`.
- Line 591: Remove `submitLabel={skipFollowupStep ? "Save →" : undefined}`.
- Line 592: Remove `showDateRow={skipFollowupStep}`.

### 3. Today.tsx — wire complete button

- Add `completeTarget` state with `{ followUpId, contactId, contactName, plannedType }`.
- Update `renderCard` `onComplete` to set `completeTarget` from item data.
- Import and render `CompleteFollowupSheet` at bottom of JSX, passing new props. `userId=""` (unused, fetched internally).

### 4. ContactHistory.tsx — wire complete button

- Add `completeTarget` state.
- Update `ContactFollowupCard` `onComplete` to set `completeTarget`.
- Import and render `CompleteFollowupSheet` at bottom of JSX.

