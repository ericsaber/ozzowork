

## Plan: Simplify StepIndicator — Remove Expanded Step 2 Mode

Update the plan in `.lovable/plan.md` to revise Task 2 (Redesigned Stepper) and Task 4 (LogStep2):

### Changes to Task 2 (StepIndicator)
- Remove `expandStep2` prop entirely
- No expanded mode on step 2 — stepper is identical in structure on both steps
- Step circles: 22px, always show number
- Active step: transparent + 1.5px `#c8622a` border, sienna number
- Completed step: solid `#c8622a` fill, white number  
- Inactive step: muted gray fill, gray number
- Labels: 9px uppercase below circles, always same size
- No "Step 2" label above circle, no 22px heading rendering, no conditional expansion logic

### Changes to Task 4 (LogStep2)
- LogStep2 still needs its own "What's next?" heading since the stepper no longer provides it
- Add a standalone "What's next?" heading in Crimson Pro below the stepper (separate from the stepper component itself)

### File: `.lovable/plan.md`
Update the plan text to reflect these simplifications.

