

## Fix date display + UI update after save

### 1. `src/pages/ContactHistory.tsx` — two date-only parsing fixes

- **Line ~571** (`planned_date`): `parseISO(fu.planned_date)` → `new Date(fu.planned_date + 'T00:00:00')`
- **Line ~595** (`previous_due_date`): `parseISO(edit.previous_due_date)` → `new Date(edit.previous_due_date + 'T00:00:00')`

No other changes. `created_at`/`completed_at` stay as `parseISO`.

### 2. `src/components/InlineInteractionEdit.tsx` — delay onClose after save

In `handleSave`, replace the immediate `onClose()` call with `setTimeout(() => onClose(), 100)` so the invalidated query has time to refetch before the inline editor closes.

### 3. No other files touched

