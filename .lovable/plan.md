

## Plan: Address Field + Quick-add Auto-advance

### Prerequisite — Migration

Add `address` column to `contacts` via migration tool (no manual SQL needed):
```sql
ALTER TABLE contacts ADD COLUMN address text;
```

### Files in scope
1. `src/components/LogInteractionSheet.tsx`
2. `src/pages/Contacts.tsx`
3. `src/pages/ContactHistory.tsx`

---

### Fix 1 — Quick-add auto-advances (LogInteractionSheet.tsx, line 246-250)

Replace `quickAddContact.onSuccess` body — drop the toast, call `handleContactSelect(data.id)` to trigger slide animation:
```ts
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ["contacts"] });
  setShowQuickAdd(false);
  setQuickForm({ first_name: "", last_name: "", company: "", phone: "", email: "", address: "" });
  handleContactSelect(data.id);
},
```

### Fix 2 — Address in quick-add (LogInteractionSheet.tsx)

- Line 87 (initial state): add `address: ""`
- Line 151 (clearAndClose reset): add `address: ""`
- Line 233-242 (mutation insert): add `address: quickForm.address || null`
- Line ~925 (picker quick-add form): add Address `<Input>` after Email
- Line ~955 (step 1 quick-add form): add Address `<Input>` after Email

### Fix 3 — Address in Contacts.tsx new contact form

- `form` initial state: add `address: ""`
- Reset after submit: add `address: ""`
- `addContact` mutation insert: add `address: d.address || null`
- After Email `<Input>` in `showAdd` panel: add Address `<Input>`
- `handlePickFromPhone` `contactData` object: add `address: ""`

### Fix 4 — Address display + edit on ContactHistory.tsx

- Imports (line 6-8): add `MapPin` to lucide-react import
- Line 48 (form state): add `address: ""`
- Line 200-203 (updateContact mutation): add `address: form.address || null`
- Line 238 (startEditing): add `address: contact.address || ""`
- Line 442 (edit form, after Email Input): add Address `<Input>`
- Line 260 area (contact header, after company `<p>`): add maps link block:
```tsx
{contact.address && (
  <a href={`https://maps.google.com/maps?q=${encodeURIComponent(contact.address)}`}
     target="_blank" rel="noopener noreferrer"
     style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13,
              color: "#c8622a", fontFamily: "var(--font-body)",
              textDecoration: "none", marginTop: 2 }}>
    <MapPin size={13} color="#c8622a" />
    {contact.address}
  </a>
)}
```

### Preserved
- All `console.log` statements (e.g., line 612 `[draft] contact changed`, `[recentContactIds]`, etc.)
- Slide animation behavior (handleContactSelect already triggers it)
- All other component logic

### Checklist
- ✅ Only 3 files touched + 1 migration
- ✅ Quick-add `onSuccess` calls `handleContactSelect(data.id)`, no toast
- ✅ `quickForm` includes `address` in all initial/reset states
- ✅ Address Input added to both quick-add form locations (picker + step 1)
- ✅ Quick-add mutation insert includes `address`
- ✅ Contacts.tsx form + mutation + handlePickFromPhone include `address`
- ✅ ContactHistory shows address as MapPin tappable maps link
- ✅ `MapPin` imported from lucide-react
- ✅ Edit form includes address; startEditing populates; mutation saves
- ✅ All `console.log` preserved

