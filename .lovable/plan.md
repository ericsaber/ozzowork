

## Scroll container ref for keyboard fix

### Files changed: 3

---

### 1. Today.tsx

- Add `useRef` to the import from React.
- Create `const scrollContainerRef = useRef<HTMLDivElement>(null);`
- Attach `ref={scrollContainerRef}` to the outermost `<div>` (line 199, the `min-h-screen pb-24 px-8 pt-6` div).
- Pass `scrollContainerRef={scrollContainerRef}` to each `<FollowupCard>` in `renderCard`.

### 2. Upcoming.tsx

- Add `useRef` to the import from React.
- Create `const scrollContainerRef = useRef<HTMLDivElement>(null);`
- Attach `ref={scrollContainerRef}` to the outermost `<div>` (line 108).
- Pass `scrollContainerRef={scrollContainerRef}` to each `<FollowupCard>`.

### 3. FollowupCard.tsx

- Add `React.RefObject` import (already has React in scope).
- Add to `FollowupCardProps`: `scrollContainerRef?: React.RefObject<HTMLDivElement>;`
- Destructure `scrollContainerRef` in the component params.
- Replace the `onFocus` handler on the reminder input (lines 315–330) with the provided handler that uses `scrollContainerRef?.current` for container-relative scroll calculation with 24px breathing room and 350ms delay.

### No other files touched. All console.log statements preserved.

