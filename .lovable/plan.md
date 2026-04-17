

## Plan: Prompt 2b Fix 4 — Date Chips, Edit Gap, Via/Reminder Position

**File:** `src/components/LogStep2.tsx` only.

### Fix 1 — Date chips always render
Remove the `{!isEditing && (...)}` wrapper around the date chips / Pick date / calendar / via+reminder block. Only the edit panel (`{isEditing && (...)}`) remains conditional. Result: chips, Pick date, and calendar always render; the edit panel renders inline above them when active.

### Fix 2 — Gap above edit panel
Add `marginTop: 12` to the outer div of the edit panel card so it sits clear of the summary pill.

### Fix 3 — Via + reminder simple conditional
Replace the `maxHeight`/`opacity` animated wrapper with a plain `{selectedDate && (<div>...</div>)}` block placed immediately after the calendar wrapper. Outer div: `marginTop: 16`, flex column, gap 10. Inside:
- **Via row:** flex, align-center, gap 10. "via" label (11px `#888480` Outfit) + 5 circular type pills (34×34, `#c8622a` selected / `#f0ede8` unselected, `transition: all 0.12s ease`).
- **Reminder row:** flex, align-center, gap 8, dashed top border `1px dashed #d8d4ce`, paddingTop 10. Pencil icon 13 `#888480` + transparent input bound to `reminderNote` (maxLength 44) + counter `{reminderNote.length}/44`.

No `<style>` tag, no fadeIn keyframe — plain conditional render.

Remove the now-unused `revealOpen` variable.

### Preserved
- All `console.log` statements
- Summary pill (with edit link hidden when `isEditing`)
- Heading "Set a follow-up"
- Edit panel structure and `handleDoneEditing`
- Date chips, Pick date button, inline calendar card
- `onFollowupStateChange` emission via `useEffect`
- `onSaveWithFollowup` / `onSkip` / `isSaving` props (unused but kept for interface stability)

### Checklist
- ✅ Only `LogStep2.tsx` touched
- ✅ `{!isEditing && (...)}` wrapper removed
- ✅ Edit panel `marginTop: 12`
- ✅ `maxHeight` reveal removed
- ✅ Via + reminder via `{selectedDate && (...)}`
- ✅ `revealOpen` removed
- ✅ All other logic/state unchanged
- ✅ All `console.log` preserved

