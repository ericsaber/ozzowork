

## Log Flow Bug Fixes Round 3 — Implementation Plan

### Bug 1 (CRITICAL): Transcription prompt + duration cutoff

**File: `supabase/functions/transcribe-audio/index.ts`**

1. After file validation (~line 60), add estimated duration calculation and log:
```js
const estimatedDurationSec = audioFile.size / 4000;
console.log('[transcribe-audio] file size:', audioFile.size, 'bytes, estimated duration:', estimatedDurationSec.toFixed(1), 'seconds');
```

2. After Whisper returns transcript (line 86), add log:
```js
console.log('[transcribe-audio] raw Whisper transcript:', transcript);
```

3. After the empty-transcript check (line 92), add duration gate — if `estimatedDurationSec > 30`, skip Gemini and return raw transcript:
```js
if (estimatedDurationSec > 30) {
  console.log('[transcribe-audio] duration >30s, skipping Gemini, returning raw transcript');
  return new Response(JSON.stringify({ transcript, summary: transcript, isRawTranscript: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

4. Replace system prompt (line 112) with:
```
You are a note-taking assistant helping professionals keep track of conversations.
Clean up the following voice note transcript into 1-3 clear, factual sentences.
Preserve all specific details exactly as spoken: names, places, numbers, dates,
dollar amounts, and any other specifics — do not paraphrase, generalize, or
replace specific terms with generic ones.
Do not add, invent, or infer any information not present in the transcript.
If the transcript is unclear or very short, return it as-is with minimal cleanup.
```

5. Change user message (line 114) to: `Transcript: ${transcript}`

6. All responses now include `isRawTranscript` boolean flag. On Gemini failure, set `isRawTranscript: true` and return raw transcript.

7. Add final summary log before response (line 129):
```js
console.log('[transcribe-audio] final summary:', summary, '| isRawTranscript:', isRawTranscript);
```

All `console.log` statements left in place for testing verification.

**File: `src/components/LogStep1.tsx`**

1. Add state: `const [isRawTranscript, setIsRawTranscript] = useState(false)`

2. In `transcribeAudio` (line 164), destructure `isRawTranscript` from response and set state:
```js
const { summary, isRawTranscript: rawFlag } = await res.json();
if (summary) {
  setNote(summary);
  setIsRawTranscript(!!rawFlag);
  ...
}
```

3. Line 476-477: Change label from hardcoded "Note" to conditional:
```tsx
{isRawTranscript ? "Transcript" : "Note"}
```

4. Line 484: Make textarea auto-grow — remove `min-h-[56px]` fixed height, add dynamic rows or use a ref-based auto-height approach. Simplest: add `onInput` handler that sets `style.height = 'auto'; style.height = scrollHeight + 'px'` on the textarea, and set `overflow: hidden` so it expands instead of scrolling.

---

### Bug 2: Today sort by updated_at

**File: `src/pages/Today.tsx`**

Line 53: Change `created_at` to `updated_at`:
```js
dueToday.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
```

---

### Bug 4: Contact flag layout stability (visibility: hidden approach)

**File: `src/components/LogStep1.tsx`**

Lines 369-376: Replace the conditional render with an always-present element using `visibility`:
```tsx
<div
  className="px-[14px] py-1.5 border-b border-border"
  style={{ visibility: showContactFlag ? "visible" : "hidden" }}
>
  <span className="text-[13px]" style={{ color: "rgba(200,98,42,0.7)", fontFamily: "var(--font-body)" }}>
    Select a contact to continue
  </span>
</div>
```

Remove the `{showContactFlag && (` conditional wrapper — the element is always in the DOM at full height, just hidden/visible.

---

### Bug 5: Remove autoFocus

**File: `src/components/LogStep1.tsx`**

Line 480: Remove `autoFocus` from the textarea. One-line deletion.

---

### Bug 6: Global toast positioning

**File: `src/components/ui/sonner.tsx`**

Add `position="top-center"` and `duration={2500}` to the `<Sonner>` component:
```tsx
<Sonner
  position="top-center"
  duration={2500}
  theme={theme as ToasterProps["theme"]}
  className="toaster group"
  ...
/>
```

---

### Bug 7: Drawer focus outline + keyboard sizing

**File: `src/components/ui/drawer.tsx`**

1. On `DrawerPrimitive.Content` (line 48-55): Add `tabIndex={-1}` and merge `outline: "none"` into the style prop.

2. On `DrawerOverlay` (line 21): Add `style={{ outline: "none" }}`.

**File: `src/components/LogInteractionSheet.tsx`**

Line 295-299: Wrap "Keep editing" handler in `requestAnimationFrame`:
```tsx
<AlertDialogCancel onClick={() => {
  setShowDiscardDialog(false);
  requestAnimationFrame(() => {
    onOpenChange(true);
  });
}}>
  Keep editing
</AlertDialogCancel>
```

---

### Files Changed (6 total)

1. `supabase/functions/transcribe-audio/index.ts` — new prompt, duration gate, debug logs
2. `src/components/LogStep1.tsx` — isRawTranscript label, remove autoFocus, contact flag visibility:hidden, auto-grow textarea
3. `src/pages/Today.tsx` — sort by updated_at
4. `src/components/ui/sonner.tsx` — position top-center, duration 2500
5. `src/components/ui/drawer.tsx` — outline suppression, tabIndex
6. `src/components/LogInteractionSheet.tsx` — rAF on Keep Editing

