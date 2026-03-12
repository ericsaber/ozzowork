

## Plan: Redesign Contact Detail Page

This is a major rewrite of `src/pages/ContactHistory.tsx` plus new supporting components. The current page uses tabs (History/Upcoming) with simple list items. The redesign replaces this with a card-based layout showing follow-up cards with action buttons, an interaction history list, dropdown menus, and a reschedule bottom sheet.

### Data Model Note

The current data model stores follow-ups as `follow_up_date` on the `interactions` table. There is no separate "follow-up status" or "resolved" flag. Currently, resolving a follow-up means setting `follow_up_date = null`. This design works for the redesign: "unresolved" = `follow_up_date IS NOT NULL`, "overdue" = `follow_up_date < today`, "upcoming" = `follow_up_date >= today`.

### Files to Create

**1. `src/components/RescheduleSheet.tsx`** — New bottom sheet component

- Uses existing `Drawer`/`DrawerContent` from vaul
- Header: red clock icon container + "Reschedule" in Instrument Serif 18px + subtitle with type/contact/due date
- Body: type pills (Call/Email/Text/Meet/Video — same style as LogStep1), date chips (Tomorrow/3 days/1 week/2 weeks/Pick date — same style as LogStep2), primary CTA "Save new date" (disabled until both selected), "Cancel" text link
- On save: updates `planned_follow_up_type` and `follow_up_date` on the existing interaction record
- Props: `open`, `onOpenChange`, `interactionId`, `contactName`, `currentType`, `dueDate`

**2. `src/components/ContactFollowupCard.tsx`** — New follow-up card component

Shared card for both "next follow-up" and "overdue" variants. Props: `interaction`, `contact`, `variant: "upcoming" | "overdue"`, `onLogIt`, `onReschedule`, `onEdit`, `onDelete`.

Layout:
- White bg, border-radius 14px, box-shadow `0 1px 5px rgba(0,0,0,.06)`, padding 12px 14px
- Top-right: bare ⋯ dots button (#aaa, hover #666, no circle) → DropdownMenu with "Edit follow-up" and divider + "Delete" (red)
- Eyebrow row: 20×20 rounded square icon (border-radius 6px). Green bg `#eef7ee` + green icon for upcoming, red bg `#fdf2f0` + red icon for overdue. Date text 13px weight 500. Overdue shows "Due [date] · N days ago".
- Below eyebrow: gray pill (`#e8e4de` bg, `#666` text, 10px) with type icon + "[Type] planned"
- Divider 1px
- "Last connect" label (9px uppercase #bbb), note text 11px #777 line-clamp-2
- Action row: upcoming gets one green "Log it" button; overdue gets two red buttons "Log it" + "Reschedule"

### File to Rewrite

**3. `src/pages/ContactHistory.tsx`** — Full rewrite

**Header section** (keep existing structure, restyle):
- Back link (← Contacts), avatar circle, name (Instrument Serif), company subtitle
- ⋯ circle button (inputBg `#f0ede8`, 1.5px border) → DropdownMenu: "Edit contact" + divider + "Delete contact" (red danger)
- Edit contact opens inline edit form (keep existing mutation logic)
- Delete contact opens existing AlertDialog

**Action row**:
- 4 buttons: Log (accent bg `#c8622a`, white text, icon), Call (ghost, border, `tel:`), Email (ghost, border, `mailto:`), Text (ghost, border, `sms:`)
- Log navigates to `/log?contact={id}`

**Next Follow-up section**:
- Query: interactions where `contact_id = id`, `follow_up_date >= today`, `follow_up_date IS NOT NULL`, sorted ascending
- Section label "Next follow-up" (9px uppercase muted). Hidden if empty.
- Renders `ContactFollowupCard` with variant="upcoming" for each

**Overdue section**:
- Query: interactions where `contact_id = id`, `follow_up_date < today`, `follow_up_date IS NOT NULL`, sorted ascending
- Section label "Overdue" (9px uppercase muted). Hidden if empty.
- Renders `ContactFollowupCard` with variant="overdue" for each

**"Log it" behavior**:
- Opens `CompleteFollowupSheet` (existing component) pre-associated with the specific follow-up interaction ID
- On save, that specific interaction's `follow_up_date` is set to null (resolved)

**"Reschedule" behavior**:
- Opens `RescheduleSheet` for the specific interaction

**Interaction History section**:
- Section label "Interaction history" (9px uppercase)
- Query all interactions for this contact, sorted reverse-chronologically
- Each row: 28px circle icon (inputBg), type verb (Called/Emailed/Texted/Met/Video called) 12px weight 500, date 11px muted, note 11px #777 line-clamp-2
- Below note: follow-up indicator if `follow_up_date` exists — green check + "Follow-up · [date]" if resolved (no follow_up_date), accent arrow + "Follow-up [date] · [type]" if pending
- Bare ⋯ dots → DropdownMenu: "Edit" (opens existing EditInteractionDialog) + divider + "Delete" (red, with confirmation)

**Dropdown exclusivity**: Track `openMenuId` state — only one dropdown open at a time.

### Files Summary

| Action | File |
|--------|------|
| Create | `src/components/ContactFollowupCard.tsx` |
| Create | `src/components/RescheduleSheet.tsx` |
| Rewrite | `src/pages/ContactHistory.tsx` |

No database changes needed. All data queries use existing `interactions` and `contacts` tables.

