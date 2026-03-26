

## Ozzo Display Layer Simplification

Frontend-only. No data model or schema changes. All console.logs preserved. Four files modified.

---

### 1. ContactHistory.tsx — Clean history list

**Delete thread line infrastructure**
- Remove `rescheduleMap` (lines 76–82), `allFollowUpEdits` (line 146), entire `getThreadLine` function (lines 148–270)
- Remove thread line `<div>` from interaction rows (lines 529–531)
- Remove `rescheduleInfo` and `thread` variables from the render loop (lines 513–514)

**Build interleaved follow-up event rows**

After fetching `taskRecords`, construct an events array:

- **Scheduled**: For each coin with `planned_follow_up_date` where `follow_up_edits` is empty, emit `{ type: 'scheduled', date: coin.created_at, targetDate: coin.planned_follow_up_date }`
- **Rescheduled**: For each coin's `follow_up_edits` array (sorted by `changed_at` ascending), derive the "rescheduled to" date using chained logic:
  - Sort edits by `changed_at` ascending
  - For edit at index `i`: `newDate = edits[i+1]?.previous_due_date ?? coin.planned_follow_up_date`
  - Also emit a "scheduled" event using `edits[0].previous_due_date` as the original target date, with `date = coin.created_at`
  - Each edit → `{ type: 'rescheduled', date: edit.changed_at, newDate: <chained value> }`
- **Cancelled**: Each coin with `status === 'cancelled'` → `{ type: 'cancelled', date: coin.completed_at || coin.updated_at }`

Merge events with interaction rows (existing `historyRecords`), sort all by date descending.

**Render event rows** as non-tappable `<div>` (no chevron, no onClick):
- **Scheduled**: Clock icon, gray `#f0ede8` bg, "Follow-up scheduled for [formatted targetDate]"
- **Rescheduled**: Clock icon, gray bg, "Follow-up rescheduled to [formatted newDate]"
- **Cancelled**: X icon, color `#a32d2d` at 0.6 opacity, "Follow-up cancelled"
- All event rows: fontSize 12px, font-body, no special card styling — just the same row layout as interaction rows but without chevron

**First interaction row** gets accent icon background `#f5ede7` instead of `#f0ede8`. All others keep gray.

**Pass rescheduleCount** to `ContactFollowupCard`: `rescheduleCount={r.follow_up_edits?.length || 0}`

---

### 2. InteractionDetail.tsx — Three states

**State determination** (replaces current `isStandaloneLog`/`coinForFollowUp`/`coinHasActiveFollowUp`):
- `isActive`: `task.status === 'active' && task.planned_follow_up_date && !task.related_task_record_id`
- `isTailsOnly`: `isActive && !task.connect_type && !task.note`
- `isHistorical`: everything else

**New query — `latestInteraction`** (only when `isActive && !isTailsOnly`):
```
supabase.from('task_records')
  .select('*')
  .eq('contact_id', task.contact_id)
  .not('connect_type', 'is', null)
  .is('related_task_record_id', null)
  .order('connect_date', { ascending: false })
  .limit(1)
  .maybeSingle()
```

**Active coin** (not tails-only):
- WHAT HAPPENED: Show `latestInteraction` data (connect type, date, note) — contact-level, not record-level
- Divider with arrow
- WHAT'S NEXT: Follow-up type from `task`, due date, urgency badge
- CTAs: "Complete follow-up" full-width primary, then "Reschedule" + "Cancel" side-by-side secondary below

**Tails-only coin**:
- WHAT'S NEXT only, same three CTAs
- No WHAT HAPPENED, no divider

**Historical coin**:
- WHAT HAPPENED only from `task` itself (connect type, date, note)
- No divider, no WHAT'S NEXT, no CTAs

**Remove**:
- `relatedCoin` query (lines 102–113) and all references
- `isStandaloneLog`, `coinForFollowUp`, `coinHasActiveFollowUp` variables
- "No follow-up scheduled / Add one?" nudge (lines 399–407)
- `scheduleOpen` state and `ScheduleFollowupSheet` import/usage
- `logSheetOpen` state and `LogInteractionSheet` import/usage (the "Want to add one?" nudge)
- All standalone log branching in What's Next section (lines 319–373)

**Keep**: Edit menu item, Reschedule in dropdown (active only), Undo complete/cancel, `activeFollowup` query, all console.logs, `CompleteFollowupSheet`, `RescheduleSheet`

**Dropdown menu updates**:
- Edit: always visible (routes to `/edit-task/${id}`)
- Reschedule: only when `isActive`
- Undo complete: when `task.status === 'completed'` AND undo not gated (see item 4)
- Undo cancel: when `task.status === 'cancelled'` AND no other active followup

**Add cancel mutation** for the "Cancel" CTA button on active coins — sets `status: 'cancelled'`, `completed_at: now()`.

---

### 3. ContactFollowupCard.tsx — Reschedule nudge

- Accept optional `rescheduleCount?: number` prop
- If `rescheduleCount >= 3`, render below existing card content, separated by `border-top: 1px solid rgba(0,0,0,0.08)`:
  - Clock icon (size 11), color #999
  - Text: "Rescheduled {count} times", fontSize 11px, color #999, font-body
  - Padding matching card's internal horizontal padding

---

### 4. EditTaskRecord.tsx — Historical scoping

- After loading `task`, determine `isHistorical = task.status === 'completed' || task.status === 'cancelled'`
- If `isHistorical`: hide the entire "What's next" card (the follow-up toggle + type/date section, lines 205–267)
- Also suppress the `bothOff` delete warning for historical records (it's irrelevant)
- Keep interaction editing (type, date, note) available for historical records

---

### 5. Undo complete — updated gating (in InteractionDetail.tsx)

Update the `activeFollowup` query: when `task.status === 'completed'` and `task.completed_at` exists, add `.gt('created_at', task.completed_at)`. This hides undo if a newer active follow-up was created after completion.

---

### Files modified

| File | Changes |
|------|---------|
| `src/pages/ContactHistory.tsx` | Remove thread lines, build + render interleaved follow-up events with chained newDate, accent first interaction, pass rescheduleCount |
| `src/pages/InteractionDetail.tsx` | 3-state simplification, latestInteraction query, remove relatedCoin/standalone logic, cancel CTA, updated undo gating |
| `src/components/ContactFollowupCard.tsx` | rescheduleCount prop + nudge UI |
| `src/pages/EditTaskRecord.tsx` | Hide follow-up section for completed/cancelled records |

