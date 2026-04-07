

## Two small tweaks — Pencil color + useEffect reset

### Files changed: 2

---

### 1. `src/pages/ContactHistory.tsx`

**Line 545** (featured card Pencil): change `color: "#c8622a"` → `color: "#999"`.

**Line 770** (timeline row Pencil): change `color: "#c8622a"` → `color: "#999"`.

No other changes.

---

### 2. `src/components/InlineInteractionEdit.tsx`

**Line 1**: add `useEffect` to the React import.

**After state declarations**: add:
```ts
useEffect(() => {
  setEditDate(interaction.connect_date);
  setEditType(interaction.connect_type);
  setEditNote(interaction.note ?? '');
}, [interaction.id]);
```

No other changes. All existing console.log statements preserved.

