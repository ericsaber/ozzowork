

## Plan: Add `parseDate` helper and normalize all date parsing in ContactHistory.tsx + fix InlineInteractionEdit.tsx dependency

### 1. `src/pages/ContactHistory.tsx`

**Add helper** near top of file (after imports, before component):

```ts
const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  return new Date(dateStr.slice(0, 10) + 'T00:00:00');
};
```

**Replace all date-only field parsing** with `parseDate()`. The following lines change:

| Line | Current | Replacement |
|------|---------|-------------|
| 180 | `format(new Date(Math.min(...allInteractionDates)), "MMM d")` | No change (already a timestamp number) |
| 533 | `format(record.connect_date ? (record.connect_date.length === 10 ? new Date(record.connect_date + 'T00:00:00') : parseISO(record.connect_date)) : parseISO(record.created_at), "MMM d")` | `format(parseDate(record.connect_date \|\| record.created_at), "MMM d")` |
| 571 | `format(new Date(fu.planned_date + 'T00:00:00'), "MMM d")` | `format(parseDate(fu.planned_date), "MMM d")` |
| 573 | `format(parseISO(fu.created_at), "MMM d")` | No change (full timestamp, keep parseISO) |
| 595 | `format(new Date(edit.previous_due_date + 'T00:00:00'), "MMM d")` | `format(parseDate(edit.previous_due_date), "MMM d")` |
| 628 | `format(parseISO(fu.completed_at), "MMM d")` | No change (full timestamp, keep parseISO) |
| 641 | `format(fu.connect_date.length === 10 ? new Date(fu.connect_date + 'T00:00:00') : parseISO(fu.connect_date), "MMM d")` | `format(parseDate(fu.connect_date), "MMM d")` |
| 643 | `format(parseISO(fu.completed_at), "MMM d")` | No change (full timestamp, keep parseISO) |
| 758-761 | IIFE with `console.log` + complex ternary | Keep IIFE + console.log, simplify to `format(parseDate(record.connect_date \|\| record.created_at), "MMM d")` |

All `parseISO` calls on `created_at` and `completed_at` stay unchanged. All existing `console.log` statements preserved.

### 2. `src/components/InlineInteractionEdit.tsx`

**Line 43** — Change useEffect dependency array:

```ts
// From:
}, [interaction.id, interaction.connect_date, interaction.connect_type, interaction.note]);

// To:
}, [interaction.id, interaction.connect_date.slice(0, 10), interaction.connect_type, interaction.note]);
```

### 3. No other files touched

