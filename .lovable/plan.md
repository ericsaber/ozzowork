

## Plan: MapPin Icon + Address Field Order

**Files:** `src/pages/ContactHistory.tsx`, `src/pages/Contacts.tsx`, `src/components/LogInteractionSheet.tsx`

### Fix 1 — MapPin icon stays fixed size on multiline address (ContactHistory.tsx)

**Line ~260 area (maps link block):**
- Add `style={{ flexShrink: 0 }}` to `<MapPin>` element
- Change `alignItems: "center"` to `alignItems: "flex-start"` on wrapping `<a>` tag

```tsx
<a
  href={`https://maps.google.com/maps?q=${encodeURIComponent(contact.address)}`}
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: "inline-flex",
    alignItems: "flex-start",  // was "center"
    gap: 4,
    fontSize: 13,
    color: "#c8622a",
    fontFamily: "var(--font-body)",
    textDecoration: "none",
    marginTop: 2,
  }}
>
  <MapPin size={13} color="#c8622a" style={{ flexShrink: 0 }} />
  {contact.address}
</a>
```

### Fix 2 — Address field order in all contact forms

Move Address input to after Company and before Phone. New order: First/Last → Company → Address → Phone → Email.

**ContactHistory.tsx — Edit Contact form (line ~442 area):**
- Move Address `<Input>` from after Email to after Company

**Contacts.tsx — New Contact form (showAdd panel):**
- Move Address `<Input>` from after Email to after Company

**LogInteractionSheet.tsx — Quick-add in contact picker step (line ~925 area):**
- Move Address `<Input>` from after Email to after Company

**LogInteractionSheet.tsx — Quick-add in step 1 (line ~955 area):**
- Move Address `<Input>` from after Email to after Company

### Preserved
- All `console.log` statements
- All other component logic
- No logic changes — JSX reorder only

### Checklist
- ✅ Only `ContactHistory.tsx`, `Contacts.tsx`, `LogInteractionSheet.tsx` touched
- ✅ MapPin gets `style={{ flexShrink: 0 }}`
- ✅ Wrapping `<a>` gets `alignItems: "flex-start"`
- ✅ Address input moved to after Company, before Phone in all four form locations
- ✅ No other changes
- ✅ All `console.log` preserved

