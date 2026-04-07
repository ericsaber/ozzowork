

## Show note & reminder_note on completed follow-up history rows

### File: `src/pages/ContactHistory.tsx`

**Change 1 — "Completed WITHOUT connect_type" branch (lines 666-681)**

- Change `items-center` → `items-start` on the flex container (line 669)
- Add `fu.note` rendering below the label span, using the same pattern as interaction notes (lines 710-714): `<p className="line-clamp-2 mt-0.5" style={{ color: "#777", fontFamily: "var(--font-heading)", fontSize: "13px", fontStyle: "italic" }}>` with null/trim check
- Add `fu.reminder_note` rendering after `fu.note`, same pattern, same null/trim check

**Change 2 — "Completed WITH connect_type" branch (lines 650-655)**

- After the existing `fu.note` block (line 655), add `fu.reminder_note` rendering using the identical note pattern, with null/trim check

No new styles, no emoji, no other files changed. All `console.log` statements preserved.

