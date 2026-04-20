

## Plan: MapPin Size + Alignment for Multiline Address

**File:** `src/pages/ContactHistory.tsx`

### Changes to the address maps link block (~line 269)

1. Change `alignItems` on the wrapping `<a>` tag from `"center"` to `"flex-start"` — handles both single and multiline addresses correctly.

2. Update `<MapPin>`:
   - Increase `size` from `13` to `15`
   - Add `marginTop: 2` to nudge icon down to align with first line of text
   - Keep `flexShrink: 0`

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
  <MapPin size={15} color="#c8622a" style={{ flexShrink: 0, marginTop: 2 }} />
  {contact.address}
</a>
```

### Preserved
- All `console.log` statements
- All other component logic
- `flexShrink: 0` on `<MapPin>`

### Checklist
- ✅ Only `ContactHistory.tsx` touched
- ✅ `alignItems` on `<a>` changed to `"flex-start"`
- ✅ MapPin `size` increased from 13 to 15
- ✅ `marginTop: 2` added to MapPin style
- ✅ `flexShrink: 0` preserved
- ✅ No other changes
- ✅ All `console.log` preserved

