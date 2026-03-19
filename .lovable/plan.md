

## Fix: Auto-focus search input and add CSS containment to prevent keyboard flicker

### What and Why
The one-frame flicker when tapping the contact search input is a browser paint/layout issue during keyboard appearance. Two changes fix it: (1) auto-focus the search input so the keyboard opens with the sheet animation, and (2) CSS containment to prevent browser reflow.

### Changes

**File: `src/components/LogStep1.tsx`**
- Add `autoFocusSearch?: boolean` to `LogStep1Props` interface (line 26-48)
- Accept it in the component destructuring (line 50-71)
- Add a `useEffect` that calls `searchInputRef.current?.focus()` synchronously on mount when `autoFocusSearch` is true — no setTimeout, no requestAnimationFrame
- Do NOT use the HTML `autoFocus` attribute

**File: `src/components/LogInteractionSheet.tsx`**
- Pass `autoFocusSearch={!isContactPrefilled}` to the `<LogStep1>` component so it only auto-focuses in the FAB flow

**File: `src/components/ui/drawer.tsx`**
- On the `DrawerPrimitive.Content` element inside `DrawerContent`, add `contain: 'layout size style'` to the existing inline `style` object
- This prevents the browser from reflowing the sheet when the viewport resizes during keyboard open/close

### What stays untouched
- Vaul drawer library usage, open/close logic, animation
- Today card entry point behavior
- Note area / mic CTA visibility logic
- `interactive-widget=overlays-content` meta tag
- No new dependencies

