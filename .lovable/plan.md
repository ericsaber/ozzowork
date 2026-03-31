

## Step 7: Rewrite Upcoming screen for new schema

Single file: `Upcoming.tsx`

### Changes

1. **Query**: Replace `task_records` query with `follow_ups` query — filter by `status=active`, `planned_date > today`, ordered ascending. Add console.log for fetched count. Keep existing dedup logic.

2. **JSX field refs**: `item.planned_follow_up_date` → `item.planned_date`

3. **Navigation**: `navigate(/interaction/${item.id})` → `navigate(/contact/${item.contact_id})`

No other files touched. All existing console.log statements preserved.

