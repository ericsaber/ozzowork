

## Redesign: Today Screen and Complete Flow

### Overview

Rebuild the Today screen with three distinct sections (Overdue, Due Today, Coming Up strip) and replace the current simple "mark complete" with an animated card + bottom sheet workflow.

### Data Layer Changes

**Today.tsx query** — expand to also fetch items with `follow_up_date` within the current week (not just `<= today`). Split results into three buckets:
- `overdue`: `follow_up_date < today`
- `dueToday`: `follow_up_date == today`
- `comingThisWeek`: `follow_up_date > today AND <= end of week`

Keep the existing deduplication by contact_id within each bucket. Pass `interactionType` (the `type` field) to each card for the completion sheet default text.

### Today Screen Layout

```text
┌─────────────────────────┐
│ Today                   │
│ Wednesday, March 4      │
│                         │
│ ▸ OVERDUE (red label)   │
│ ┌─ red border ─────────┐│
│ │ ○  Name  Company [!] ││
│ │    2-line note...     ││
│ └───────────────────────┘│
│                         │
│ ▸ DUE TODAY (label)     │
│ ┌─ green border ────────┐│
│ │ ○  Name  Company [✓] ││
│ │    2-line note...     ││
│ └───────────────────────┘│
│                         │
│ ┌ light bg strip ───────┐│
│ │  5 more this week  →  ││
│ └───────────────────────┘│
└─────────────────────────┘
```

- **Overdue section**: red `OVERDUE` label, each card gets `border-l-[3px] border-l-[#d94f2e]`
- **Due Today section**: cards get `border-l-[3px] border-l-[#4a9e4a]`
- **Coming Up strip**: compact row with secondary background, count + arrow, taps to a future view (or just scrolls/navigates to a dedicated page later — for now links to `/upcoming`)
- Empty state preserved when all three are empty

### Card Component (FollowupCard) Redesign

Each card shows:
- Tappable check circle on the left (triggers completion flow)
- Contact name (bold), company (muted), badge (Overdue red / Today green)
- 2-line truncated note (`line-clamp-2`)
- Clicking the card body navigates to `/followup/:id`

New props: `interactionType: string`, `onComplete: (item) => void` — the parent manages the bottom sheet state.

### Completion Animation + Bottom Sheet

New component: `CompleteFollowupSheet.tsx` using vaul `Drawer` (already installed).

**Flow:**
1. User taps check circle → parent sets card as "completing" (card gets `line-through`, `opacity-50`, checkmark icon, brief 600ms animation)
2. After animation, bottom sheet opens with:
   - Drag handle (built into vaul)
   - Title: "Logged ✓"
   - Subtitle: "Add a note and set your next follow-up with **[contact name]**."
   - Pre-filled textarea: `"Completed: [interaction type]"` (editable)
   - Date chips row: Tomorrow, 3 days, 1 week, 2 weeks (reuse same style as LogInteraction)
   - Primary CTA button: "Save" by default, changes to "Save & set reminder" when a chip is selected
3. On save:
   - Clear `follow_up_date` on the original interaction (marks it done)
   - Insert a new interaction with the note text and `type: "note"`
   - If a date chip was selected, also set `follow_up_date` on the new interaction
   - Invalidate queries, dismiss sheet, card fully removed from list

### Routing

Add a placeholder `/upcoming` route (simple page listing items with `follow_up_date > today`) for the "Coming up" strip link.

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/pages/Today.tsx` | Rewrite — three-section layout, manage completion state, render sheet |
| `src/components/FollowupCard.tsx` | Redesign — colored left border, 2-line note, badge, completion animation state |
| `src/components/CompleteFollowupSheet.tsx` | Create — vaul Drawer with note, date chips, save logic |
| `src/pages/Upcoming.tsx` | Create — simple list of future follow-ups |
| `src/App.tsx` | Add `/upcoming` route |

### Technical Details

- Use vaul `Drawer` (already in project) for the bottom sheet — it provides the native iOS-style drag handle and slide-up behavior
- Card animation: CSS transition on opacity + transform + line-through on a `data-completing` attribute, controlled via useState in Today.tsx
- The sheet's save mutation: two DB operations (update old interaction + insert new one) wrapped in a single mutationFn
- Date chips array reused from LogInteraction pattern
- `endOfWeek` from date-fns used to calculate the "coming this week" window

