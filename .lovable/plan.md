

## Font Size & Spacing Fixes

### Changes

**1. FollowupCard.tsx — Bump minimum font to 12px, body to 14px**
- Company name: `text-[11px]` → `text-[12px]`
- "LAST INTERACTION" label: `text-[11px]` → `text-[12px]`
- Note text: `text-[12px]` → `text-[14px]` (body default)

**2. Today.tsx — Section labels to 12px, Coming Up strip spacing & pill size**
- "DUE TODAY" / "OVERDUE" labels: `text-[11px]` → `text-[12px]`
- "See all" pill: `text-[10px]` → `text-[12px]`, Eye icon `11` → `12`
- "X this week" text: `text-[11px]` → `text-[12px]`
- Coming Up strip: add `space-y-3` wrapper or change parent from `space-y-0` to allow natural flow — actually the simplest fix is to wrap sections with consistent gaps. The "Coming Up" button sits inside the same `space-y-0` div so `mt-8` should work but since the previous section's last card has no bottom margin, the gap is only from `mt-8`. The screenshot shows it's still too tight, so bump to `mt-10` to give more breathing room equivalent to the Overdue gap below it.

### Files

| File | Changes |
|------|---------|
| `src/components/FollowupCard.tsx` | Company `12px`, label `12px`, note `14px` |
| `src/pages/Today.tsx` | Section labels `12px`, pill `12px`, strip sub-text `12px`, strip margin `mt-10` |

