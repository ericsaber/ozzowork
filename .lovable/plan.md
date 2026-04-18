

## Plan: Timezone + Animation Bugs in ContactHistory.tsx (Updated)

**File:** `src/pages/ContactHistory.tsx` only.

### Fix 1 — parseISO → parseDate on date-only fields

Replace all three `parseISO` calls on follow-up timestamp fields with `parseDate`:
- **Line 585** (scheduled row): `format(parseISO(fu.created_at), "MMM d")` → `format(parseDate(fu.created_at), "MMM d")`
- **Line 640** (cancelled row): `format(parseISO(fu.completed_at), "MMM d")` → `format(parseDate(fu.completed_at), "MMM d")`
- **Line 655** (completed-with-no-connect-date branch): `format(parseISO(fu.completed_at), "MMM d")` → `format(parseDate(fu.completed_at), "MMM d")`

After these replacements, verify `parseISO` is no longer used anywhere in the file. If unused, remove it from the `date-fns` import. If still used elsewhere, leave it.

### Fix 2 — CompleteFollowupSheet always-mounted

Remove the `{completeTarget && (...)}` conditional wrapper. Render unconditionally with optional chaining + `??` fallbacks so the close animation can play before state clears:

```tsx
<CompleteFollowupSheet
  open={!!completeTarget}
  onOpenChange={(o) => { if (!o) setCompleteTarget(null); }}
  followUpId={completeTarget?.followUpId ?? ""}
  contactId={completeTarget?.contactId ?? id ?? ""}
  contactName={completeTarget?.contactName ?? ""}
  plannedType={completeTarget?.plannedType ?? null}
  userId=""
/>
```

### Preserved
- All `console.log` statements
- All other logic, state, and rendering

### Checklist
- ✅ Only `ContactHistory.tsx` touched
- ✅ Lines 585, 640, 655 swapped to `parseDate`
- ✅ `parseISO` import removed if no remaining usages
- ✅ `CompleteFollowupSheet` conditional wrapper removed; props use `?? ""` / `?? null` fallbacks
- ✅ All `console.log` preserved

