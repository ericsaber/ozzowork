

## Fix keyboard covering reminder input in FollowupCard.tsx

### What
Replace the `onFocus` handler on the reminder note `<input>` in the inline edit panel with a smarter scroll approach that uses `visualViewport` to calculate the exact visible area above the keyboard.

### File: `src/components/FollowupCard.tsx`

Replace the current `onFocus` handler (which does a simple `scrollIntoView` with 300ms delay) with:

```tsx
onFocus={(e) => {
  const input = e.target;
  setTimeout(() => {
    const vv = window.visualViewport;
    if (!vv) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const rect = input.getBoundingClientRect();
    const visibleBottom = vv.offsetTop + vv.height;
    if (rect.bottom > visibleBottom) {
      const offset = rect.bottom - visibleBottom + 24;
      window.scrollBy({ top: offset, behavior: 'smooth' });
    }
  }, 350);
}}
```

No other changes. All `console.log` statements preserved. No other files touched.

