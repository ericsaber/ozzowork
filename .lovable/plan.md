

## Fix: Remove focus border on X button in LastInteractionSheet

**File:** `src/components/LastInteractionSheet.tsx`

Add `outline: "none"` to the X button's inline style (line 84) to remove the browser default focus ring.

```tsx
style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, outline: "none" }}
```

One-line change, no other files affected.

