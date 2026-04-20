

## Plan: Address Wrapping — Text Container Padding

**File:** `src/pages/ContactHistory.tsx`

### Change

Add `style={{ paddingRight: 8 }}` to the `flex-1 min-w-0` div that wraps the contact name, company, and address. This creates a natural right margin before the `MoreHorizontal` button so the address wraps earlier.

```tsx
<div className="flex-1 min-w-0" style={{ paddingRight: 8 }}>
  <h1 ...>{fullName}</h1>
  {contact.company && <p ...>{contact.company}</p>}
  {(contact as any).address && (
    <a ...>...</a>
  )}
</div>
```

### Preserved
- All `console.log` statements
- All existing `<a>`, `<MapPin>`, and `<span>` styles from previous fixes
- All other component logic

### Checklist
- ✅ Only `ContactHistory.tsx` touched
- ✅ `style={{ paddingRight: 8 }}` added to the `flex-1 min-w-0` div
- ✅ No other changes
- ✅ All `console.log` preserved

