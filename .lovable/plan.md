

## Plan: Contact Picker Redesign + Slide Animation

**File:** `src/components/LogInteractionSheet.tsx`

### Part 1 — Contact picker redesign

**1.1 Remove 8-cap on no-query branch** (line 601):
```ts
if (!searchQuery) return contacts;  // was contacts.slice(0, 8)
```
Keep `.slice(0, 8)` on the search branch.

**1.2 Add `recentContactIds` query** (near the existing `contacts` useQuery):
- Query `interactions` filtered by `user_id`, `status = 'published'`, ordered by `connect_date` desc, limit 20.
- Deduplicate to top 3 distinct `contact_id`s.
- `enabled: open`.
- Includes `console.log("[recentContactIds] top 3:", ids)`.

**1.3 Derive `recentContacts`**:
```ts
const recentContacts = (recentContactIds || [])
  .map((id) => contacts?.find((c) => c.id === id))
  .filter(Boolean) as typeof contacts;
```

**1.4 Replace existing static "RECENT" label block (lines 743-758) and contact list rendering (lines 760-829)** with the new sectioned layout:
- Extract the contact-row JSX into a small inline `renderRow(c)` helper inside the picker block to avoid duplicating the avatar/button markup.
- When `!searchQuery`:
  - If `recentContacts.length > 0`: render "RECENT" section label (existing styling) followed by `recentContacts.map(renderRow)`.
  - Always render "ALL CONTACTS" section label (same styling, with appropriate `marginTop`) followed by `filteredContacts.map(renderRow)`.
- When `searchQuery` is active: no labels, just `filteredContacts.map(renderRow)` (current behavior, capped at 8).

### Part 2 — Slide animation on contact select

**2.1 Add state**:
```ts
const [slideOut, setSlideOut] = useState(false);
```

**2.2 Update `handleContactSelect`** (line 611) — also update the inline onClick on line 768-771 to call only `handleContactSelect(c.id)` (move `setStep(1)` into the helper):
```ts
const handleContactSelect = (id: string) => {
  setContactId(id);
  setSearchOpen(false);
  setSearchQuery("");
  setSlideOut(true);
  setTimeout(() => {
    setStep(1);
    setSlideOut(false);
  }, 220);
};
```

**2.3 Wrap picker content** (line 695 wrapper div) with transform + transition style driven by `slideOut`:
```tsx
style={{
  paddingTop: 20,
  transform: slideOut ? "translateX(-100%)" : "translateX(0)",
  opacity: slideOut ? 0 : 1,
  transition: "transform 220ms ease-out, opacity 220ms ease-out",
}}
```

**2.4 Wrap step 1 content** (line 876 wrapper div) with `animation: "slideInFromRight 280ms ease-out"`.

**2.5 Inject keyframes** via a `<style>` tag inside the component return (top of fragment):
```tsx
<style>{`@keyframes slideInFromRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}`}</style>
```

### Reset
Add `setSlideOut(false)` to `clearAndClose` reset block to be safe.

### Preserved
- All `console.log` statements (existing + new one in `recentContactIds`).
- Avatar palette helper, search input, quick-add panel, "+ Add" button — unchanged.
- Contact row visual (avatar, name, company) — unchanged.

### Checklist
- ✅ Only `LogInteractionSheet.tsx` touched
- ✅ `filteredContacts` no-query branch shows all contacts
- ✅ `recentContactIds` query fetches top 3 distinct by latest `connect_date`
- ✅ `recentContacts` derived from contacts list
- ✅ Picker shows "RECENT" (when data) + "ALL CONTACTS" sections when no search
- ✅ Search active → no labels, capped at 8
- ✅ `slideOut` state added, set in `handleContactSelect`
- ✅ Picker slides out left; step 1 slides in from right
- ✅ `slideInFromRight` keyframe defined via `<style>` tag
- ✅ All `console.log` preserved

