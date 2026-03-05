

## Visual Design Pass — Today Screen

Pure styling changes, no functionality modifications.

### 1. FollowupCard.tsx — Restyle

**Check circle**: Replace `CheckCircle2` icon inside a `w-9 h-9` double-ring button with a custom 26×26px circle: `w-[26px] h-[26px]` with `border-[1.5px] border-[#e8e4de]`, containing a small `Check` icon (12px) in `stroke-[#ccc]`. On hover/press: border becomes `#c8622a`, background fills `#c8622a/10`.

**Name**: Change from `font-semibold font-heading` to `font-body text-[14px] font-medium` (DM Sans 500).

**Company**: Change to `text-[11px] font-normal text-[#999]`.

**Badge**: Replace separate Overdue/Today badges with a combined pill containing:
- Inline type icon (Phone, Mail, Voicemail, MessageSquare) at 12px
- Status text: "Today" (green) or "Due [date]" (red for overdue)
- Today pill: `bg-[#f0f7f0] text-[#4a9e4a]`
- Overdue pill: `bg-[#fdf2f0] text-[#d94f2e]`

**Note section**: After name+company, add a 1px divider in border color, then uppercase "LAST INTERACTION" label (`text-[9px] tracking-[0.1em] text-[#bbb] font-medium`), then the note in `text-[12px] text-[#777] line-clamp-2`.

New props needed: `followUpDate` (already passed but unused in render) for the overdue date display.

### 2. Today.tsx — Section Labels & Layout

**Section labels** ("DUE TODAY", "OVERDUE"): Change to `text-[11px] font-medium font-body uppercase tracking-[0.1em] text-[#bbb]`. Add `mt-8 mb-3` for spacing (more top padding).

**Section order**: Due Today first, then Coming Up strip, then Overdue (matching the screenshot).

**Subtitle**: Add item count next to the date — e.g., "Wednesday, March 4 · 3 need attention" using total of overdue + dueToday.

**Coming Up strip**: Replace the current simple button with a card-style row matching follow-up card borders:
- Same `bg-card rounded-lg border border-border` as cards
- Left: 26×26px icon container with `Calendar` icon in `text-[#bbb]` 16px
- Center: "Coming up" in `text-[14px] font-medium font-body`, "X this week" in `text-[11px] text-[#999]`
- Right: pill badge `bg-[#fdf0e8] text-[#c8622a] text-[10px] font-medium rounded-[20px] px-2.5 py-1` with Eye icon + "See all"

### 3. Files to Edit

| File | Changes |
|------|---------|
| `src/components/FollowupCard.tsx` | Restyle check circle, name, company, badge, add last interaction section |
| `src/pages/Today.tsx` | Restyle section labels, reorder sections, update coming-up strip, add subtitle count |

No new files. No functionality changes.

