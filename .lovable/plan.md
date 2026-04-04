

## Plan: Wire three-dot menu on FollowupCard

### What changes

**File 1: `src/components/FollowupCard.tsx`**
- Add 4 new optional props: `onEdit`, `onCancel`, `menuOpen`, `onMenuOpenChange`
- Import `DropdownMenu` components from shadcn, plus `MoreVertical`, `Pencil`, `X` from lucide-react
- Replace the current inline SVG dots (lines 144-160) with a `DropdownMenu` containing "Edit follow-up" and "Cancel follow-up" items
- Keep the `ChevronDown` for upcoming cards unchanged

**File 2: `src/pages/Today.tsx`**
- Add state: `editTarget`, `cancelTarget`, `openMenuId`, `showCancelDialog`
- Import `EditFollowupSheet`, `AlertDialog` components, `useMutation`
- Add `cancelFollowUpMutation` that sets status='cancelled' and completed_at, then invalidates queries
- Update `renderCard` to pass `menuOpen`, `onMenuOpenChange`, `onEdit`, `onCancel` props
- Render `EditFollowupSheet` when `editTarget` is set
- Render `AlertDialog` with three buttons per spec: "Cancel and log what happened" (TODO: routes to log flow, for now just cancels), "Yes, cancel" (immediate cancel), "Don't cancel" (dismiss)

### Technical details

The dropdown uses controlled `open`/`onOpenChange` via `openMenuId` state so only one menu is open at a time. All click handlers call `e.stopPropagation()` to prevent card navigation. The cancel mutation invalidates `follow-ups-today`, `follow-ups`, and `follow-ups-active` query keys. The "Cancel and log what happened" option will cancel immediately with a TODO comment for the log-then-cancel routing.

