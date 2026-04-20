

## Plan: Remove MapPin from Address Display + Reorder Quick-add Form

**Files:** `src/pages/ContactHistory.tsx`, `src/components/LogInteractionSheet.tsx`

### Fix 1 — Remove MapPin from address display (ContactHistory.tsx ~line 290–310)

Strip the `<MapPin>` element from the address `<a>` tag. The `<a>` becomes a simple flex column of `line1` + optional `line2`, still tappable, still linking to Google Maps.

```tsx
<a
  href={`https://maps.google.com/maps?q=${encodeURIComponent(query)}`}
  target="_blank"
  rel="noopener noreferrer"
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 1,
    fontSize: 13,
    color: "#c8622a",
    fontFamily: "var(--font-body)",
    textDecoration: "none",
    marginTop: 2,
  }}
>
  <span>{line1}</span>
  {line2 && <span>{line2}</span>}
</a>
```

**Import note:** `MapPin` is still used in the edit form's "+ Add address" button (line 513), so the `lucide-react` import stays unchanged.

### Fix 2 — Move "+ Add address" after Email in quick-add form (LogInteractionSheet.tsx)

Two locations: contact picker step (~lines 925–967) and step 1 (~lines 989–1031). In both, reorder so the address block sits between Email and the Create & Select button.

**New order:**
1. First/Last Name grid
2. Company
3. Phone
4. Email
5. Address section (`+ Add address` button OR expanded fields)
6. Create & Select button

Center the "+ Add address" button by adding `width: "100%"`, `justifyContent: "center"`, `textAlign: "center"` to its inline style (in both locations).

### Preserved
- All `console.log` statements
- Map link query logic (line1/line2 join)
- Address field inputs and their existing styles
- `MapPin` icon on the "+ Add address" buttons (both files)
- All other component logic

### Checklist
- ✅ Only `ContactHistory.tsx` and `LogInteractionSheet.tsx` touched
- ✅ `<MapPin>` removed from address display in ContactHistory
- ✅ `lucide-react` import unchanged (MapPin still used elsewhere in file)
- ✅ Address `<a>` uses `flexDirection: "column"` with line1 + line2 spans
- ✅ Quick-add address section moved to after Email in both form locations
- ✅ "+ Add address" button centered in both quick-add locations
- ✅ All `console.log` preserved

