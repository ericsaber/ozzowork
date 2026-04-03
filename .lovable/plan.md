

## Pre-Step 12: Fix remaining task_records references

Three surgical edits across three files.

### 1. `src/App.tsx` (line 40-44)

Replace `"task_records" as any` with `"interactions"` in the draft cleanup query. Keep the console.log.

### 2. `src/components/CelebrationHeader.tsx` (lines 27-32)

Replace the `task_records` query with a simpler `interactions` query filtered by `status: "published"`. Remove the `.not()` and `.or()` filters.

### 3. `src/pages/Contacts.tsx` (line 73)

Delete the `task_records` delete line. The `follow_up_edits`, `follow_ups`, and `interactions` deletes on lines 70-72 are sufficient.

