

## Plan: Add discard dialog to CompleteFollowupSheet

**File:** `src/components/CompleteFollowupSheet.tsx` only.

### Changes

1. **Imports** — add AlertDialog primitives:
   ```tsx
   import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
   } from "@/components/ui/alert-dialog";
   ```

2. **State** — add alongside existing `useState` calls:
   ```tsx
   const [showDiscardDialog, setShowDiscardDialog] = useState(false);
   ```

3. **isDirty** — baseline accounts for `plannedType` pre-fill:
   ```tsx
   const isDirty = !!draftId || note.trim().length > 0 || connectType !== (plannedType || "");
   ```

4. **handleOpen interceptor** — added above the `return`:
   ```tsx
   const handleOpen = (o: boolean) => {
     if (!o) {
       if (isDirty) {
         setShowDiscardDialog(true);
         return;
       }
       handleClose();
     }
   };
   ```

5. **Wire to FullscreenTakeover** — replace inline arrow:
   ```tsx
   <FullscreenTakeover open={open} onOpenChange={handleOpen}>
   ```

6. **Wrap return in fragment** and append AlertDialog after `</FullscreenTakeover>`:
   - `AlertDialogContent` gets `className="z-[60]"` to sit above the sheet (z-50).
   - "Keep editing" reopens via `requestAnimationFrame(() => handleOpen(true))` — note: spec says `onOpenChange(true)` but this component doesn't expose `onOpenChange` from props in the same way; the equivalent is to simply close the dialog and leave the sheet open (it never actually closed because `handleOpen` returned early). So Cancel just calls `setShowDiscardDialog(false)` — no need to reopen.
   - "Discard" deletes the draft row (if any), logs the deletion, then calls `handleClose()`.

   Final dialog block:
   ```tsx
   <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
     <AlertDialogContent className="z-[60]">
       <AlertDialogHeader>
         <AlertDialogTitle>Discard this log?</AlertDialogTitle>
         <AlertDialogDescription>
           You have unsaved changes that will be lost.
         </AlertDialogDescription>
       </AlertDialogHeader>
       <AlertDialogFooter>
         <AlertDialogCancel onClick={() => setShowDiscardDialog(false)}>
           Keep editing
         </AlertDialogCancel>
         <AlertDialogAction onClick={async () => {
           setShowDiscardDialog(false);
           if (draftId) {
             await supabase.from("interactions").delete().eq("id", draftId);
             console.log("[completion] discarded interaction draft:", draftId);
           }
           handleClose();
         }}>
           Discard
         </AlertDialogAction>
       </AlertDialogFooter>
     </AlertDialogContent>
   </AlertDialog>
   ```

### Animation fallback
Not applied. `FullscreenTakeover.tsx` already at 420ms. Wait for visual QA after Issue 1 lands before touching it.

### Preserved
- All `console.log` statements
- Props interface unchanged
- All mutations, state, query invalidation logic unchanged
- The follow-up specific completion flow (mark followup completed, publish draft, insert new follow-up) untouched

### Checklist
- ✅ Only `CompleteFollowupSheet.tsx` touched
- ✅ `isDirty` baseline = `connectType !== (plannedType || "")` to ignore pre-fill
- ✅ `handleOpen` wired to `FullscreenTakeover`
- ✅ `AlertDialogContent` at `z-[60]`
- ✅ Discard deletes draft if present
- ✅ All `console.log` preserved

