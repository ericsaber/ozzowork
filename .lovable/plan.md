

## Plan: Structured Address Fields

Replace the single `address` text field with five structured fields (`street`, `street2`, `city`, `state`, `zip`) across three form locations + the contact-record display, with progressive-disclosure UI ("+ Add address" button that expands the section).

### Database migration

The `contacts` table currently only has an `address` text column. I'll add five new nullable columns (`address` is left in place to preserve existing data — not displayed, not written to going forward):

```sql
ALTER TABLE public.contacts
  ADD COLUMN street text,
  ADD COLUMN street2 text,
  ADD COLUMN city text,
  ADD COLUMN state text,
  ADD COLUMN zip text;
```

No RLS changes needed — existing policies already cover all columns on the table.

### Part 1 — `src/pages/ContactHistory.tsx`

- Replace `address: ""` in form state with the five new fields.
- Add `showAddressFields` state.
- Update `startEditing` to populate all five fields and auto-open the section if any address field has a value.
- Update `updateContact` mutation: drop `address`, write `street`, `street2`, `city`, `state`, `zip` (each `|| null`).
- Replace the existing single-line address `<a>` (line ~262) with the structured two-line display block from the spec — `line1 = street, street2`, `line2 = city, state zip`, both used to build the maps query. Preserve `MapPin size={15}` styling.
- Replace the single Address `<Input>` (line 464) with the progressive-disclosure block: "+ Add address" button (sienna), or expanded fields (`Street`, `Street 2`, `City`, then `State`/`ZIP` in a 2-col grid).

### Part 2 — `src/pages/Contacts.tsx`

- Replace `address: ""` in `form` state with the five new fields.
- Add `showAddressFields` state, reset to `false` in `addContact.onSuccess` alongside the existing form reset.
- Replace the single Address `<Input>` in the new-contact form with the same progressive-disclosure pattern.
- Update `addContact` mutation insert: drop `address`, write the five new fields.
- Update `handlePickFromPhone`'s `contactData` to include the five empty fields.
- Note: `bulkAddContacts` (CSV import) is left as-is — only `address` reference there was already removed. No address mapping in CSV import currently.

### Part 3 — `src/components/LogInteractionSheet.tsx`

- Replace `address: ""` in `quickForm` state and in both reset locations (initial state line 87, `clearAndClose` line 151, `quickAddContact.onSuccess` line 249).
- Add `showQuickAddressFields` state. Reset to `false` in `clearAndClose` and `quickAddContact.onSuccess`.
- Update `quickAddContact` mutation insert: drop `address`, write the five new fields.
- Replace both Address `<Input>` instances (lines 924 and 958) with the same progressive-disclosure pattern, sized for the compact quick-add form (`h-9 text-sm`).

### Preserved
- All `console.log` statements
- All existing `<a>`, `<MapPin>`, and `<span>` styles from prior fixes (kept on `line1` row)
- All other component logic
- Existing `address` column in DB (no data loss)

### Checklist
- ✅ Migration adds 5 nullable columns (`street`, `street2`, `city`, `state`, `zip`)
- ✅ Only `ContactHistory.tsx`, `Contacts.tsx`, `LogInteractionSheet.tsx` touched
- ✅ All `address` field references in code replaced with the five new fields
- ✅ Contact record displays address as two structured lines with `MapPin`
- ✅ Maps link uses concatenated query string from all five fields
- ✅ All forms show "+ Add address" button, expand on tap
- ✅ `showAddressFields` auto-opens in edit mode when address data exists
- ✅ State/ZIP in a 2-column grid
- ✅ `showAddressFields` / `showQuickAddressFields` reset on form close/submit
- ✅ `handlePickFromPhone` updated to include five empty address fields
- ✅ All `console.log` statements preserved

