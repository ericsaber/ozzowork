

## Step 11: Delete old pages and components

### Summary

Delete 4 obsolete files and clean up their references in `App.tsx`. No other files import them.

### Import analysis

| File to delete | Imported by |
|---|---|
| `InteractionDetail.tsx` | `App.tsx` (import + route) |
| `EditTaskRecord.tsx` | `App.tsx` (import + route) |
| `RescheduleSheet.tsx` | `InteractionDetail.tsx` only (being deleted) |
| `ScheduleFollowupSheet.tsx` | No imports found |

### Changes

**1. `src/App.tsx`** — Remove 2 imports and 2 routes

- Remove `import InteractionDetail from "./pages/InteractionDetail";` (line 14)
- Remove `import EditTaskRecord from "./pages/EditTaskRecord";` (line 15)
- Remove `<Route path="/interaction/:id" element={<InteractionDetail />} />` (line 70)
- Remove `<Route path="/edit-task/:id" element={<EditTaskRecord />} />` (line 71)
- Keep `FollowupTask` import and `/followup/:id` route (still used as redirect)

**2. Delete files**

- `src/pages/InteractionDetail.tsx`
- `src/pages/EditTaskRecord.tsx`
- `src/components/RescheduleSheet.tsx`
- `src/components/ScheduleFollowupSheet.tsx`

No other files reference any of these four.

