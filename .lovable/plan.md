

## Fix: Remove duplicate close button in LastInteractionSheet

The `SheetContent` component in `src/components/ui/sheet.tsx` renders a default `SheetPrimitive.Close` X button (small, top-right). `LastInteractionSheet.tsx` also renders its own larger X button in the header. Need to remove the small default one.

### Change

**`src/components/ui/sheet.tsx`** — The default close button is baked into `SheetContent`. To avoid affecting other sheets, add support for hiding it via a prop:

Add an optional `hideClose?: boolean` prop to `SheetContentProps`. When true, skip rendering the `SheetPrimitive.Close` element.

**`src/components/LastInteractionSheet.tsx`** — Pass `hideClose` to `SheetContent`.

