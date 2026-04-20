

## Plan: Address Text Wrapping

**File:** `src/pages/ContactHistory.tsx`

### Change to address maps link block (~line 269)

Wrap the address text node in a `<span>` with `minWidth: 0` and `wordBreak: "break-word"` so it wraps naturally within the flex container.

```tsx
<a
  href={`https://maps.google.com/maps?q=${encodeURIComponent((contact as any).address)}`}
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: "flex",
    alignItems: "flex-start",
    gap: 4,
    fontSize: 13,
    color: "#c8622a",
    fontFamily: "var(--font-body)",
    textDecoration: "none",
    marginTop: 2,
  }}
>
  <MapPin size={15} color="#c8622a" style={{ flexShrink: 0, marginTop: 2 }} />
  <span style={{ minWidth: 0, wordBreak: "break-word" }}>
    {(contact as any).address}
  </span>
</a>
```

### Preserved
- All `<a>` tag styles (`display: "flex"`, `alignItems: "flex-start"`, etc.)
- All `<MapPin>` styles (`size={15}`, `flexShrink: 0`, `marginTop: 2`)
- All `console.log` statements

### Checklist
- ✅ Only `ContactHistory.tsx` touched
- ✅ Address text node wrapped in `<span>` with `minWidth: 0` and `wordBreak: "break-word"`
- ✅ All existing `<a>` and `<MapPin>` styles preserved
- ✅ No other changes
- ✅ All `console.log` preserved

