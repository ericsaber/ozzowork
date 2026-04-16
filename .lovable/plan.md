
## Plan: Wrap UserRound icon in a sign-out dropdown menu

**File:** `src/pages/Today.tsx`

### 1. Imports
- Add `LogOut` to the existing `lucide-react` import alongside `Calendar`, `Eye`, `UserRound`.
- Add a new import for the dropdown primitives:
  ```ts
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  ```

### 2. Handler
Inside the `Today` component, add:
```ts
const handleSignOut = async () => {
  await supabase.auth.signOut();
  navigate("/auth");
};
```
(Uses existing `navigate` and `supabase` imports.)

### 3. JSX change (line ~215)
Replace:
```tsx
<UserRound size={24} style={{ color: "#999" }} />
```
With:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button type="button" aria-label="Account menu" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
      <UserRound size={24} style={{ color: "#999" }} />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleSignOut}>
      <LogOut size={16} className="mr-2" />
      Sign out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Notes
- No new dependencies — `dropdown-menu.tsx` already exists in `src/components/ui/`.
- All existing `console.log` statements preserved.
- No other files touched.
