

## Fix date pill in InlineInteractionEdit.tsx

Two one-line changes to slice `connect_date` to 10 characters (`yyyy-MM-dd`) before storing in `editDate` state:

1. **Line ~36 (useState initializer):** `useState(interaction.connect_date)` → `useState(interaction.connect_date.slice(0, 10))`
2. **Line ~41 (useEffect setter):** `setEditDate(interaction.connect_date)` → `setEditDate(interaction.connect_date.slice(0, 10))`

No other changes.

