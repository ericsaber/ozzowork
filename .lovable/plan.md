

## Unify card border color to use `border-border` (the darker value)

The "Coming Up" card uses Tailwind's `border-border` class (~`#ddd8cf`). The FollowupCard and ContactFollowupCard hardcode `#e8e4de` (lighter). You want the darker color everywhere.

### Changes

**1. FollowupCard.tsx (line 135)**
- Change `border: "1px solid #e8e4de"` → `border: "1px solid hsl(36, 15%, 85%)"`
- Using the exact HSL from the `--border` CSS variable ensures they match.

**2. ContactFollowupCard.tsx (line 99)**
- Same change: `border: "1px solid #e8e4de"` → `border: "1px solid hsl(36, 15%, 85%)"`

Alternatively, both could use `var(--border)` via the CSS variable to stay in sync with the theme. Since the inline style uses a full border shorthand, the value would be `border: "1px solid hsl(var(--border))"`.

### Files touched
- `src/components/FollowupCard.tsx`
- `src/components/ContactFollowupCard.tsx`

All console.log statements preserved. No other files changed.

