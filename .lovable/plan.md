

## Plan: Direction-aware close animation for FullscreenTakeover

**File:** `src/components/FullscreenTakeover.tsx` only.

### Changes

**1. Sheet — slide only on close (no fade)**

Replace the current sheet opacity + transition:

```tsx
opacity: 1,  // always opaque — no fade on either direction
transform: visible ? "translateY(0)" : "translateY(100%)",
transition: visible
  ? "opacity 300ms ease, transform 420ms cubic-bezier(0.32, 0.72, 0, 1)"
  : "transform 480ms cubic-bezier(0.4, 0, 1, 1)",
```

The ease-in curve `cubic-bezier(0.4, 0, 1, 1)` accelerates downward — feels like gravity rather than a uniform slide.

**2. Backdrop — sync close duration to sheet**

```tsx
opacity: visible ? 1 : 0,
transition: visible ? "opacity 200ms ease" : "opacity 480ms ease",
pointerEvents: visible ? "auto" : "none",
```

Backdrop dims gradually alongside the sliding sheet so they finish together — no flash of the page underneath.

**3. Close button — unchanged**

The 200ms fade with 250ms delay stays as-is.

**4. Unmount timeout — unchanged**

Stays at 560ms (current value), which comfortably exceeds the 480ms close transition.

### Preserved
- All `console.log` statements
- `mounted` / `visible` state machine, double-rAF open trick, `visibility: hidden` guard
- visualViewport resize listener
- Backdrop `onPointerDown` close handler

### Checklist
- ✅ Only `FullscreenTakeover.tsx` touched
- ✅ Sheet opacity is `1` in both states — no fade on close
- ✅ Sheet transition conditional on `visible` (spring open, ease-in close)
- ✅ Backdrop transition conditional on `visible` (200ms open, 480ms close)
- ✅ Unmount timeout stays at 560ms
- ✅ All `console.log` preserved

