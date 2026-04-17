

## Plan: Prompt 2a Visual Fixes v3

**Files:** `src/components/FullscreenTakeover.tsx`, `src/components/LogInteractionSheet.tsx`, `src/components/LogStep1.tsx`

### Fix 1 — Close button styling (FullscreenTakeover.tsx)
Replace the bare-text close button styles with a 30×30 gray circle:
- `width: 30, height: 30, borderRadius: 50%, background: #e8e4de`
- `top: calc(env(safe-area-inset-top) + 16px)` (was `+ 12px`)
- Remove `padding: 8`, add flex centering
- Lucide `<X size={16} color="#6b6860" />` (was 24/#666)
- Keep `opacity`/`transition`/`transitionDelay` exactly as-is

### Fix 2 — Avatar color hash (both files)
Replace the existing `getAvatarColors` helper in both `LogInteractionSheet.tsx` and `LogStep1.tsx` with the sum-of-two-initials version:
```ts
const parts = (name || "").trim().split(" ");
const a = (parts[0]?.[0] || "A").toUpperCase().charCodeAt(0);
const b = (parts[1]?.[0] || parts[0]?.[1] || "A").toUpperCase().charCodeAt(0);
return palette[(a + b) % 5];
```
Palette unchanged (5 pairs).

### Fix 3 — Note card fills available height
**LogStep1.tsx outer wrapper:** change `flex: 1, paddingTop: 8` → `minHeight: "100%", paddingTop: 0` (keep `display: flex, flexDirection: column, gap: 16`).

**LogStep1.tsx note card:** add `minHeight: 200` (keep existing `flex: 1, display: flex, flexDirection: column, background, border, borderRadius, padding`).

**LogStep1.tsx textarea:** already `flex: 1, minHeight: 80` — leave as-is.

**LogInteractionSheet.tsx scrollable content div** (the `flex: 1, overflowY: auto, padding: "0 20px"` div): add `minHeight: 0`.

### Fix 4 — Top padding on step 1 (LogInteractionSheet.tsx)
The current `step === 1` render uses a `<>` fragment containing the quick-add form + `<LogStep1>`. Wrap it in a `<div style={{ paddingTop: 20 }}>` so the contact chip clears the close button. Quick-add form remains inside this wrapper.

### Preserved
- All `console.log` statements
- All voice recording logic, refs, state, transcribeAudio
- All other FullscreenTakeover behavior (mounted/visible state, double-rAF, visualViewport listener, backdrop, slide animation)
- Bottom action area, nudge, Next button, skip link
- Contact picker layout, "RECENT" label, search input styling

### Checklist
- ✅ Only `FullscreenTakeover.tsx`, `LogInteractionSheet.tsx`, `LogStep1.tsx` touched
- ✅ Close button = 30×30 `#e8e4de` circle, X icon 16px `#6b6860`
- ✅ Avatar hash = sum of both initials `charCodeAt`, fallback to second char of first name
- ✅ Helper updated in both files
- ✅ LogStep1 wrapper uses `minHeight: 100%` (not `flex: 1`)
- ✅ Note card has `minHeight: 200` + `flex: 1`
- ✅ Scrollable content div has `minHeight: 0`
- ✅ Step 1 wrapper has `paddingTop: 20`
- ✅ All `console.log` preserved

