

## Action Icon Tap Opens Native App

Three files modified: `FollowupCard.tsx`, `Today.tsx`, `Upcoming.tsx`.

### 1. `FollowupCard.tsx`

**Props** (lines 13-32): Add `contactPhone?: string | null` and `contactEmail?: string | null` to the interface.

**Destructure** (line 44-48): Add `contactPhone`, `contactEmail` to destructured props.

**Handler** (after line 50): Add `handleActionTap` function and `isActionable` const:
- `call`/`text` → `tel:`/`sms:` with `contactPhone`, fallback to navigate to contact record
- `email` → `mailto:` with `contactEmail`, fallback to navigate to contact record
- `meet`/`video` → no-op

**Action row left side** (lines 236-259): Wrap icon bubble + action label in a clickable `<div>` with `onClick={isActionable ? handleActionTap : undefined}` and `cursor` set conditionally.

### 2. `Today.tsx` — `renderCard` (line 123-148)

Add two props to the `FollowupCard` call:
- `contactPhone={item.contacts?.phone ?? null}`
- `contactEmail={item.contacts?.email ?? null}`

### 3. `Upcoming.tsx` — items.map (lines 114-139)

Add same two props:
- `contactPhone={item.contacts?.phone ?? null}`
- `contactEmail={item.contacts?.email ?? null}`

### Notes
- All existing `console.log` statements preserved
- No other files modified
- The `contacts` join already fetches `phone` and `email` in both pages' queries

