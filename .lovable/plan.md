

## Inline Interaction Edit — New Component + ContactHistory Wiring

### Files changed: 2

---

### 1. New file: `src/components/InlineInteractionEdit.tsx`

Exactly as described in the previous plan — no changes to the component spec itself. Self-contained edit card with DATE (calendar, today-or-past only), TYPE (pill buttons), NOTE (textarea), Trash2 delete with AlertDialog, Cancel/Save buttons. Save updates `interactions`, invalidates `["interactions", contact_id]`, calls `onClose()`. Delete likewise.

---

### 2. `src/pages/ContactHistory.tsx`

**New state**: `editingInteractionId: string | null` (default `null`).

**New import**: `InlineInteractionEdit`, `Pencil` from lucide-react, `useState`.

**Featured "Last Interaction" card** (lines 507–534):

The outer wrapper (`<div className="w-full flex gap-3 bg-white rounded-xl p-3 ..." style={{ boxShadow }}>`) and the section label above it **stay in place**. Only the inner content changes:

- When **not editing**: replace the TODO comment (line 533) with a `Pencil` icon (size 14, `color: "#c8622a"`, `cursor: pointer`, `flexShrink: 0`). `onClick`: `(e) => { e.stopPropagation(); setEditingInteractionId(record.id); }`.
- When `editingInteractionId === record.id`: replace the children inside the outer `rounded-xl` div (the icon box, text div, and pencil — lines 511–533) with `<InlineInteractionEdit interaction={record} onClose={() => setEditingInteractionId(null)} />`. The outer div keeps its `bg-white rounded-xl` and `boxShadow` but drops the `flex gap-3 p-3 items-center` classes (swap to just `p-0` or remove padding so InlineInteractionEdit controls its own spacing).

**Interaction timeline rows** (line 747 TODO): same pattern — Pencil icon when not editing, `InlineInteractionEdit` replacing inner content when editing. The outer timeline row wrapper stays.

**Only one interaction editable at a time** — single `editingInteractionId` string handles this.

---

### 3. No other files touched. All existing console.log statements preserved.

