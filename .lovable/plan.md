

## Plan: Skip Log Condition, Follow-up Set Text, Note Pill Label

**Files:** `src/components/LogInteractionSheet.tsx` and `src/components/LogStep2.tsx`.

### Fix 1 — Skip log link shows in all LogInteractionSheet flows
In `LogInteractionSheet.tsx`, remove `!preselectedContactId` from the Skip log button condition:

```tsx
// Before:
{!logOnly && !activeFollowup && !preselectedContactId && (
// After:
{!logOnly && !activeFollowup && (
```

### Fix 2 — "Follow-up set." when no log was saved
In `LogInteractionSheet.tsx`:

- In `followupMutation.mutationFn`, change the normal step 2 path's final return to include `hadDraft`:
  ```ts
  return { completePath: false, hasFollowup: true, hadDraft: !!draftId };
  ```
- In `followupMutation.onSuccess`, replace the existing text logic with:
  ```ts
  let text: string;
  if (result?.completePath) {
    text = result.hasFollowup ? "Logged & set." : "Logged.";
  } else if (result?.hasFollowup) {
    text = result?.hadDraft ? "Logged & set." : "Follow-up set.";
  } else {
    text = "Logged.";
  }
  triggerCelebration(text, contactId);
  ```

### Fix 3 — "Connected" in step 2 summary pill
In `LogStep2.tsx`, update the pill label fallback:

```tsx
// Before:
{connectType ? `${typeLabel} · ${contactName}` : `Note · ${contactName}`}
// After:
{connectType ? `${typeLabel} · ${contactName}` : `Connected · ${contactName}`}
```

### Preserved
- All `console.log` statements
- All other state, mutations, handlers, and rendering

### Checklist
- ✅ Only `LogInteractionSheet.tsx` and `LogStep2.tsx` touched
- ✅ `!preselectedContactId` removed from Skip log condition
- ✅ `followupMutation.mutationFn` normal path returns `hadDraft: !!draftId`
- ✅ `followupMutation.onSuccess` uses `hadDraft` to pick "Follow-up set." vs "Logged & set."
- ✅ Summary pill shows "Connected · {contactName}" when no `connectType`
- ✅ All `console.log` preserved

