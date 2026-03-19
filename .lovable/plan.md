

## Bug Fixes Round 4 — 4 Changes

### Fix 1: Date not saving + task record not refreshing in skipFollowupStep mode

**Problem (a):** `connectDate` state lives in `LogInteractionSheet` and is passed to `LogStep1` for display, but the mutation reads `connectDate` from the component state. The issue is that `setConnectDate` from `LogStep1` calls back to the parent correctly — the prop chain looks intact. The likely issue is the `connectDate` reset in `clearAndClose()` racing with the mutation, or the initial value not updating. Will add the requested console.log before the update and trace.

**Problem (b):** The invalidation on success uses `queryKey: ["task-record"]` (no ID) which won't match the query `["task-record", id]`. Also, `InteractionDetail.tsx` invalidation on close is missing `["task-records"]`.

**File: `src/components/LogInteractionSheet.tsx`**
- Line 165: Add `console.log('[skipFollowupStep] update payload:', { connect_type: connectType || null, note: note || null, connect_date: connectDate })` before mutation fires (already exists but verify format matches request)
- Line 190: Change `queryClient.invalidateQueries({ queryKey: ["task-record"] })` → `queryClient.invalidateQueries({ queryKey: ["task-record", existingTaskRecordId] })` — this is the key mismatch causing no refresh
- Add `queryClient.invalidateQueries({ queryKey: ["contact-task-records", contactId] })` after the existing invalidations
- Add `console.log('[skipFollowupStep] invalidating queries for task-record:', existingTaskRecordId)`

**File: `src/pages/InteractionDetail.tsx`**
- Lines 283-286: Update `onOpenChange` to also invalidate `["task-records"]` and add console.log:
```tsx
onOpenChange={(o) => {
  setLogSheetOpen(o);
  if (!o) {
    console.log('[InteractionDetail] invalidating on sheet close, id:', id);
    queryClient.invalidateQueries({ queryKey: ["task-record", id] });
    queryClient.invalidateQueries({ queryKey: ["task-records"] });
  }
}}
```

### Fix 2: connectType undefined not caught by fallback

**File: `src/components/LogStep2.tsx`**
- Line 56: `useState(connectType || "")` — already handles undefined via `||`. But line 63 `useState(!!connectType)` — this correctly treats undefined as falsy. The checks look correct already. Will verify no `=== ""` comparisons exist elsewhere.

**File: `src/pages/ContactHistory.tsx`**
- Line 273: Already uses `type ? ... : MessageSquare` — handles falsy. No change needed.
- Line 274: Already uses `type ? ... : "Interacted"` — handles falsy. No change needed.

**File: `src/components/FollowupCard.tsx`**
- Line 36: Already uses `connectType ? ... : MessageSquare` — handles falsy. No change needed.
- Line 37: Already uses `connectType ? ... : "Interacted"` — handles falsy. No change needed.

These all use truthy checks (`?`), not `=== ""`, so they already handle undefined. No changes needed for Fix 2 beyond confirming.

### Fix 3: Replace MessageSquare fallback with ClipboardList

No `ClipboardList` currently imported anywhere. Replace `MessageSquare` fallback (not the Text type icon) with `ClipboardList` in:

**File: `src/pages/ContactHistory.tsx`**
- Add `ClipboardList` to lucide-react import
- Line 273: Change fallback from `MessageSquare` to `ClipboardList`

**File: `src/components/FollowupCard.tsx`**
- Add `ClipboardList` to lucide-react import
- Line 36: Change fallback from `MessageSquare` to `ClipboardList`

**File: `src/pages/InteractionDetail.tsx`**
- No fallback icon for missing connect_type in the "What happened" section currently — it only renders `ConnectIcon` when `hasInteraction` is true. No change needed here since the empty state shows the nudge text instead.

### Fix 4: Nudge styling consistency

**File: `src/pages/InteractionDetail.tsx`**

The "What's next" empty state (lines 248-255) already has the correct styling (`#fdf5f0`, border, rounded-[10px], etc.).

The "What happened" empty state (lines 201-208) is a plain `<p>` without the card styling. Wrap it in the same styled div:

```tsx
<div className="rounded-[10px] py-[10px] px-[14px]" style={{ background: "#fdf5f0", border: "0.5px solid rgba(200,98,42,0.2)" }}>
  <p className="text-[13px]" style={{ color: "#7a746c", fontFamily: "var(--font-body)" }}>
    No interaction logged.{" "}
    <button onClick={() => setLogSheetOpen(true)} className="underline font-medium" style={{ color: "#c8622a" }}>
      Want to add one?
    </button>
  </p>
</div>
```

### Summary of file changes

1. **`src/components/LogInteractionSheet.tsx`** — Fix query key mismatch (`["task-record", existingTaskRecordId]`), add contact-task-records invalidation, add console.logs
2. **`src/pages/InteractionDetail.tsx`** — Add `["task-records"]` invalidation + console.log on sheet close, wrap "What happened" nudge in styled card
3. **`src/pages/ContactHistory.tsx`** — Import `ClipboardList`, use as fallback icon
4. **`src/components/FollowupCard.tsx`** — Import `ClipboardList`, use as fallback icon

