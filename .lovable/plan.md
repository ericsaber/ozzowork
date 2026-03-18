

## Task Record Fixes — 3 Changes

### Fix 1: Edit screen — pre-select existing follow-up date and type on mount

**File: `src/pages/EditTaskRecord.tsx`** — `useEffect` block (lines 60-71)

The `followUpDate` is already set to `task.planned_follow_up_date` (line 69), and `followUpType` to `task.planned_follow_up_type` (line 68). The issue is that the date chips compare against dynamically computed dates (`chip.date()` called at render time), so an existing date will only match a chip if it happens to equal one of today's computed values.

The date chips already handle this — if `followUpDate === chipDate` it highlights. The problem is when the existing date doesn't match any chip: no visual indication appears. 

**Fix:** After the date chips row (line 239-249), when `followUpDate` is set but doesn't match any chip's computed value, render an inline custom-date display chip (selected style) showing the formatted date with a × dismiss button. This is the same treatment as when a user picks a custom date via the calendar.

Add after line 249 (after the Popover closing tag), inside the flex-wrap container:

```tsx
{followUpDate && !dateChips.some(c => c.date() === followUpDate) && (
  <span className="inline-flex items-center gap-1.5 rounded-[20px] px-[11px] py-[5px] text-[10px] font-medium bg-[#f5ede7] border-[1.5px] border-[#e8c4a8] text-[#c8622a]" style={{ fontFamily: "var(--font-body)" }}>
    <CalendarIcon size={10} />
    {format(new Date(followUpDate + "T00:00:00"), "EEE, MMM d")}
    <button onClick={() => setFollowUpDate("")} className="ml-0.5 text-[#c8622a] hover:opacity-70">×</button>
  </span>
)}
```

The `followUpType` pre-selection already works via `followUpType === t.value` comparison on line 219-220. No change needed there.

### Fix 2: Task record view — "Want to add one?" nudge for no-interaction state

**File: `src/pages/InteractionDetail.tsx`** — lines 199-203

Currently shows plain muted text "No interaction logged." when `!hasInteraction`. Add a "Want to add one?" link that navigates to the log interaction flow with the contact pre-filled.

The app uses `LogInteractionSheet` opened from `BottomNav` or `ContactHistory`. The simplest pattern matching this file: add a `LogInteractionSheet` state + component, and open it on tap.

**Changes:**
- Add state: `const [logSheetOpen, setLogSheetOpen] = useState(false);`
- Replace lines 200-202 with nudge including link:
```tsx
<p className="text-[13px]" style={{ color: "#7a746c", fontFamily: "var(--font-body)" }}>
  No interaction logged.{" "}
  <button onClick={() => setLogSheetOpen(true)} className="underline font-medium" style={{ color: "#c8622a" }}>
    Want to add one?
  </button>
</p>
```
- Add `LogInteractionSheet` component at bottom (near other sheets ~line 271):
```tsx
<LogInteractionSheet open={logSheetOpen} onOpenChange={setLogSheetOpen} preselectedContactId={task.contact_id} />
```
- Add import for `LogInteractionSheet`

### Fix 3: After deletion, navigate to contact record

**File: `src/pages/EditTaskRecord.tsx`** — `deleteMutation.onSuccess` (line 127-129)

Currently: `navigate(-1)` which goes back to the now-deleted record's detail view.

Change to: `navigate(`/contact/${task.contact_id}`, { replace: true })` — navigates to the contact record and replaces the history entry so the user can't go back to the deleted record.

```tsx
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["task-records"] });
  toast.success("Record deleted");
  navigate(`/contact/${task.contact_id}`, { replace: true });
},
```

### Files changed (2)
1. `src/pages/EditTaskRecord.tsx` — custom date chip display on mount + deletion navigation
2. `src/pages/InteractionDetail.tsx` — "Want to add one?" nudge + LogInteractionSheet

