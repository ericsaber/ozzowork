

## Fix: InteractionDetail What's Next — show completed/cancelled state for standalone logs

### Problem
When `isStandaloneLog` is true and the related coin is completed or cancelled, the What's Next section falls through to "No active follow-up" instead of showing the actual state.

### Changes — `src/pages/InteractionDetail.tsx`

**1. Add console log** (after the existing `isStandaloneLog` console log, ~line 162)

When `isStandaloneLog && relatedCoin`, log:
```typescript
console.log('[InteractionDetail] standalone log related coin state:', { status: relatedCoin.status, planned_follow_up_date: relatedCoin.planned_follow_up_date, completed_at: relatedCoin.completed_at });
```

**2. Replace the standalone log branch in What's Next** (lines 315-345)

Replace the current two-branch logic (`coinHasActiveFollowUp` / "No active follow-up") with four states:

- **`relatedCoin.status === 'active'` + `planned_follow_up_date`**: Show follow-up with overdue/due logic, green icon+badge (existing active rendering, keep as-is)
- **`relatedCoin.status === 'completed'`**: Green icon, text: `"Follow-up was planned for [planned_follow_up_date] · Completed [completed_at]"` — plain text, no buttons
- **`relatedCoin.status === 'cancelled'`**: Gray icon, text: `"Follow-up cancelled · Was due [planned_follow_up_date]"` — plain text, no buttons
- **Otherwise** (no relatedCoin or no planned date): Render nothing — hide the entire What's Next section including the header and divider

**3. Conditionally hide divider + What's Next section**

Wrap the divider and What's Next `div` in a condition: only render when `!isStandaloneLog || (relatedCoin && relatedCoin.planned_follow_up_date)`. This hides the section entirely when the related coin has no follow-up data.

### Technical detail

The completed/cancelled branches use `CalendarIcon` in a green (#e9f2eb/#3d7a4a) or gray (#f0ede8/#9e9e99) icon box respectively, matching existing visual patterns. All existing console.logs remain.

