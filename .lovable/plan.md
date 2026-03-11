

## Plan: Data Model Remapping — Split `type`, Add `connect_type`, Update Enum Values

### Step 1 — Database Migration

A single migration that:

1. **Renames** `interactions.type` → `interactions.planned_follow_up_type`
2. **Adds** `interactions.connect_type` column (text, nullable, no default) — same allowed values
3. **Updates** any rows with `type = 'note'` → `'text'` in the renamed column (since "Note" is being removed as a type option)

No check constraints or enums will be used at the DB level — both fields remain `text` columns, matching the current pattern. The valid values (`call`, `email`, `voicemail`, `text`, `meet`, `video`) will be enforced in application code.

### Step 2 — Update All Code References

Every file that reads/writes the old `type` field needs updating:

| File | Change |
|------|--------|
| `src/types/index.ts` | Update `Interaction` interface: rename `type` → `planned_follow_up_type`, add `connect_type` |
| `src/pages/LogInteraction.tsx` | Update `typeOptions` (remove "note", add "text", "meet", "video"). Insert uses `planned_follow_up_type` for follow-up type and `connect_type` for how they connected. Currently this page uses a single `type` selector — it will write to **both** new fields with the same value for now (no UI changes). |
| `src/pages/Today.tsx` | Change `item.type` → `item.planned_follow_up_type` for the follow-up card icon, and pass `item.connect_type` as a separate prop |
| `src/components/FollowupCard.tsx` | `interactionType` prop already drives the icon — no rename needed, just ensure caller passes `planned_follow_up_type` |
| `src/components/CompleteFollowupSheet.tsx` | Update insert to use `planned_follow_up_type` and `connect_type` instead of `type` |
| `src/components/InteractionItem.tsx` | Change `type` prop references to use the correct field (this component shows history, so it should use `connect_type` for the icon) |
| `src/components/EditInteractionDialog.tsx` | Update to read/write both `planned_follow_up_type` and `connect_type`. Update `typeOptions` enum values. |
| `src/pages/FollowupTask.tsx` | Change `interaction.type` → `interaction.planned_follow_up_type` for icons/labels. Update `typeIcons`/`typeLabels` maps. |
| `src/pages/ContactHistory.tsx` | Update `type` prop passed to `InteractionItem` to use `connect_type` |

### Step 3 — Confirm `note` Field

The `note` column stays as-is in the DB. No rename needed — it's already correctly named `note` and used as the interaction note / AI summary field throughout the app.

### Step 4 — Interaction Count per Contact

Add a **database function** `get_interaction_count(contact_uuid)` that returns the count. This is cleaner than a view for this use case and can be called via `.rpc()`:

```sql
CREATE OR REPLACE FUNCTION public.get_interaction_count(_contact_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.interactions
  WHERE contact_id = _contact_id;
$$;
```

Alternatively, a simpler approach: just use a `.select('id', { count: 'exact' })` query in the frontend where needed — no DB function required. Given this will be used in the next prompt for conditional UI, **a simple count query in the component** is the most pragmatic approach and avoids adding unnecessary DB functions.

### Summary of Changes

- **1 migration**: rename column, add column, update stale data
- **8 source files** updated (field references only, no UI/layout changes)
- **No new DB function** for counts — will use Supabase's built-in count query
- **`note` field**: confirmed correct, no changes needed

