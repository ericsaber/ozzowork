

## Wire onEdit in ContactHistory.tsx → EditFollowupSheet

Only `ContactHistory.tsx` is modified. Four surgical edits:

### 1. Add import (after line 22)
```tsx
import EditFollowupSheet from "@/components/EditFollowupSheet";
```

### 2. Add state (after line 50)
```tsx
const [editFollowupOpen, setEditFollowupOpen] = useState(false);
```

### 3. Replace onEdit stub (lines 480–482)
```tsx
onEdit={() => setEditFollowupOpen(true)}
```

### 4. Render EditFollowupSheet (before closing `</div>` at line 800)
```tsx
{activeFollowup && (
  <EditFollowupSheet
    open={editFollowupOpen}
    onOpenChange={(open) => { if (!open) setEditFollowupOpen(false); }}
    followUp={{
      id: activeFollowup.id,
      planned_type: activeFollowup.planned_type,
      planned_date: activeFollowup.planned_date,
      reminder_note: activeFollowup.reminder_note ?? null,
      created_at: activeFollowup.created_at,
      contact_id: activeFollowup.contact_id,
    }}
  />
)}
```

No query invalidation needed — `EditFollowupSheet` already invalidates `follow-ups-active` and `interactions` on save. No other files touched. All existing `console.log` statements preserved.

