

## Update card borders and revert ContactFollowupCard to shadow

### Changes

**1. ContactFollowupCard.tsx (line 99)**
- Remove `border: "1px solid hsl(var(--border))"` 
- Add `boxShadow: "0 1px 5px rgba(0,0,0,.06)"` (matches the Last Interaction card style)

**2. FollowupCard.tsx (line 135)**
- Change `border: "1px solid hsl(var(--border))"` → `border: "1px solid #CBCBCB"`

**3. FollowupCard.tsx — "Previously" section border-top (line 337)**
- Change `borderTop: "1px solid #ede9e3"` → `borderTop: "1px solid #CBCBCB"`

**4. ContactHistory.tsx — timeline dividers (line 549)**
- Change `borderBottom: "1px solid #e8e4de"` → `borderBottom: "1px solid #CBCBCB"`

### Files touched
- `src/components/ContactFollowupCard.tsx`
- `src/components/FollowupCard.tsx`
- `src/pages/ContactHistory.tsx`

All existing console.log statements preserved.

