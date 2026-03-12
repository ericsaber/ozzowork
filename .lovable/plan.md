

## Changes

### 1. Add "Follow-up Task" header to task record (`src/pages/FollowupTask.tsx`)

Insert a header between the nav bar and the follow-up card (after line 291, before the follow-up card at line 293):

```
<p style={{ fontFamily: "var(--font-body)", fontSize: "9px", letterSpacing: "0.1em" }}
   className="font-medium uppercase text-[#bbb] mb-3">
  Follow-up Task
</p>
```

### 2. Make interaction history items tappable (`src/pages/ContactHistory.tsx`)

In the interaction history section (lines 391-444), wrap each row in a tappable container that navigates to `/interaction/${item.id}`. Changes:

- Replace the outer `<div>` (line 392) with a `<button>` that has `onClick={() => navigate(`/interaction/${item.id}`)}` plus tap states (`hover:bg-secondary/50 rounded-lg active:scale-[0.98] transition-all cursor-pointer`)
- Add a `<ChevronRight size={14}>` on the far right of each row (before the existing `···` menu)
- Import `ChevronRight` from lucide-react (it may already be imported — need to check; it's not in the current imports, so add it)
- The `···` menu stays but should use `e.stopPropagation()` on its trigger to prevent navigation when tapping the menu

### 3. Redesign Interaction Detail screen (`src/pages/InteractionDetail.tsx`)

The current screen doesn't match the screenshot. Major changes to the interaction card layout:

**Interaction card (lines 256-322):**
- Add "INTERACTION" section label (uppercase, muted, small) on the left of header
- Move the connect type pill (e.g. "Called") to the right of the header row — burnt sienna styling instead of current muted grey
- Remove contact name from the interaction card (it belongs in the follow-up card below)
- Add full date in Instrument Serif (e.g. "Monday, Mar 10") as a prominent heading below the header divider
- Note text below the date

**Follow-up card (lines 324-404):**
- Restructure to match the task record's follow-up card: "FOLLOW-UP" label, circle check, contact name + company, footer strip with type badge + due status
- Contact name should be tappable (navigate to `/contact/${contact.id}`)
- If no follow-up linked, show a minimal "No follow-up" state

**Edit history section (lines 407-438):**
- Already present and functional — keep as-is, it matches the pattern from FollowupTask

