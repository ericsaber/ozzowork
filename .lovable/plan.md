

## Plan: Prompt 2c — OutstandingFollowupStep Rewrite

**Files:** `src/components/OutstandingFollowupStep.tsx` (full rewrite), `src/components/LogInteractionSheet.tsx` (cleanup + wiring).

### Part 1 — `OutstandingFollowupStep.tsx` (full rewrite)

**New props interface:**
```ts
interface OutstandingFollowupStepProps {
  existingFollowup: {
    id: string;
    planned_type: string | null;
    planned_date: string;
    status: string;
    reminder_note?: string | null;
  };
  contactName: string;
  onUpdate: (newDate: string) => void;
  onCancel: () => void;
  onChoiceChange?: (choice: "keep" | "reschedule" | "cancel" | null, rescheduleDate: string) => void;
}
```
Removed: `onComplete`, `onBack`. (No internal Save button — Save lives in parent's bottom area.)

**State:**
- `choice: "keep" | "reschedule" | "cancel" | null` (default null)
- `rescheduleDate: string` (default "")
- `showCalendar: boolean` (default false)
- `useEffect` emits `onChoiceChange?.(choice, rescheduleDate)` whenever either changes.
- Preserve existing on-mount `console.log`.

**Layout (flex column, padding-top 20):**

1. **Heading (Crimson Pro 26px, weight 500, color #1c1a17, line-height 1.2, marginBottom 16):**  
   `{contactName} has an active follow-up. What would you like to do with it?`

2. **Trimmed white card** (background `white`, border `1px solid #e8e4de`, radius 16, padding `12px 14px`):
   - Type row: Lucide icon (Phone/Mail/MessageSquare/Users/Video, fallback CalendarIcon) 15px + `[TypeLabel] · [due-date string]` (14px, weight 600, Outfit). Color depends on status — overdue `#c0392b`, today `#2d6a4f`, upcoming `#c8622a`. Status-tinted `border-top` color preserved on the reminder row only.
   - Due-date string: "Was due Apr 7" / "Today" / "Apr 14".
   - Reminder row (only when `reminder_note` exists): `border-top: 1px dashed #d8d4ce`, `paddingTop 8`, Lucide `CornerDownRight` 13px `#888480`, text 12px italic `#6b6860` Outfit.

3. **Three option cards** (full width, text-left, radius 16, padding `13px 14px`, border 1.5px):
   - **Keep as-is** — sub: "Leave it active, nothing changes"
   - **Reschedule** — sub: "Move it to a new date" — when selected, reveals inline date picker below
   - **Cancel it** — sub: "Remove this follow-up entirely" — danger styling
   
   Default: bg `#faf8f5`, border `#e8e4de`, title `#1c1a17` (14px weight 600 Outfit), sub `#888480` 12px.  
   Selected (non-danger): border `#c8622a`, bg `#fdf4f0`, title `#c8622a`.  
   Danger unselected: border `#f5c4c4`, title `#b03030`.  
   Danger selected: bg `#fdecea`, border `#f5b8b4`, title `#b03030`.  
   Tapping a selected card toggles back to null.

4. **Reschedule inline picker** (only when `choice === "reschedule"`, marginTop 12):
   - 2×2 grid of chips: Tomorrow / 3 days / 1 week / 2 weeks. Selected chip: bg `#fdf4f0`, border 1.5px `#c8622a`, text sienna. Unselected: bg `#faf8f5`, border 1px `#e8e4de`. Radius 12, padding `13px 8px`, 14px Outfit.
   - **Pick date** full-width button below grid → toggles `showCalendar`.
   - Inline calendar card when `showCalendar` (bg `#faf8f5`, border `1px solid #e8e4de`, radius 12, overflow hidden, marginTop 8): shadcn `<Calendar mode="single">` with `disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}`. Selecting a date sets `rescheduleDate` and closes calendar.

### Part 2 — `LogInteractionSheet.tsx` cleanup + wiring

1. **Active follow-up query** (line 120): change select to  
   `"id, planned_type, planned_date, status, reminder_note"`.

2. **State** (near other pending state, ~line 89):
   ```ts
   const [outstandingChoice, setOutstandingChoice] = useState<"keep" | "reschedule" | "cancel" | null>(null);
   const [outstandingDate, setOutstandingDate] = useState("");
   ```
   Reset both inside `clearAndClose` (after `setPendingReminder("")`).

3. **Step union — remove step 3:**  
   `useState<"contact-picker" | 1 | "outstanding" | 2>` everywhere (`getInitialStep` return type, `useState` generic).

4. **Remove `handleOutstandingComplete`** entirely.

5. **`handleStepBack`** — drop the `step === 3` branch.

6. **OutstandingFollowupStep call site** (line 860–869): remove `onComplete` and `onBack`, add `onChoiceChange`:
   ```tsx
   <OutstandingFollowupStep
     existingFollowup={existingFollowup}
     contactName={contactName}
     onUpdate={handleOutstandingUpdate}
     onCancel={handleOutstandingCancel}
     onChoiceChange={(choice, date) => {
       setOutstandingChoice(choice);
       setOutstandingDate(date);
     }}
   />
   ```

7. **Remove the `step === 3` render block** (lines 890–907) entirely.

8. **Add fixed bottom Save area** when `step === "outstanding"` (alongside the existing step 1 bottom block, before the closing `</FullscreenTakeover>`):
   ```tsx
   {step === "outstanding" && (
     <div style={{ flexShrink: 0, padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
       <button
         onClick={() => {
           console.log("[LogInteractionSheet] outstanding save:", { outstandingChoice, outstandingDate });
           if (outstandingChoice === "keep") handleOutstandingUpdate(existingFollowup!.planned_date);
           else if (outstandingChoice === "reschedule") handleOutstandingUpdate(outstandingDate);
           else if (outstandingChoice === "cancel") handleOutstandingCancel();
         }}
         disabled={!outstandingChoice || (outstandingChoice === "reschedule" && !outstandingDate)}
         style={{ /* sienna pill when valid, #ddd8d1/#b0ada8 when disabled, radius 100, padding 15, Outfit 16/500, ArrowRight 18px */ }}
       >
         Save <ArrowRight size={18} />
       </button>
     </div>
   )}
   ```

9. **StepIndicator** — already hidden for `"outstanding"`; verify no `step === 3` reference remains.

### Preserved
- All `console.log` statements (mount log in OutstandingFollowupStep, all log calls in LogInteractionSheet).
- `CompleteFollowupSheet` untouched.
- `handleOutstandingUpdate`, `handleOutstandingCancel`, `handleOutstandingCancelConfirm`, `handleSkip`, `followupMutation`, `logMutation` unchanged.
- Cancel confirm AlertDialog flow unchanged.

### Checklist
- ✅ Only `OutstandingFollowupStep.tsx` and `LogInteractionSheet.tsx` touched
- ✅ `onComplete` / `onBack` removed from interface and call site
- ✅ `reminder_note` added to type and to query select
- ✅ Crimson Pro 26px question heading; no separate title label
- ✅ Trimmed card: type row + optional reminder, no name/company
- ✅ Three options: Keep as-is / Reschedule / Cancel
- ✅ Reschedule reveals inline 2×2 chips + Pick date + inline shadcn Calendar (no Popover)
- ✅ `onChoiceChange` emitted via useEffect on `choice`/`rescheduleDate`
- ✅ Save in parent fixed bottom area, gated by valid choice
- ✅ Step 3 removed from union, render, mutation routing, and `handleStepBack`
- ✅ `handleOutstandingComplete` removed
- ✅ `outstandingChoice` / `outstandingDate` added and reset in `clearAndClose`
- ✅ All `console.log` preserved
- ✅ `CompleteFollowupSheet` not touched

