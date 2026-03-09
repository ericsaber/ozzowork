

## Update pill font size and properties

Based on the screenshots, the user wants two font specs applied:

- **14px**: weight 500, line-height 20px
- **12px**: weight 500, line-height 16px

The pills (due date badges) in `FollowupCard.tsx` are currently `text-[12px] font-medium`. Update them to `text-[14px] font-medium leading-[20px]`.

Also update the "See all" pill in `Today.tsx` (line ~185) from `text-[12px]` to `text-[14px] leading-[20px]`.

While at it, ensure all 12px elements have `leading-[16px]` and all 14px elements have `leading-[20px]` for consistency.

| File | Lines | Change |
|------|-------|--------|
| `src/components/FollowupCard.tsx` | ~79, ~85 | Overdue and Today pill spans: `text-[12px]` → `text-[14px] leading-[20px]` |
| `src/pages/Today.tsx` | ~185 | "See all" pill: `text-[12px]` → `text-[14px] leading-[20px]` |

