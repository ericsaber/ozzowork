

## Plan: Prompt 2b — LogStep2 Redesign

**Files:** `src/components/LogStep2.tsx` (full rewrite), `src/components/LogInteractionSheet.tsx` (cleanup)

### Part 1 — LogStep2.tsx full rewrite

**Props interface (final):**
```ts
{
  connectType: string;
  contactName: string;
  note: string;
  onSaveWithFollowup: (type: string, date: string) => void;
  onSkip?: () => void;
  isSaving: boolean;
  onUpdateLog?: (connectType: string, note: string) => void;
}
```
Removed: `skippedInteraction`, `onAddInteraction`, `onBack`, `logDate`.

**State:**
- `followUpType` — init from `connectType` if truthy
- `selectedDate` — `""`
- `showCalendar` — `false`
- `reminderNote` — `""` (local only, 44 char max, not yet wired to save)
- `isEditing`, `editConnectType`, `editNote` — preserved for inline edit
- Removed: `viaActivated`, `showDatePicker`

**Mount logging:** preserved verbatim.

**Render structure (flex column):**

1. **Summary pill** — only when `connectType || note`. Green pill (`#f0f7f4` bg, `#b7d9cc` border, 100px radius, `align-self: flex-start`). 18px green check circle, "{TypeLabel} · {contactName}" or "Note · {contactName}", " · edit" tappable link → sets `isEditing(true)`, × button → calls `onSkip?.()`. When `isEditing`, swap pill for existing inline edit panel (type pill row + textarea + Done editing) — logic preserved.

2. **Heading** — "Set a follow-up", Crimson Pro 28px, weight 500, `#1c1a17`, `letterSpacing: -0.01em`, margins `16px 0`.

3. **Date chips** — CSS grid 2×2, gap 8px. Chips: Tomorrow / 3 days / 1 week / 2 weeks. Default `#faf8f5`/`#e8e4de` border/12px radius. Selected: `#fdf4f0` bg + `1.5px solid #c8622a` + `#c8622a` text. Then full-width **Pick date** button (CalendarIcon 15px) below grid. When selected date is custom (not one of the 4 presets), button shows formatted date label in selected style. Tapping toggles `showCalendar`.

4. **Inline calendar** — when `showCalendar`, render shadcn `<Calendar>` directly (no Popover wrapper). Same `disabled` rule. Selecting closes calendar, sets `selectedDate`, does not clear chips.

5. **Via + reminder reveal** — wrapper with `max-height` + `opacity` transition; hidden when `!selectedDate`.
   - Via row: "via" label + 5 icon circles (34px). Selected = `#c8622a` bg / white icon. Pre-populate from `connectType` mount.
   - Reminder row: dashed top border, Pencil 13px, transparent input (`maxLength={44}`), counter `{n}/44`.

6. **Save button** — full-width pill, sienna bg when enabled / `#ddd8d1` disabled. Label "Save" + ArrowRight 18px (or "Saving…"). Calls `onSaveWithFollowup(followUpType, selectedDate)`.

7. **Skip link** — only when `onSkip` provided; underlined `#888480` 13px.

### Part 2 — LogInteractionSheet.tsx cleanup

- Remove `skippedInteraction` state declaration and any setters.
- Remove `handleAddInteraction` (if present).
- Remove `skippedInteraction`, `onAddInteraction`, `onBack`, `logDate` props from BOTH `<LogStep2>` call sites (step 2 and step 3 renders). Keep all other props unchanged.

### Preserved
- All `console.log` statements in both files
- Voice recording, draft/publish flow, mutations, step routing
- `handleDoneEditing` and inline edit logic in LogStep2
- `CompleteFollowupSheet.tsx` untouched

### Checklist
- ✅ Only LogStep2.tsx + LogInteractionSheet.tsx touched
- ✅ Dead props removed from interface and call sites
- ✅ Summary pill conditional on `connectType || note`
- ✅ Heading Crimson Pro 28px
- ✅ 2×2 chip grid + full-width Pick date
- ✅ Inline Calendar (no Popover import)
- ✅ Via + reminder reveal gated by `selectedDate`
- ✅ `followUpType` pre-populated from `connectType`
- ✅ Reminder note local state, 44 char counter
- ✅ Save disabled until date set
- ✅ `skippedInteraction` state removed from sheet
- ✅ All `console.log` preserved
- ✅ CompleteFollowupSheet untouched

