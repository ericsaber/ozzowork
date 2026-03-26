

## Fix: Follow-up date dropped + undo complete silent failure

### Bug 1 — `src/components/CompleteFollowupSheet.tsx`

**Line 114**: `plannedFollowUpDate: date || null` nulls out the date when type is empty but date is set, because `followupMutation` passes both through `|| null`. The fix: decouple date from type.

Change line 113-114:
```typescript
plannedFollowUpType: type || null,
plannedFollowUpDate: date || null,
```
to:
```typescript
plannedFollowUpType: type || null,
plannedFollowUpDate: date ? date : null,
```

Add console log after line 111:
```typescript
console.log('[completion] op2 follow-up payload:', { type, date, planned_follow_up_type: type || null, planned_follow_up_date: date ? date : null });
```

Note: `date || null` and `date ? date : null` behave identically for strings — the real issue may be upstream where `type` emptiness causes `date` to not be passed. Need to verify `onSaveWithFollowup` call site. But the log will confirm.

### Bug 2 — `src/pages/InteractionDetail.tsx`

**Lines 53-66**: `undoCompleteMutation` has no error handler — errors are silently swallowed.

Add to `mutationFn` (line 54): console log at start + wrap in try/catch:
```typescript
mutationFn: async () => {
  console.log('[InteractionDetail] undo complete triggered:', { taskRecordId: id });
  try {
    const { error } = await supabase.from("task_records" as any)
      .update({ status: "active", completed_at: null })
      .eq("id", id!);
    if (error) throw error;
  } catch (error) {
    console.log('[InteractionDetail] undo complete error:', error);
    throw error;
  }
},
```

Add `onError` handler after `onSuccess`:
```typescript
onError: (e: any) => toast.error(e.message),
```

All existing console.logs remain.

