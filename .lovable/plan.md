

## Plan: MapPin Alignment + Address Field Order

**Files:** `src/pages/ContactHistory.tsx`, `src/pages/Contacts.tsx`, `src/components/LogInteractionSheet.tsx`

### Fix 1 — MapPin alignment (ContactHistory.tsx)

Revert `alignItems` on the address `<a>` tag from `"flex-start"` back to `"center"`. Keep `flexShrink: 0` on the `<MapPin>`.

```tsx
// Line ~269
alignItems: "center",  // revert from "flex-start"
```

### Fix 2 — Address field order in all contact forms

Move Address input to after Company and before Phone. New order: First/Last → Company → Address → Phone → Email.

**ContactHistory.tsx — Edit Contact form:**
- Move Address `<Input>` from after Email to after Company

**Contacts.tsx — New Contact form (showAdd panel):**
- Move Address `<Input>` from after Email to after Company

**LogInteractionSheet.tsx — Quick-add in contact picker step:**
- Move Address `<Input>` from after Email to after Company

**LogInteractionSheet.tsx — Quick-add in step 1:**
- Move Address `<Input>` from after Email to after Company

### Preserved
- All `console.log` statements
- All other component logic
- `flexShrink: 0` on MapPin

### Checklist
- ✅ Only 3 files touched
- ✅ `alignItems` reverted to `"center"` on address `<a>` tag
- ✅ `flexShrink: 0` preserved on `<MapPin>`
- ✅ Address input moved to after Company, before Phone in all 4 form locations
- ✅ No other changes
- ✅ All `console.log` preserved

