

## Plan: Contact Detail Page — Missing Info Prompts + Connect Pill on Cards

### 1. Action Row: Always Show All 4 Buttons (`src/pages/ContactHistory.tsx`)

Currently Call/Email/Text buttons are conditionally rendered only when `contact.phone` or `contact.email` exist. Change to:

- **Always render** all 4 buttons (Log, Call, Email, Text)
- If `contact.phone` is missing: Call and Text buttons show a toast/confirm prompt: "No phone number added. Would you like to add one?" — on confirm, call `startEditing()` to open the inline edit form
- If `contact.email` is missing: Email button shows same pattern: "No email added. Would you like to add one?"
- When info exists, keep existing `tel:`, `mailto:`, `sms:` link behavior
- Change Call/Email/Text from `<a>` tags to `<button>` elements that conditionally either open the native link or show the prompt

### 2. Connect Pill on Follow-up Cards (`src/components/ContactFollowupCard.tsx`)

Add the gray connect pill (matching `FollowupCard.tsx` lines 121-136) to the "Last connect" section of `ContactFollowupCard`:

- Between the "Last connect" label and the note text, render the pill when `connect_type` is not null
- Pill style: `background: #e8e4de`, `color: #666`, `border-radius: 20px`, `padding: 3px 9px`, `font-size: 10px`, `font-weight: 500`
- Content: connect type icon (10px) + past-tense verb + " · " + formatted date from `interaction.date`
- Add `pastVerb` map (Called, Emailed, Texted, Met, Video called) to the component

### Files

| File | Change |
|------|--------|
| `src/pages/ContactHistory.tsx` | Always render action buttons; add missing-info prompt logic |
| `src/components/ContactFollowupCard.tsx` | Add connect pill with icon + verb + date below "Last connect" label |

