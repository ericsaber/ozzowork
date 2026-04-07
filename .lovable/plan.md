

## InlineInteractionEdit.tsx — two targeted fixes

### 1. Expand useEffect dependency array (line ~43)
Change `[interaction.id]` → `[interaction.id, interaction.connect_date, interaction.connect_type, interaction.note]` so local edit state resets whenever the parent data changes after a refetch.

### 2. Revert setTimeout in handleSave (line ~63)
Replace `setTimeout(() => onClose(), 100)` with `onClose()`.

No other changes. All `console.log` statements preserved.

