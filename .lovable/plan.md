

## Plan: Contact Picker State + LogStep1 Redesign (revised)

**Files:** `src/components/LogStep1.tsx`, `src/components/LogInteractionSheet.tsx` only.

### Clarification incorporated
`skippedInteraction` state and prop pass-through to `<LogStep2>` are preserved unchanged in this prompt:
- Step 2 render: `skippedInteraction={skippedInteraction || startStep === 2}`
- Step 3 render: `skippedInteraction={false}`

The earlier "remove `skippedInteraction` references on LogStep2 call sites" item is dropped. The state stays, the prop pass-through stays. That cleanup is deferred to prompt 2b.

### Part 1 — `LogStep1.tsx` full rewrite

**Preserved verbatim:**
- All voice recording: `startRecording`, `stopRecording`, `transcribeAudio`, `handleRecordingCTA`, `mediaRecorderRef`, `chunksRef`, `isRecording`, `isTranscribing`, `isRawTranscript`
- Auto-grow textarea `useEffect` for programmatic note updates
- All Supabase auth calls inside `transcribeAudio`
- All `console.log` statements
- `handlePillClick` toggle (tap selected = deselect)

**Removed:** contact search UI + state, submit button, skip link, date row, active follow-up nudge, `showContactFlag`.

**Final props:**
```ts
{
  connectType, setConnectType, note, setNote,
  contactId?, contactName?, isContactPrefilled?,
  onSubmit?, isSubmitting?  // optional, unused in UI (CompleteFollowupSheet compat)
}
```

**New UI — three sections, gap 16px:**
1. **Contact chip** (when `contactId && contactName`): pill with 28px avatar (#e8c4b0 bg, #c8622a text, initials) + name. Display only.
2. **Note + voice card**: `#faf8f5` bg, `#e8e4de` border, 16px radius, 14px padding. Textarea (transparent, 16px Outfit, placeholder "What did you talk about?", min-height 100px, auto-grow) → 1px divider → voice pill button:
   - Idle: `#fdf4f0`/`#e8c4b0`, Mic + "Log with Voice" in `#c8622a`
   - Recording: `#fdecea`/`#f5b8b4`, Square + "Stop recording" in `#c0392b`, subtle pulse
   - Transcribing: `#f5f3f0`/`#e8e4de`, Mic + "Transcribing…" italic muted, no interaction
3. **Type pills** (Call/Email/Text/Meeting/Video, Lucide Phone/Mail/MessageSquare/Users/Video): progressive reveal via `max-height` + `opacity` when `note.trim().length > 0 || connectType !== ""`. Label "HOW'D YOU CONNECT?" 10px uppercase `#888480`. Selected = `#fdf4f0` bg + `#c8622a` border/text.

### Part 2 — `LogInteractionSheet.tsx` updates

**Step type:**
```ts
useState<"contact-picker" | 1 | "outstanding" | 2 | 3>(getInitialStep())
```

**`getInitialStep()`:**
- `preselectedContactId && startStep === 1` → `1`
- `startStep === 2` → `2`
- `!preselectedContactId` → `"contact-picker"`
- else → `startStep`

Reset useEffect on `[open, startStep, preselectedContactId]` calls `getInitialStep()`.

**`handleStepBack`:** outstanding→1, 3→outstanding, 2 (no preselect)→1, default→1.

**New handlers:**
- `handleSkipToFollowup`: validates contact, deletes draft if any, resets type/note, sets `skippedInteraction(true)`, advances to step 2
- `handleSaveLogOnly`: publishes draft if exists, invalidates, closes — no navigation
- `canNext = (note.trim().length > 0 || connectType !== "") && !logMutation.isPending`

**State moved from LogStep1:** `searchQuery`, `searchOpen`, `searchInputRef`, `filteredContacts` memo (top 8 always), `handleContactSelect(id)` (sets contactId, clears search; caller advances to step 1).

**JSX inside `FullscreenTakeover`:**
- Scrollable content (`flex: 1, overflowY: auto, padding: 0 20px`): StepIndicator (hidden for contact-picker / outstanding / `startStep === 2` / logOnly), then per-step. Contact picker = pill search input (autoFocus) + filtered list (36px gray avatar + initials, name, optional company) + "+ Add {query}" CTA + existing quick-add form when `showQuickAdd`.
- Bottom action area (`flexShrink: 0, padding: 8px 20px 24px`) — only when `step === 1`:
  - Active follow-up nudge (when `activeFollowup && contactId`): `#fdf4f0` card, white circle + Calendar icon, "{name} has an active follow-up" + underlined "Save log only?" → `handleSaveLogOnly`
  - Next button: full-width pill, `#c8622a` when `canNext` else `#ddd8d1`/`#b0ada8`, label "Next" or "Save" (logOnly), ArrowRight icon → `logMutation.mutate()`
  - Skip link "Set a follow-up without logging" → `handleSkipToFollowup`, disabled gray when `activeFollowup`, hidden when `logOnly`

**LogStep2 call sites (preserved unchanged):**
- Step 2: `skippedInteraction={skippedInteraction || startStep === 2}`
- Step 3: `skippedInteraction={false}`

**Cleanup (this prompt):**
- Remove `handleAddInteraction` (dead coin-model code)
- Stop passing removed props to `<LogStep1>`
- Keep `handleChangeContact`, `handleAddNewContact`, `skippedInteraction` state and all LogStep2 prop pass-through

### Behavior gates
- Contact picker only when `!preselectedContactId`
- `canNext` does NOT require contact selection
- Nudge only when `activeFollowup && contactId && step === 1`
- Skip link disabled when `activeFollowup`

### Checklist
- ✅ Only `LogStep1.tsx` and `LogInteractionSheet.tsx` touched
- ✅ Voice logic preserved verbatim
- ✅ LogStep1 renders no submit / skip / contact search
- ✅ `onSubmit`/`isSubmitting` kept optional on LogStep1
- ✅ `skippedInteraction` state + LogStep2 prop pass-through unchanged
- ✅ Bottom action area is `flexShrink: 0` outside scrollable div
- ✅ `handleSaveLogOnly` publishes + closes, no navigation
- ✅ All `console.log` preserved
- ✅ `CompleteFollowupSheet` not modified

