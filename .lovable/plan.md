

## Plan: Prompt 2b Visual Fixes — Padding + Inline Edit Panel

**Files:** `src/components/LogInteractionSheet.tsx`, `src/components/LogStep2.tsx`

### Fix 1 — Top padding on step 2 and step 3 (LogInteractionSheet.tsx)

Wrap both `<LogStep2 .../>` renders (step === 2 and step === 3) in a flex-chain wrapper:
```tsx
<div style={{ paddingTop: 20, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
  <LogStep2 ... />
</div>
```
This matches the step 1 wrapper and clears the summary pill from the close button. All existing props on `<LogStep2>` remain unchanged.

### Fix 2 — Inline edit panel redesign (LogStep2.tsx)

Replace the current `isEditing && ...` block with a new white card:
- **Container:** `bg #faf8f5`, `1px solid #e8e4de`, radius 16, padding 16, flex column, gap 12.
- **Note textarea:** transparent, no border/outline, Crimson Pro 16px italic `#1c1a17`, placeholder "What happened?" `#c8c4be`, `width: 100%`, `min-height: 60px`, auto-grow via inline `onInput` (`e.currentTarget.style.height = 'auto'; ... = scrollHeight + 'px'`). Bound to `editNote`.
- **Label:** "HOW DID YOU CONNECT?" — 10px, weight 600, tracking `0.1em`, uppercase, `#888480`, Outfit, margin-bottom 6.
- **Type pills row:** flex wrap, gap 6. Same 5 options (Call/Email/Text/Meeting/Video) with Lucide icons. Unselected: `#faf8f5` bg, `1px solid #e8e4de`, `#6b6860`, radius 100, padding `6px 12px`, 13px Outfit. Selected: `#fdf4f0` bg, `1.5px solid #c8622a`, `#c8622a`. Toggles `editConnectType`.
- **Action row:** flex, justify-end, gap 10, margin-top 4.
  - **Cancel:** transparent, no border, 14px weight 500, `#888480`, Outfit. On click: `setIsEditing(false); setEditConnectType(connectType); setEditNote(note);` (discard).
  - **Done:** transparent bg, `1.5px solid #c8622a`, radius 100, padding `7px 18px`, 14px weight 500, `#c8622a`, Outfit. On click: existing `handleDoneEditing()`.

All other logic, state, sections, and `console.log`s untouched.

### Checklist
- ✅ Only LogInteractionSheet.tsx + LogStep2.tsx touched
- ✅ Step 2 and step 3 wrapped with `paddingTop: 20` flex chain
- ✅ Inline edit = white card with textarea + label + pills + Cancel/Done
- ✅ Cancel discards changes; Done calls existing `handleDoneEditing()`
- ✅ Textarea auto-grows
- ✅ All `console.log` preserved

