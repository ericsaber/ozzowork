

## ContactHistory.tsx — Four Display Fixes

### 1. Extract Last Interaction as featured card (lines 303–310, 452–478)

Before the timeline loop, find the first `timelineItem` where `kind === 'interaction'` and the record has `connect_type || note`. Store its `record.id` as `featuredId`.

Render it above the timeline as a white card with:
- Accent icon bg `#f5ede7`, icon color `#c8622a`
- Verb bold, date muted, note italic Crimson Pro
- `bg-white rounded-xl shadow-sm p-3`, tappable → `/interaction/${record.id}`, chevron
- Under label "LAST INTERACTION" (same styling as other section labels)

In the timeline loop, skip any interaction item where `record.id === featuredId`. Also remove the `firstInteractionRendered` accent logic (lines 458–460) since the featured card handles it — all remaining interaction rows use gray `#f0ede8`.

### 2. Dividers between timeline rows (line 332, 357, 390, 426, 463)

Add `border-bottom: 1px solid var(--border)` to each timeline row (events and interactions) except the last. Use conditional: `idx < timelineItems.length - 1` (accounting for the skipped featured item — use a filtered array or counter). Simplest: wrap in a container and use `divide-y divide-border` on the parent `<div className="space-y-0">` → change to `<div className="divide-y divide-border">`.

### 3. Note conditional — check for empty string (line 472–474)

Change `{record.note && (` to `{record.note && record.note.trim() && (` on the note rendering in the regular interaction row. This handles both null and empty string.

### 4. Event row text size (line 337)

Change `fontSize: "12px"` to `fontSize: "14px"` on the event row label `<span>`.

### Files modified

| File | Changes |
|------|---------|
| `src/pages/ContactHistory.tsx` | All four fixes |

