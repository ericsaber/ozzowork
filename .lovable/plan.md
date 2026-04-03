

## Replace "+ Log" button with "New ▾" dropdown in ContactHistory.tsx

Single file change: `src/pages/ContactHistory.tsx`

### Changes

**1. Add state** (after line 46, near other state declarations)
- Add `newMenuOpen` boolean state

**2. Remove `Plus` from imports** (line 7)
- Remove `Plus` from the lucide-react import

**3. Replace action row** (lines 233–247)
- Replace the entire action row div with the new dropdown button ("New ▾") and three menu options:
  - **Log + Set Follow-up** (primary, orange background) → opens `logSheetOpen`
  - **Log only** → opens `logSheetOpen` + TODO comment
  - **Follow-up only** → opens `logSheetOpen` + TODO comment
- Keep Call, Email, Text buttons with identical logic

The dropdown uses a fixed backdrop for outside-tap dismissal and absolute positioning below the button. All three options currently open `logSheetOpen = true` with TODO comments for future mode routing.

