

## Plan: Prompt 2a Visual Fixes

**Files:** `src/components/LogInteractionSheet.tsx`, `src/components/LogStep1.tsx`

### Fix 1 — Remove StepIndicator (LogInteractionSheet.tsx)
- Delete the conditional block at lines 626-628 rendering `<StepIndicator currentStep={...} />`.
- Remove the `import StepIndicator from "@/components/StepIndicator";` at line 21.
- `StepIndicator.tsx` itself is not touched.

### Fix 2 — Contact picker layout (LogInteractionSheet.tsx, lines 630-780)

Restructure the `step === "contact-picker"` block:

1. **Top padding:** outer wrapper uses `paddingTop: 20` so header clears the FullscreenTakeover × button.
2. **Header row:** add a new `<h2>` above the search input — text "Who did you talk to?", Crimson Pro, `fontSize: 24`, `fontWeight: 500`, `color: #1c1a17`, no margin-bottom (spacing handled by next element's `marginTop`).
3. **Search input:** restyle existing pill row — `marginTop: 16`, `border: 1.5px solid #c8622a` (was `1px solid #e8e4de`), Search icon size `16` (was 18). Remove the `placeholder="Who did you talk to?"` (becomes empty string). No clear/× button (none exists today — confirmed).
4. **"RECENT" label:** insert above the contacts list, only when `!searchQuery`. Style: `10px`, `fontWeight: 600`, `letterSpacing: 0.1em`, `textTransform: uppercase`, `color: #888480`, Outfit, `marginTop: 20`, `marginBottom: 8`.
5. **Contact rows:** update each row:
   - Avatar `40px` (was 36), `fontSize: 13` (was 12), background + color from new `getAvatarColors(name)` helper.
   - Name `fontWeight: 600` (was 500).
   - Row `padding: 10px 0` (was `10px 4px`).
   - List wrapper `gap: 0` (was 2) — no separators.

### Fix 3 — Deterministic avatar color helper

Add a small helper (defined once, exported or duplicated in both files — I'll define inline at the top of each file since spec says only these two files):

```ts
const getAvatarColors = (name: string) => {
  const palette = [
    { bg: "#fde8da", text: "#c8622a" },
    { bg: "#d4edda", text: "#2d6a4f" },
    { bg: "#dce8f5", text: "#2c5f8a" },
    { bg: "#e8ddf5", text: "#6b3fa0" },
    { bg: "#f5e8d0", text: "#8a5c2a" },
  ];
  const ch = (name?.[0] || "A").toUpperCase().charCodeAt(0);
  return palette[ch % 5];
};
```

Used in:
- Picker list rows (key from `c.first_name`)
- LogStep1 contact chip avatar (key from `contactName`)

### Fix 4 — Step 1 layout (LogStep1.tsx)

1. **Contact chip avatar:** replace hardcoded `background: "#e8c4b0"` / `color: "#c8622a"` with `getAvatarColors(contactName).bg` / `.text`. Keep size 28px, font 11px.
2. **Outer wrapper:** add `flex: 1` to existing flex column (`display: flex; flexDirection: column; gap: 16; paddingTop: 8` → add `flex: 1`).
3. **Note card:** add `flex: 1; display: flex; flexDirection: column` to the card container.
4. **Textarea:** add `flex: 1` (keep `minHeight: 80` instead of current 100).
5. **Voice section wrapper** (the `borderTop` div, currently `marginTop: 12; paddingTop: 12`): add `display: flex; alignItems: center; gap: 12; flexShrink: 0`.
6. **"AI will summarise" caption:** in the **idle** state only, render a `<span>` to the right of the "Log with Voice" pill — `fontSize: 13`, `color: #888480`, Outfit, `flexShrink: 0`. Recording and Transcribing states get no caption (the pill remains the only child of the flex row).

### Preserved
- All `console.log` statements
- All voice recording logic, refs, state, transcribeAudio
- Bottom action area, nudge, Next button, skip link
- Quick-add form, all mutations, all step routing
- StepIndicator.tsx file itself (untouched)

### Checklist
- ✅ Only `LogInteractionSheet.tsx` and `LogStep1.tsx` touched
- ✅ StepIndicator import + render removed; component file untouched
- ✅ Crimson Pro "Who did you talk to?" header above search input
- ✅ Search pill: `1.5px solid #c8622a` border, no placeholder, no clear button
- ✅ "RECENT" label shown only when `!searchQuery`
- ✅ Deterministic avatar colors (5 pairs, `charCodeAt(0) % 5`) applied in picker + chip
- ✅ Note card uses `flex: 1` chain to fill height
- ✅ "AI will summarise" sits inline right of the voice pill (idle only)
- ✅ All `console.log` preserved

