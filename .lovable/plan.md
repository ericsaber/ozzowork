

## Plan: Always show "Edit follow-up" menu item

**File:** `src/components/FollowupCard.tsx`, lines 475-479

**Change:** Remove the `{onEdit && (...)}` conditional wrapper so the `DropdownMenuItem` always renders. The `onClick` already calls `handleStartEdit()`, so no change needed there.

```tsx
// Before (lines 475-479)
{onEdit && (
  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}>
    <Pencil size={14} className="mr-2" /> Edit follow-up
  </DropdownMenuItem>
)}

// After
<DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}>
  <Pencil size={14} className="mr-2" /> Edit follow-up
</DropdownMenuItem>
```

No other changes.

