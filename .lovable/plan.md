

## Plan: Update ContactHistory.tsx for ContactFollowupCard redesign

### What changes

**File: `src/pages/ContactHistory.tsx`**

1. **Add cancel state** — new state variables:
   - `cancelTarget` (follow-up object or null)
   - `showCancelDialog` (boolean)

2. **Add cancel mutation** — `cancelFollowUpMutation` matching Today.tsx pattern: sets `status: 'cancelled'`, `completed_at`, invalidates `follow-ups-active`, `follow-ups`, and contact-specific query keys.

3. **Fix ContactFollowupCard prop call site** (around line 440):
   - Remove `hidePlannedFallback`
   - Remove `onTap` / `onReschedule` (if present)
   - Add `onEdit={() => { ... }}` (opens EditFollowupSheet — or sets editTarget)
   - Add `onCancel={() => { setCancelTarget(activeFollowup); setShowCancelDialog(true); }}`
   - Add `menuOpen` / `onMenuOpenChange` tied to `openMenuId` state
   - Ensure `taskRecord` object includes `reminder_note: activeFollowup.reminder_note`

4. **Add cancel AlertDialog** — three-button dialog identical to Today.tsx:
   - "Cancel and log what happened" → calls `cancelFollowUpMutation.mutate()` (TODO: route to log flow)
   - "Yes, cancel" → calls `cancelFollowUpMutation.mutate()`
   - "Don't cancel" → dismisses

### Technical details

- The `activeFollowup` query already uses `select("*")` so `reminder_note` is already in the data; it just needs to be passed through in the `taskRecord` prop.
- `openMenuId` state already exists in ContactHistory.tsx (line 38) for history item menus — reuse it for the follow-up card menu as well.
- Cancel mutation invalidates `["follow-ups-active", id]` and `["follow-ups"]` to refresh both the contact record and any global lists.
- All existing `console.log` statements preserved. No other files modified.

