

## Add expandable note in FollowupCard "Previously" section

### What changes

**`src/components/FollowupCard.tsx`** (only file touched)

1. **New state**: Add `const [isNoteExpanded, setIsNoteExpanded] = useState(false);` alongside the existing `expanded` state.

2. **Make the Previously section tappable** (lines 334-378): Wrap the outer `<div>` with an `onClick` handler and `cursor: pointer` — but only when `lastInteraction?.note` exists. When there is no note, no click handler and default cursor.

   - The `onClick` calls `e.stopPropagation()` then toggles `isNoteExpanded`.

3. **Conditionally clamp the note** (lines 362-376): When `isNoteExpanded` is false, keep the existing 2-line clamp styles (`display: "-webkit-box"`, `WebkitLineClamp: 2`, `WebkitBoxOrient: "vertical"`, `overflow: "hidden"`). When `isNoteExpanded` is true, remove those four properties so the full note renders.

4. No chevron, no new colors, no new design values. All existing `console.log` statements preserved.

### Technical detail

```tsx
// New state (next to existing `expanded`)
const [isNoteExpanded, setIsNoteExpanded] = useState(false);

// Previously section wrapper gets conditional tap:
<div
  onClick={lastInteraction?.note ? (e) => {
    e.stopPropagation();
    setIsNoteExpanded(prev => !prev);
  } : undefined}
  style={{
    ...existingStyles,
    cursor: lastInteraction?.note ? "pointer" : "default",
  }}
>

// Note paragraph — conditional clamp:
<p style={{
  fontWeight: 400,
  fontSize: "14px",
  color: "#717171",
  lineHeight: "normal",
  fontFamily: "var(--font-body)",
  margin: 0,
  ...(isNoteExpanded ? {} : {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  }),
}}>
```

