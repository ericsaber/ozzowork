

## Add console.log to Calendar onSelect

### File: `src/components/InlineInteractionEdit.tsx`

**Line 131**: Insert `console.log('[InlineInteractionEdit] date selected:', d);` immediately after the `if (d) {` check, before `setEditDate`.

```ts
onSelect={(d) => {
  if (d) {
    console.log('[InlineInteractionEdit] date selected:', d);
    setEditDate(format(d, "yyyy-MM-dd"));
    setShowDatePicker(false);
  }
}}
```

No other changes.

