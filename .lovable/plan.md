

## Fix two bugs in InlineInteractionEdit.tsx

### File: `src/components/InlineInteractionEdit.tsx`

**Bug 1 — Timezone date shift (line ~129)**:
Replace `setEditDate(format(d, "yyyy-MM-dd"))` with `setEditDate(format(new Date(d.getFullYear(), d.getMonth(), d.getDate()), "yyyy-MM-dd"))`.

**Bug 2 — Calendar selection swallowed (line ~125)**:
On the `PopoverContent`, change `onClick={(e) => e.stopPropagation()}` to `onPointerDown={(e) => e.stopPropagation()}`.

No other changes.

