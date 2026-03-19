

## Fix: Make 95vh height actually apply for non-prefilled sheets

### Problem
`DrawerContent` hardcodes `maxHeight` to `vvHeight * 0.9` via inline style (line 77/90 of drawer.tsx). Inline styles override CSS classes, so `max-h-[95vh]` from LogInteractionSheet is ignored. The sheet is always capped at 90%.

### Plan

**File: `src/components/ui/drawer.tsx`**
- Add an optional `maxHeightRatio` prop to `DrawerContent` (default `0.9`)
- Use it instead of hardcoded `0.9`: `maxHeight: ${vvHeight * maxHeightRatio}px`

**File: `src/components/LogInteractionSheet.tsx`**
- Pass `maxHeightRatio={0.95}` when `!isContactPrefilled`, otherwise omit or pass `0.9`
- Remove the now-redundant `max-h-[95vh]` / `max-h-[90vh]` className logic
- Add temporary diagnostic log on open:
  ```
  console.log('[LogSheet] sheet height:', 
    document.querySelector('[data-vaul-drawer]')?.getBoundingClientRect().height, 
    'viewport:', window.innerHeight)
  ```

### Technical Detail
- `DrawerContent` will accept `maxHeightRatio` via a custom prop, filtering it out before passing to Vaul's Content primitive
- Vaul's `snapPoints={[0.95]}` remains for the non-prefilled case to ensure the drawer opens tall immediately

