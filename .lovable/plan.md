

## Plan: Log Type Affordance + Label Fix

**Files:** `src/components/LogStep1.tsx` and `src/components/LogStep2.tsx`.

### LogStep1.tsx

**Imports:** Add `Tag` and `ChevronDown` to the existing `lucide-react` import (already has `Phone`, `Mail`, `MessageSquare`, `Users`, `Video`, `Mic`, `Square`).

**Module constants:** Add alongside existing `typeOptions`:
```ts
const typeIconMap: Record<string, React.ElementType> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};
const typeLabels: Record<string, string> = {
  call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video",
};
```

**State:**
- Add `const [typeOpen, setTypeOpen] = useState(false);`
- (No `isTyping` state exists in current file — nothing to remove there. The current file uses `showTypeRow` derived from `note`/`connectType`; that derived var is removed along with the old reveal block.)

**Auto-open triggers:**
- Textarea `onChange`: after `setNote(e.target.value)`, add:
  ```ts
  if (e.target.value.trim().length > 0 && !typeOpen) setTypeOpen(true);
  ```
- `transcribeAudio`: after `setNote(summary)`, add `setTypeOpen(true);` (no auto-select of type).

**Replace** the existing "Section 3 — Type pills (progressive reveal)" block (the `maxHeight: showTypeRow ? 200 : 0` div with the "HOW'D YOU CONNECT?" label and inline pill row) with the new collapsed Log Type affordance card per spec:
- Trigger row: tag icon + "Log Type" (muted) when no type, or matching `typeIconMap[connectType]` + `typeLabels[connectType]` in sienna when set; `ChevronDown` rotates 180° when `typeOpen`.
- Reveal section: `maxHeight` 0 ↔ 120px transition; pills built from existing `typeOptions`.
- Pill click: toggle `connectType` (deselect = empty string, keeps panel open); on select, collapse via `setTimeout(() => setTypeOpen(false), 180)`.

**Outer wrapper:** Verify the root div already has `display: flex; flexDirection: column; flex: 1; gap: 16; minHeight: 0` (it does). No change.

**Preserve:**
- All `console.log` statements in `transcribeAudio`
- Contact chip section, note card, voice recording UI, recording/transcribing/idle states, all mutation refs, `preventScrollOnFocus`, auto-grow effect.
- `isRawTranscript` state and the `void isRawTranscript` line.

### LogStep2.tsx

Single string change in the inline edit panel: replace the type-section label "HOW DID YOU CONNECT?" (or "How did you connect?") with `"Type"`. Nothing else.

### Checklist
- ✅ Only `LogStep1.tsx` and `LogStep2.tsx` touched
- ✅ Old type-reveal block + "HOW'D YOU CONNECT?" label removed from LogStep1
- ✅ Derived `showTypeRow` removed (no `isTyping` state exists to remove)
- ✅ `typeOpen` state added (default `false`)
- ✅ Textarea `onChange` auto-opens affordance when note becomes non-empty
- ✅ `transcribeAudio` auto-opens affordance after `setNote(summary)` — no type auto-select
- ✅ New Log Type affordance card renders below note card
- ✅ Trigger row swaps Tag/muted ↔ matching icon/sienna based on `connectType`
- ✅ ChevronDown rotates 180° on open
- ✅ Selecting a type collapses after 180ms; deselecting keeps it open
- ✅ `Tag` and `ChevronDown` added to Lucide imports
- ✅ All voice recording logic preserved verbatim
- ✅ LogStep2 label changed to "Type"
- ✅ All `console.log` statements preserved

