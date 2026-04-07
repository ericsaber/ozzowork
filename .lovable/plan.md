

## Single-edit enforcement + keyboard scroll fix

### Files changed: 3

---

### 1. FollowupCard.tsx

**Props** — add three optional props to `FollowupCardProps`:
```ts
isEditingExternal?: boolean;
onEditStart?: () => void;
onEditEnd?: () => void;
```

**Edit state** — the rendering condition becomes `const showEditPanel = isEditingExternal ?? isEditing;` so the component stays backwards-compatible.

**`handleStartEdit`** (line 82-87) — add `onEditStart?.()` call alongside existing logic. Remove `setIsEditing(true)` when `onEditStart` is provided (use: `if (!onEditStart) setIsEditing(true); onEditStart?.();`).

**`handleCancelEdit`** (line 89-91) — add `onEditEnd?.()`. Only call `setIsEditing(false)` if no external control.

**`handleSave`** (line 128) — replace `setIsEditing(false)` with same pattern: `onEditEnd?.(); if (!onEditStart) setIsEditing(false);`.

**Reminder input onFocus** — replace current `scrollIntoView` with 300ms-delayed version:
```tsx
onFocus={(e) => {
  const target = e.target;
  setTimeout(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
}}
```

All `console.log` statements preserved. All existing styles unchanged.

---

### 2. Today.tsx

**New state** (after line 34):
```ts
const [editingCardId, setEditingCardId] = useState<string | null>(null);
const [keyboardHeight, setKeyboardHeight] = useState(0);
```

**New useEffect** for keyboard padding:
```ts
useEffect(() => {
  const vv = window.visualViewport;
  if (!vv) return;
  const onResize = () => {
    const kb = window.innerHeight - vv.height;
    setKeyboardHeight(kb > 0 ? kb : 0);
  };
  vv.addEventListener("resize", onResize);
  return () => vv.removeEventListener("resize", onResize);
}, []);
```

**Import** `useEffect` (add to existing `useState` import).

**Outermost div** (line 183) — add `style={{ paddingBottom: keyboardHeight }}` merged with existing className padding.

**`renderCard`** (line 121-148) — add three new props to `FollowupCard`:
```tsx
isEditingExternal={editingCardId === item.id}
onEditStart={() => setEditingCardId(item.id)}
onEditEnd={() => setEditingCardId(null)}
```

---

### 3. Upcoming.tsx

Same pattern as Today.tsx:
- Add `editingCardId` and `keyboardHeight` state
- Add `useEffect` for visualViewport resize
- Add `paddingBottom: keyboardHeight` to outermost div (line 97)
- Pass `isEditingExternal`, `onEditStart`, `onEditEnd` to each `FollowupCard` (lines 108-132)
- Import `useEffect`

---

### No other files touched.

