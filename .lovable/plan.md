

## Fix: Contacts Action Buttons on One Line

The preview is 390px wide (standard mobile). The three buttons overflow because of `flex-wrap`, `gap-2` (8px), and `px-3` padding inside each `size="sm"` button.

### Change in `src/pages/Contacts.tsx` (line 235)

- Remove `flex-wrap` from the container
- Change `gap-2` → `gap-1.5` (6px)
- On each button: change `gap-1.5` → `gap-1` and add slightly tighter horizontal padding via `px-2.5` instead of the default `px-3`

This shaves ~12px total, enough to fit all three at 390px.

