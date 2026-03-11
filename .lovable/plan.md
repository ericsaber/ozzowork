

## Plan: Rebuild Log Interaction as Two-Step Flow

This is a significant UI rebuild that replaces the current single-page `LogInteraction` and the `CompleteFollowupSheet` drawer with a unified two-step interaction logging flow. Two entry points share the same step logic.

### New Components to Create

**1. `src/components/StepIndicator.tsx`**
- Reusable stepper component with props: `currentStep: 1 | 2`
- Step 1 states: active (accent border circle with "1") or complete (filled accent circle with white checkmark SVG)
- Step 2 states: idle (inputBg, border-color, muted "2") or active (accent border, accent "2")
- Connecting line: 2px, border-color when idle, accent when step 1 complete
- Labels: "What happened" / "What's next" in 12px DM Sans medium

**2. `src/components/LogStep1.tsx`** — Shared Step 1 form
- Section "HOW DID YOU CONNECT?" with 5 toggle-off pill buttons (Call, Email, Text, Meet, Video) styled per spec (white default, accent selected with `#fdf0e8` bg / `#f0c4a8` border / `#c8622a` text)
- Note area card with mic row + divider + textarea (preserves existing voice recording + transcription logic from `LogInteraction.tsx`)
- CTA: "Log it →" button, full-width accent
- Props: `connectType`, `setConnectType`, `note`, `setNote`, recording handlers, `onSubmit`
- Optional `contactId`/`contactName` prop for contact picker (only shown in Entry B)

**3. `src/components/LogStep2.tsx`** — Shared Step 2 form
- Back link "← Edit log" returns to Step 1 preserving state
- Title "What's next?" in Instrument Serif 24px
- Confirmation strip: green bg (#eef7ee), green border (#c2dfc2), checkmark, logged details
- "How will you follow up?" pill row (same 5 options, writes to `planned_follow_up_type`)
- "When?" chip row: Tomorrow, 3 days, 1 week, 2 weeks, Pick date (with inline date picker)
- CTA disabled unless BOTH type + date selected; label "Save & set reminder"
- Helper hints when only one is selected
- "Save log and skip follow-up" text link always visible

### Files to Modify

**4. `src/components/CompleteFollowupSheet.tsx`** — Complete rewrite
- Still a Drawer (bottom sheet), but now contains:
  - Drag handle (32×4px, centered)
  - Celebration header: green checkmark circle + "Nice work." + "Logging with **{contactName}**"
  - StepIndicator
  - Step 1 form (no contact picker — contact is known)
  - On "Log it →": saves interaction, transitions to Step 2 within the same drawer
  - Step 2 within drawer for follow-up selection
- Contact is pre-selected from the Today card

**5. `src/pages/LogInteraction.tsx`** — Rewrite as full-screen Entry B
- Back link, title "Log interaction" in Instrument Serif
- StepIndicator
- Contact picker row (select + quick-add button)
- Step 1 form
- On "Log it →": saves interaction, transitions to Step 2 in-place
- Step 2 for follow-up selection
- No celebration header

**6. `src/pages/Today.tsx`** — Minor update
- Pass additional data to `CompleteFollowupSheet` if needed (contact info is already passed)

### Data Flow

- **Step 1 "Log it →"**: Inserts interaction with `connect_type` + `note`. No `follow_up_date` or `planned_follow_up_type` yet. Store the returned interaction ID.
- **Step 2 "Save & set reminder"**: Updates the interaction with `planned_follow_up_type` + `follow_up_date`.
- **Step 2 "Save log and skip follow-up"**: No update needed — interaction already saved. Just close/navigate back.
- **Entry A (bottom sheet)**: Also clears `follow_up_date` on the original Today card interaction (existing behavior).

### Styling Details

All pill buttons use the specified styles:
- Default: white bg, `hsl(var(--border))` border 1.5px, muted text, border-radius 20px, padding 7px 13px, 11px DM Sans medium
- Selected: `#fdf0e8` bg, `#f0c4a8` border, `#c8622a` text
- Each pill has a lucide icon (Phone, Mail, MessageSquare, Users, Video)

Note card: `inputBg` background (will use `bg-secondary` or similar), 14px border-radius, 1.5px transparent border → accent on focus. Mic row with icon + label + 1px divider above textarea.

CTA button: `#c8622a` bg, 13px border-radius, 14px padding, 14px DM Sans semibold white, box-shadow.

### File Summary

| Action | File |
|--------|------|
| Create | `src/components/StepIndicator.tsx` |
| Create | `src/components/LogStep1.tsx` |
| Create | `src/components/LogStep2.tsx` |
| Rewrite | `src/components/CompleteFollowupSheet.tsx` |
| Rewrite | `src/pages/LogInteraction.tsx` |
| Minor update | `src/pages/Today.tsx` (if needed) |

