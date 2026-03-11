

## Plan: Two-State Celebration Header in CompleteFollowupSheet

### What changes

Extract the celebration header into a new component `CelebrationHeader` that queries `interaction_count` for the contact and renders one of two states.

### New component: `src/components/CelebrationHeader.tsx`

**On mount** (when `open` becomes true), query interaction count:
```ts
const { count } = await supabase
  .from("interactions")
  .select("id", { count: "exact", head: true })
  .eq("contact_id", contactId);
```

**STATE 1 — First-time (count === 1)**
- Layout: flex row, items-center, gap-12px, padding 18px 20px 16px, border-bottom 1px divider
- Left: 36×36px animated circle with gradient bg (`linear-gradient(135deg, #e8794a, #c8622a)`), box-shadow, containing animated checkmark SVG
- Animation sequence on mount using CSS keyframes:
  - Circle springs in: scale 0→1.18→0.94→1.0, opacity 0→1, 420ms cubic-bezier(0.34,1.56,0.64,1)
  - Ripple ring: accent border-only ring expands 36px→80px and fades out, 600ms ease-out, 100ms delay
  - Checkmark draws: stroke-dashoffset 30→0, 300ms ease-out, 280ms delay
  - Text fades up: opacity 0→1, translateY 6→0, 300ms ease-out, 150ms delay
- Title: "Nice work." in Instrument Serif 21px, period in accent color
- Subtitle: "Logging with **{contactName}**" in 11px DM Sans muted

**STATE 2 — Repeat (count > 1)**
- Same layout, no spring animation — simple scale pop (0.85→1.0, 250ms ease-out)
- Left: 36×36px circle, `#f0ede8` bg, 1.5px border-color border, plain checkmark in muted (#bbb)
- Title: "Done." in DM Sans 18px weight 500 (not serif)
- Subtitle: "{contactName} · {N}th interaction" with ordinal suffix helper

### CSS Keyframes

Add custom keyframes to `src/index.css` (or inline via `@keyframes` in the component using a `<style>` tag or tailwind config):
- `spring-in`: scale transform sequence
- `ripple-expand`: border ring expand + fade
- `check-draw`: stroke-dashoffset animation
- `fade-up`: opacity + translateY

### Changes to `CompleteFollowupSheet.tsx`

Replace the current hardcoded celebration header (lines 122-136) with:
```tsx
<CelebrationHeader contactId={contactId} contactName={contactName} open={open} />
```

### Ordinal suffix helper

Simple utility function in the component:
```ts
const ordinal = (n: number) => {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
};
```

### Files

| Action | File |
|--------|------|
| Create | `src/components/CelebrationHeader.tsx` |
| Edit | `src/components/CompleteFollowupSheet.tsx` (replace header with new component) |

