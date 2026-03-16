## Log Flow Redesign — Full Plan

### Task 1: New Toast Component (replaces CelebrationHeader) — pending

**File: `src/components/CelebrationHeader.tsx`** — Full rewrite

- Background `#fdf5f0`, border-radius 6px, padding `7px 12px 8px 14px`, margin-bottom 18px
- Left accent: absolutely-positioned 3px-wide `#c8622a` div (NOT border-left)
- **Variant A ("Nice work.")** — first interaction only:
  - Border animates height 0→100% (280ms), text fades up with delays
  - "Nice work." in Crimson Pro 20px `#c8622a`, subline "[Name] · First interaction" 11px `#7a746c`
- **Variant B ("Done.")** — repeat interactions:
  - Static border, only "✓" pops in (spring 220ms)
  - "Done." + "✓" baseline row, subline "[Name] · Nth interaction"
- Interaction count query unchanged

### Task 2: Redesigned Stepper ✅

**File: `src/components/StepIndicator.tsx`** — Done

- 22px circles, always number, never checkmark
- Active: transparent + 1.5px `#c8622a` border, sienna number
- Completed: solid `#c8622a`, white number
- Inactive: muted gray fill, gray number
- Identical structure on both steps — no expansion, no `expandStep2` prop
- Labels: 9px uppercase below circles

### Task 3: Unified Note Card (LogStep1 redesign) — pending

**File: `src/components/LogStep1.tsx`** — Major rewrite

- Single card: white bg, 0.5px border, 14px radius
- **Contact header row** (46px): prefilled (avatar + name) or empty (dashed avatar + search). "Change" link only in FAB flow after selection
- **Note/mic area**: default centered mic CTA (38px circle), typing mode (mic to corner, textarea), recording mode (CTA → "Done recording →", always active)
- **Connect type chips** below card: dimmed until contact selected, 100px radius pills
- **CTA**: "Next →", disabled until contact + type selected; "Done recording →" during recording
- **Skip link**: "Set a follow-up without logging"

### Task 4: LogStep2 Redesign — pending

**File: `src/components/LogStep2.tsx`** — Moderate rewrite

- Remove standalone "What's next?" heading — stepper label is sufficient
- Remove "← Edit log" back link entirely
- **Green confirmation card**: `#eaf4ed` bg, green check + type/name/date, note italic serif, "Tap to edit"
- **Inline edit**: card bg → white, chips + textarea inside, "Done editing" link to collapse
- **Follow-up chips**: 100px radius pills, "How will you follow up?" + "When?" labels
- **CTA**: "Save →" (dims until type + date selected), "Skip follow-up" link

### Task 5: LogInteraction Page Updates — pending

**File: `src/pages/LogInteraction.tsx`**

- Remove h1 heading and back arrow
- Merge ContactCombobox into LogStep1 (pass contacts, handlers)
- Remove separate combobox + quick-add button
- Pass `isContactPrefilled` based on `preselectedContact`

### Task 6: CompleteFollowupSheet Updates — pending

**File: `src/components/CompleteFollowupSheet.tsx`**

- Toast above stepper only when completing a follow-up (Today check tap, contact record checkmark)
- No toast for fresh interactions via FAB or contact Log button
- Contact always prefilled

### Task 7: Entry Point Wiring — pending

| Entry | Contact | Toast | Chips dim? | CTA dims until |
|-------|---------|-------|------------|----------------|
| FAB (+) | Empty, searchable | No | Yes | Contact + type |
| Contact Log btn | Prefilled | No | No | Type only |
| Today/Contact check | Prefilled | Yes | No | Type only |

### Files Changed Summary

1. `src/components/CelebrationHeader.tsx` — Full rewrite → toast
2. `src/components/StepIndicator.tsx` — Done ✅
3. `src/components/LogStep1.tsx` — Major rewrite, unified card + inline search
4. `src/components/LogStep2.tsx` — Rewrite, inline edit, no heading
5. `src/pages/LogInteraction.tsx` — Remove title/back, merge combobox
6. `src/components/CompleteFollowupSheet.tsx` — Wire toast, new props
7. `src/components/ContactCombobox.tsx` — Absorbed into LogStep1 or adapted
