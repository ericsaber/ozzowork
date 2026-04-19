

## Plan: Next Button Progressive Reveal + Spacing

**Files:** `src/components/LogInteractionSheet.tsx` and `src/components/LogStep1.tsx`.

### Fix 1 — Next button progressive reveal (LogInteractionSheet.tsx)

Wrap the Next button in a reveal div that shows/hides based on `canNext`:

```tsx
<div
  style={{
    maxHeight: canNext ? "60px" : "0",
    opacity: canNext ? 1 : 0,
    overflow: "hidden",
    transition: "max-height 0.3s ease, opacity 0.25s ease",
  }}
>
  <button
    onClick={() => logMutation.mutate()}
    disabled={logMutation.isPending}
    style={{
      width: "100%",
      background: "#c8622a",
      color: "white",
      border: "none",
      borderRadius: 100,
      padding: 15,
      fontSize: 16,
      fontWeight: 500,
      fontFamily: "Outfit, sans-serif",
      cursor: logMutation.isPending ? "default" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    }}
  >
    {logMutation.isPending ? "Saving…" : logOnly ? "Save" : "Next"}
    {!logMutation.isPending && <ArrowRight size={18} />}
  </button>
</div>
```

Remove `disabled={!canNext}` and the conditional `background`/`color` logic from the button itself.

### Fix 2 — Reduce gap in LogStep1 (LogStep1.tsx)

Change outer wrapper gap from 16 to 12:

```tsx
// Before:
style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16, minHeight: 0, paddingTop: 0 }}

// After:
style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12, minHeight: 0, paddingTop: 0 }}
```

### Fix 3 — Equal spacing in LogInteractionSheet (LogInteractionSheet.tsx)

Change step 1 bottom action area gap from 8 to 12:

```tsx
// Before:
style={{ flexShrink: 0, padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 8 }}

// After:
style={{ flexShrink: 0, padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 12 }}
```

### Preserved
- All `console.log` statements
- All mutations, handlers, state, dialogs, celebration overlay
- All component props and structure outside the specified changes

### Checklist
- ✅ Only `LogInteractionSheet.tsx` and `LogStep1.tsx` touched
- ✅ Next button wrapped in reveal div with maxHeight/opacity transition
- ✅ Next button no longer has `disabled={!canNext}` or conditional colors
- ✅ LogStep1 outer wrapper gap changed from 16 to 12
- ✅ Step 1 bottom action area gap changed from 8 to 12
- ✅ All `console.log` preserved

