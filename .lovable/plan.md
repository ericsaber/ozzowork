

## Plan: Z-Index + Save Log Only Fix

**Files:** `src/components/FullscreenTakeover.tsx` and `src/components/LogInteractionSheet.tsx` only.

### Fix 1 — `FullscreenTakeover.tsx` z-index bump

Bottom nav uses Tailwind `z-50`, conflicting with the sheet's `zIndex: 50`, so the nav floats above the takeover.

- Backdrop: `zIndex: 49` → `zIndex: 59`
- Sheet container: `zIndex: 50` → `zIndex: 60`

No other changes.

### Fix 2 — `LogInteractionSheet.tsx` `handleSaveLogOnly` (lines 615–626)

Current implementation aborts when `draftId` is null, so a typed-but-not-advanced interaction is silently discarded. Replace with a version that:

1. If `draftId` exists → publish it (existing behavior).
2. Else if `note.trim()` or `connectType` has content → insert a new `interactions` row directly with `status: "published"`.
3. Else → close without saving.

After saving (either branch), invalidate queries, toast, and `clearAndClose()`. **No navigation** — user returns to wherever they were.

```ts
const handleSaveLogOnly = async () => {
  if (!contactId) {
    clearAndClose();
    return;
  }

  if (draftId) {
    await supabase
      .from("interactions")
      .update({ status: "published" })
      .eq("id", draftId);
    console.log("[saveLogOnly] existing draft published:", draftId);
  } else if (note.trim() || connectType) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("interactions")
      .insert({
        contact_id: contactId,
        user_id: user.id,
        connect_type: connectType || null,
        connect_date: getConnectDateISO(),
        note: note.trim() || null,
        status: "published",
      })
      .select("id")
      .single();
    if (error) {
      console.log("[saveLogOnly] insert error:", error);
      return;
    }
    console.log("[saveLogOnly] new interaction created + published:", data.id);
  } else {
    console.log("[saveLogOnly] nothing to save, closing");
    clearAndClose();
    return;
  }

  invalidateAll();
  toast.success("Log saved.");
  clearAndClose();
};
```

All referenced helpers (`contactId`, `draftId`, `note`, `connectType`, `getConnectDateISO`, `invalidateAll`, `clearAndClose`) already exist in the file.

### Preserved
- All existing `console.log` statements (line 622's log is replaced by the new branch-specific logs which retain the same intent).
- All other logic, state, mutations, and navigation flows.

### Checklist
- ✅ Only `FullscreenTakeover.tsx` and `LogInteractionSheet.tsx` touched
- ✅ Backdrop `zIndex: 59`, sheet `zIndex: 60`
- ✅ `handleSaveLogOnly` creates + publishes when no draft exists
- ✅ Still publishes existing draft when present
- ✅ No navigation on completion
- ✅ All `console.log` preserved (and new ones added per spec)

