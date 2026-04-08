

## Three Bug Fixes — Expand, Date Parsing, Query Invalidation

### 1. ContactHistory.tsx — expandable notes

**New state** (after existing state declarations ~line 60):
```ts
const [expandedInteractionId, setExpandedInteractionId] = useState<string | null>(null);
const [featuredExpanded, setFeaturedExpanded] = useState(false);
```

**Featured card (lines ~515-519):** Add `onClick` and `cursor: pointer` to the outer card div when a note exists. On the note `<p>` at line 542, toggle `line-clamp-2` based on `featuredExpanded`. The click handler on the div toggles `setFeaturedExpanded(prev => !prev)`.

**History interaction rows (line ~750 area):** Same pattern — add `onClick={() => setExpandedInteractionId(prev => prev === record.id ? null : record.id)}` and `cursor: pointer` (when note exists) to the row div. On the note `<p>` at line 767, use `expandedInteractionId === record.id ? "" : "line-clamp-2"`.

Both locations: only add cursor/onClick when `record.note?.trim()` exists. The Pencil icon click already has `e.stopPropagation()` so it won't conflict.

### 2. LastInteractionSheet.tsx — fix date parsing

- Add `parseDate` helper at top of file (same as ContactHistory)
- Replace `format(parseISO(interaction.date), ...)` with `format(parseDate(interaction.date), ...)`
- Remove `parseISO` from the import since it's the only usage

### 3. InlineInteractionEdit.tsx — invalidate last-interaction query

In `handleSave` (after line 62), add:
```ts
queryClient.invalidateQueries({ queryKey: ["last-interaction", interaction.contact_id] });
```

Also add the same line in `handleDelete` (after line 74) for consistency.

### Files touched
- `src/pages/ContactHistory.tsx`
- `src/components/LastInteractionSheet.tsx`
- `src/components/InlineInteractionEdit.tsx`

