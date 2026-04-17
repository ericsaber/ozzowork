

## Plan: Replace Vaul with custom fullscreen takeover (Step 1 of 4) — REVISED

### Files touched (three)
1. **`src/components/FullscreenTakeover.tsx`** — NEW shared component
2. **`src/components/LogInteractionSheet.tsx`** — swap Drawer for FullscreenTakeover
3. **`src/components/CompleteFollowupSheet.tsx`** — swap Drawer for FullscreenTakeover

### Files explicitly NOT touched
`EditInteractionSheet.tsx`, `LastInteractionSheet.tsx`, `FollowupCard.tsx`, `src/components/ui/drawer.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/alert-dialog.tsx`, `package.json`.

### Vaul status (unchanged from prior plan)
- `src/components/ui/sheet.tsx` uses `@radix-ui/react-dialog` — does NOT use vaul.
- `src/components/ui/drawer.tsx` uses vaul; `EditInteractionSheet.tsx` (forbidden to touch) imports from it.
- **Decision:** `package.json` not touched. Vaul stays installed.

### Adjustment 1 — Extract to shared component

Create `src/components/FullscreenTakeover.tsx` exporting a single `FullscreenTakeover` component with this interface:

```tsx
interface FullscreenTakeoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}
```

Implementation (identical to prior plan, now in one shared file):
- Fixed-position backdrop (`z-49`, `rgba(0,0,0,0.4)`, click → close).
- Fixed-position sheet (`z-50`, `inset:0`, `height:100dvh`, `background:#f0ede8`).
- Flex column layout, `paddingTop`/`paddingBottom` from `env(safe-area-inset-*)`.
- CSS transitions: `opacity 300ms ease, transform 380ms cubic-bezier(0.32, 0.72, 0, 1)`.
- Open: `opacity:1, translateY(0)`. Closed: `opacity:0, translateY(100%)`.
- Mount-on-open / delayed-unmount (400ms) so closed state doesn't intercept touches; `visibility:hidden` while transitioning out.
- Close (×) button top-right (Lucide `X`, `#666`), fade in with `transition-delay: 250ms` on appear, no delay on disappear.
- `visualViewport` resize listener writes pixel height to a `containerRef` so the soft keyboard shrinks the sheet.

Both target files import:
```tsx
import FullscreenTakeover from "@/components/FullscreenTakeover";
```

Future tweaks land in one place.

### Adjustment 2 — AlertDialog z-index above the sheet

**Verified:** shadcn `AlertDialogOverlay` and `AlertDialogContent` both use `z-50` (see `src/components/ui/alert-dialog.tsx` lines 19, 37). Our fullscreen sheet is also `z-50`. Equal z-index relies on DOM insertion order, which is fragile (Radix portals to `document.body`; the sheet is rendered inside the React tree, also typically at body level via fixed positioning — order is not guaranteed).

**Fix:** in `LogInteractionSheet.tsx` only, pass an explicit class on the two `<AlertDialogContent>` and (where applicable) `<AlertDialogOverlay>` instances to bump them above the sheet:

```tsx
<AlertDialogContent className="z-[60]">
```

For the overlay, since shadcn's `AlertDialogContent` internally renders its own `AlertDialogOverlay` without exposing a prop, we override via the content className alongside a sibling-overlay approach: simplest is to bump `AlertDialogContent` to `z-[60]` and accept the dimmed overlay at `z-50` (the sheet's `#f0ede8` background already fully covers everything — the dialog appearing above it with a translucent overlay only between dialog and sheet looks correct).

If visual QA after implementation shows the overlay sitting under the sheet awkwardly, the follow-up fix is a one-line override on `AlertDialogOverlay` usage. For Step 1 we apply only the content z-bump.

**Concretely:** the two `<AlertDialogContent>` usages in `LogInteractionSheet.tsx` (discard-confirm and cancel-confirm dialogs) get `className="z-[60]"` added. No other AlertDialog call sites are changed. `src/components/ui/alert-dialog.tsx` is not modified.

### Inner content layout (unchanged from prior plan)

In both target files, the existing single inner `<div className="overflow-y-auto px-5 pb-6">` becomes the scrollable flex child:
```tsx
<div className="px-5 pb-6" style={{ flex: 1, overflowY: 'auto' }}>
  {/* existing children unchanged */}
</div>
```

### Wiring summary
- `LogInteractionSheet.tsx`: replace `<Drawer …><DrawerContent …>…</DrawerContent></Drawer>` with `<FullscreenTakeover open={open} onOpenChange={handleOpen}>…</FullscreenTakeover>`. Drop `snapPoints`, `maxHeightRatio`, and contact-prefilled height variants. Move `onContextMenu` to the inner scroll div. Add `className="z-[60]"` to the two `<AlertDialogContent>` instances.
- `CompleteFollowupSheet.tsx`: same Drawer → FullscreenTakeover swap. `<CelebrationHeader>` and `<StepIndicator>` remain as direct children inside the takeover.

### Preserved exactly
- All props interfaces (`LogInteractionSheetProps`, `CompleteFollowupSheetProps`).
- All state, mutations, queries, callbacks.
- All `console.log` statements.
- All child components and inner classNames.

### Checklist confirmation
1. ✅ Vaul JSX fully removed from both target files.
2. ✅ Files touched: the two targets + new `FullscreenTakeover.tsx`. `package.json` not touched.
3. ✅ `src/components/ui/sheet.tsx` uses `@radix-ui/react-dialog`; vaul stays for `EditInteractionSheet.tsx`.
4. ✅ `LastInteractionSheet.tsx` and `FollowupCard.tsx` not modified.
5. ✅ Props interfaces unchanged.
6. ✅ `visualViewport` listener present (in shared `FullscreenTakeover`).
7. ✅ `EditInteractionSheet.tsx` not modified.
8. ✅ AlertDialog z-index addressed: shadcn defaults are `z-50` (equal to sheet); plan adds explicit `z-[60]` on the two `AlertDialogContent` instances in `LogInteractionSheet.tsx`.

