

## Remove borders, add drop shadow to all cards; update Previously border color

All follow-up cards (FollowupCard, ContactFollowupCard) and the "Coming Up" summary card will use the same shadow-only style. The "Previously" section keeps its top border but changes color.

### Changes

**1. FollowupCard.tsx (line 135)**
- Remove `border: "1px solid #CBCBCB"`
- Add `boxShadow: "0 1px 5px rgba(0,0,0,.06)"`

**2. FollowupCard.tsx (line 337)**
- Change `borderTop: "1px solid #CBCBCB"` → `borderTop: "1px solid #EDE9E3"`

**3. Today.tsx — empty "Coming Up" card (line 157)**
- Remove `border border-border` classes
- Add inline style `boxShadow: "0 1px 5px rgba(0,0,0,.06)"`

**4. Today.tsx — populated "Coming Up" button (line 175)**
- Remove `border border-border` classes
- Add inline style `boxShadow: "0 1px 5px rgba(0,0,0,.06)"`

**5. ContactFollowupCard.tsx** — already shadow-only, no changes needed.

### Files touched
- `src/components/FollowupCard.tsx`
- `src/pages/Today.tsx`

