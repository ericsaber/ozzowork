

## Plan: Prompt 2b Fix 3 — Pill ×, Calendar Card, Via/Reminder Position

**File:** `src/components/LogStep2.tsx` only.

### Fix 1 — Remove × from summary pill
Delete the `onSkip` × button block in the summary pill (the trailing `<button aria-label="Dismiss">` with the `<X />` icon). The pill keeps:
- Green check circle
- "{TypeLabel} · {contactName}" or "Note · {contactName}" text
- " · edit" link (still hidden when `isEditing`)

Also remove the now-unused `X` import from `lucide-react` (keep all other imports).

### Fix 2 — Calendar contained in a card
Current code already wraps the `<Calendar>` in a `#faf8f5` / `1px solid #e8e4de` / `borderRadius: 12` card with `overflow: hidden` (gated by `showCalendar`). Confirm + keep that wrapper exactly. Verify `marginTop: 8` is present.

The `disabled` prop already reads:
```
disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
```
No change needed — today remains selectable.

### Fix 3 — Via + reminder reveal max-height
The single reveal wrapper (gated by `revealOpen` / `!!selectedDate`) currently uses `maxHeight: 200`. Both the Via row and the Reminder row already live inside this single wrapper — confirm structure unchanged.

Update only the inline style:
- `maxHeight: selectedDate ? "160px" : "0"`
- `opacity: selectedDate ? 1 : 0`
- `overflow: "hidden"`
- `transition: "max-height 0.32s ease, opacity 0.22s ease"`
- Keep the existing `marginTop: revealOpen ? 16 : 0` so spacing above the via row stays correct when open.

### Preserved
- All `console.log` statements
- `onSkip` prop in interface (still passed by parents; just no longer wired to a UI element inside LogStep2)
- All other sections: edit panel, heading, date chips, Pick date button, calendar wrapper, via row, reminder row
- `handleDoneEditing`, edit-mode logic, `onFollowupStateChange` emission

### Checklist
- ✅ Only `LogStep2.tsx` touched
- ✅ × removed from summary pill (and `X` import dropped)
- ✅ "· edit" link remains, hidden when `isEditing`
- ✅ Calendar wrapped in `#faf8f5` card with `1px solid #e8e4de`, radius 12, `overflow: hidden`, `marginTop: 8`
- ✅ `disabled` allows today (`< setHours(0,0,0,0)`)
- ✅ Via + reminder both inside the single `selectedDate`-gated reveal wrapper
- ✅ Reveal `maxHeight` set to `160px` when open
- ✅ All `console.log` preserved

