

## Replace `<input type="date">` with Popover + Calendar in FollowupCard.tsx

### Single file: `src/components/FollowupCard.tsx`

**Imports to add (line 1 area):**
- `Calendar` from `@/components/ui/calendar`
- `Popover, PopoverContent, PopoverTrigger` from `@/components/ui/popover`
- `cn` from `@/lib/utils`

**New state (after line 55):**
- `const [showDatePicker, setShowDatePicker] = useState(false)`

**Replace date picker block (lines 195-224):**

Remove the `<div style={{ position: "relative", display: "inline-block" }}>` wrapper containing the pill div and hidden `<input type="date">`.

Replace with:
```tsx
<Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
  <PopoverTrigger asChild>
    <button
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "white",
        border: tokens.doneBorder,
        borderRadius: "20px",
        padding: "6px 14px",
        fontWeight: 500,
        fontSize: "14px",
        color: tokens.color,
        whiteSpace: "nowrap",
        lineHeight: "normal",
        fontFamily: "var(--font-body)",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
      }}
    >
      <CalendarIcon size={14} />
      {format(parseISO(editDate), "MMM d, yyyy")}
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <Calendar
      mode="single"
      selected={new Date(editDate + "T00:00:00")}
      onSelect={(date) => {
        if (date) {
          setEditDate(format(date, "yyyy-MM-dd"));
          setShowDatePicker(false);
        }
      }}
      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
      initialFocus
      className={cn("p-3 pointer-events-auto")}
    />
  </PopoverContent>
</Popover>
```

**Cleanup:**
- `useRef` is not imported, so no removal needed
- `todayStr` variable (line 165) can be removed since it's no longer used by the date input
- All existing `console.log` statements preserved
- No other files touched

