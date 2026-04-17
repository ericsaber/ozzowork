

## Plan: Close animation fixes for Upcoming + FAB

**Files:** `src/pages/Upcoming.tsx`, `src/components/FullscreenTakeover.tsx`

### Issue 1 — Upcoming.tsx (always-mounted CompleteFollowupSheet)

Same fix already applied to `Today.tsx`. Remove the `{completeTarget && (...)}` wrapper and keep `<CompleteFollowupSheet>` always mounted with optional chaining on the four target-derived props:

```tsx
<CompleteFollowupSheet
  open={!!completeTarget}
  onOpenChange={(o) => { if (!o) setCompleteTarget(null); }}
  followUpId={completeTarget?.followUpId ?? ""}
  contactId={completeTarget?.contactId ?? ""}
  contactName={completeTarget?.contactName ?? ""}
  plannedType={completeTarget?.plannedType ?? null}
  userId=""
/>
```

### Issue 2 — FullscreenTakeover.tsx (asymmetric open/close timing)

Make the sheet transition string conditional on `visible` so open stays snappy and close glides:

```tsx
transition: visible
  ? "opacity 300ms ease, transform 420ms cubic-bezier(0.32, 0.72, 0, 1)"
  : "opacity 250ms ease, transform 550ms cubic-bezier(0.4, 0, 0.2, 1)",
```

Bump the unmount timeout from 420ms to 560ms so the sheet stays mounted through the longer close transition:

```tsx
const t = setTimeout(() => setMounted(false), 560);
```

Backdrop transition (200ms ease) and close-button fade (200ms with 250ms delay) stay as-is.

### Preserved
- All `console.log` statements
- visualViewport listener, double-rAF open trick, `visibility: hidden` guard
- All other state/handlers/mutations

### Checklist
- ✅ Only `Upcoming.tsx` and `FullscreenTakeover.tsx` touched
- ✅ Upcoming: conditional wrapper removed, `?.` + `??` on all four props
- ✅ Transition string is conditional on `visible`, close = 550ms
- ✅ Unmount timeout bumped to 560ms
- ✅ All `console.log` preserved

