

## Plan: Active Follow-up Alert Redesign

**File:** `src/components/LogStep1.tsx`

### Changes

**1. Add `firstName` helper** (near existing `initials` derivation):
```tsx
const firstName = contactName ? contactName.split(" ")[0] : "";
```

**2. Add `alertRevealed` state + reveal effect** (with other hooks):
```tsx
const [alertRevealed, setAlertRevealed] = useState(false);

useEffect(() => {
  if (canNext && !alertRevealed) setAlertRevealed(true);
}, [canNext, alertRevealed]);
```
Note: `canNext` is computed before the return — keep this order.

**3. Compute alert visibility flag** (after `canNext`):
```tsx
const showAlert = !!(activeFollowup && onSaveLogOnly && (isContactPrefilled || alertRevealed));
```

**4. Replace the existing nudge card** in the bottom action area with the new unified alert (icon circle + first-name text + two side-by-side buttons: "Save Log Only" primary sienna, "Next →" secondary white/sienna outline). Rendered only when `showAlert`.

**5. Update regular Next button reveal** so it hides when the alert is showing:
```tsx
maxHeight: (canNext && !showAlert) ? "60px" : "0",
opacity:   (canNext && !showAlert) ? 1 : 0,
```

### Behavior summary

| Entry point | `isContactPrefilled` | Alert shows |
|---|---|---|
| Log it from card | true | immediately |
| FAB | false | after first user action (canNext flips true) |

Regular Next button is suppressed whenever the alert is visible — alert's secondary "Next →" button calls `onNext` instead.

### Preserved
- All `console.log` statements
- `ArrowRight` and `CalendarIcon` already imported — no import changes
- All other component logic, recording flow, accordion, contact chip
- Skip log link (renders independently when `onSkipLog` provided)

### Checklist
- ✅ Only `LogStep1.tsx` touched
- ✅ `firstName` helper added
- ✅ `alertRevealed` state + `useEffect` reveal trigger added
- ✅ Alert visible when `activeFollowup && onSaveLogOnly && (isContactPrefilled || alertRevealed)`
- ✅ Old nudge card removed entirely
- ✅ New alert: icon circle + first name + two side-by-side buttons
- ✅ "Save Log Only" = filled sienna primary, calls `onSaveLogOnly`
- ✅ "Next →" = white/sienna outline secondary, calls `onNext`
- ✅ Regular Next button hidden when alert visible
- ✅ All `console.log` preserved

