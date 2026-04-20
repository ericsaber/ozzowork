

## Plan: MapPin Centering + Add Address Position

**Files:** `src/pages/ContactHistory.tsx`, `src/pages/Contacts.tsx`

### Fix 1 — MapPin icon spans both address lines (ContactHistory.tsx ~line 287)

Restructure the address display so the MapPin sits to the left of a column containing both lines. Change `alignItems` to `"center"` on the `<a>` tag and use `alignSelf: "center"` on the MapPin. Remove `paddingLeft: 19` from line2.

```tsx
<a
  href={`https://maps.google.com/maps?q=${encodeURIComponent(query)}`}
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#c8622a",
    fontFamily: "var(--font-body)",
    textDecoration: "none",
    marginTop: 2,
  }}
>
  <MapPin size={15} color="#c8622a" style={{ flexShrink: 0, alignSelf: "center" }} />
  <span style={{ display: "flex", flexDirection: "column", gap: 0 }}>
    <span>{line1}</span>
    {line2 && <span>{line2}</span>}
  </span>
</a>
```

### Fix 2 — Move "+ Add address" in ContactHistory.tsx edit form (~line 492)

Move the address section from after Company to after Email. Add `width: "100%"`, `justifyContent: "center"`, `textAlign: "center"` to center the "+ Add address" button.

New order: First/Last Name → Company → Phone → Email → Address section → Save Changes

### Fix 3 — Move "+ Add address" in Contacts.tsx new contact form (~line 345)

Same change as Fix 2: move address section from after Company to after Email, with centered "+ Add address" button.

New order: First/Last Name → Company → Phone → Email → Address section → Add Contact button

### Preserved
- All `console.log` statements
- All existing form field logic and mutations
- All styling except the specific changes noted

### Checklist
- ✅ Only `ContactHistory.tsx` and `Contacts.tsx` touched
- ✅ Address `<a>` restructured: MapPin left, column of line1+line2 right
- ✅ `alignItems: "center"` on `<a>` so icon centers across both lines
- ✅ `alignSelf: "center"` on MapPin
- ✅ `paddingLeft: 19` removed from line2 span
- ✅ Address section moved to after Email, before Save Changes in ContactHistory edit form
- ✅ Address section moved to after Email, before Add Contact button in Contacts new contact form
- ✅ "+ Add address" button centered with `width: "100%"`, `justifyContent: "center"`, `textAlign: "center"`
- ✅ All `console.log` preserved

