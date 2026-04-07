

## Today Card + Upcoming Card Redesign (revised v2)

### Key correction from previous plan

The `variant="upcoming"` no longer drives any structural differences. All cards — today, overdue, upcoming — render identically: name row with history icon + three-dot menu, action subframe with "Log it" button, reminder row. The variant prop only determines which color tokens to apply.

### Files touched

1. **`src/components/FollowupCard.tsx`** — restructure
2. **`src/components/LastInteractionSheet.tsx`** — new file
3. **`src/pages/Today.tsx`** — new batched query + history sheet state
4. **`src/pages/Upcoming.tsx`** — add batched interactions query + history sheet (mirrors Today.tsx pattern)

### 1. FollowupCard.tsx

**Remove**: the `expanded` state, `isNoteExpanded` state, the entire Previously section (lines 334-388), the `ChevronDown` import, and all `isUpcoming` branching logic for the chevron vs dots menu.

**Remove**: the `lastInteraction` prop entirely — the card no longer renders last interaction data inline.

**Add new props**:
- `hasInteractions?: boolean`
- `onHistoryTap?: () => void`

**Name row right side** (same for all variants):
- Lucide `History` icon: size 15, `opacity: 0.4`, bare (no bg/border). Only renders when `hasInteractions` is true. `onClick` calls `onHistoryTap`.
- Three-dot menu (`MoreVertical`): always renders, with Edit and Cancel items. Gap between history icon and dots: `10px`.

**Card onClick**: always navigates to contact record (remove the upcoming expand/collapse branch).

**Variant prop**: kept, but only drives `tokens` color selection. No structural branching.

**Action button**: "Log it" label (already in place). `onComplete` opens `CompleteFollowupSheet` (already wired).

**Bottom padding**: always `16px` (no Previously section to adjust for).

### 2. LastInteractionSheet.tsx (new)

Bottom sheet using existing `Sheet` component (`side="bottom"`).

Props: `open`, `onOpenChange`, `contactId`, `contactName`.

Queries `interactions` table for most recent published row for the contact (`order by connect_date desc limit 1`). Fallback: `follow_ups` where `status = 'completed'` and `connect_type IS NOT NULL`, ordered by `completed_at desc limit 1`.

Layout:
- Drag handle (centered, 40px wide, 4px tall, rounded, `#ddd`)
- Header: "Last interaction" (16px, weight 600) + X button top-right
- Subtitle: contact name, `#777`, 14px
- Body: type icon in 32px rounded-lg `bg-secondary` + verb + date (`MMM d, yyyy`) + italic note if present
- Footer: "View full history →" in `#c8622a`, navigates to `/contact/${contactId}`

### 3. Today.tsx

Add a batched query for interaction existence:

```ts
const { data: contactsWithInteractions } = useQuery({
  queryKey: ["contacts-with-interactions", contactIds],
  queryFn: async () => {
    if (contactIds.length === 0) return [];
    const { data, error } = await supabase
      .from("interactions")
      .select("contact_id")
      .in("contact_id", contactIds)
      .eq("status", "published")
      .limit(1000);
    if (error) throw error;
    return [...new Set(data.map((r: any) => r.contact_id))];
  },
  enabled: contactIds.length > 0,
});
const hasInteractionsSet = new Set(contactsWithInteractions || []);
```

Add `historyTarget` state (`{ contactId, contactName } | null`). Pass `hasInteractions` and `onHistoryTap` to each `FollowupCard`. Render `<LastInteractionSheet>` controlled by `historyTarget`.

Remove `lastInteraction` prop from card calls (no longer needed).

### 4. Upcoming.tsx

Mirror Today.tsx exactly:
- Add the same batched `contacts-with-interactions` query
- Add `historyTarget` state
- Pass `hasInteractions` and `onHistoryTap` to each `FollowupCard`
- Render `<LastInteractionSheet>` at page bottom
- Remove `lastInteraction` prop from card calls
- Cards use `variant="upcoming"` for color only — structure is identical to today/overdue

### What does NOT change

- `ContactFollowupCard.tsx` — untouched
- `CompleteFollowupSheet` / `EditFollowupSheet` / log flows — untouched
- Section labels (OVERDUE, DUE TODAY, COMING UP) — untouched
- All existing `console.log` statements preserved

