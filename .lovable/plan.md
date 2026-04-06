

## Set card gap to 24px everywhere

### Changes

**1. `src/pages/Today.tsx`**
- Line 200: loading skeleton `space-y-3` → `space-y-6`
- Line 213: Overdue section `space-y-5` → `space-y-6`
- Line 220: Due Today section `space-y-5` → `space-y-6`

**2. `src/pages/Upcoming.tsx`**
- Line 109: loading skeleton `space-y-3` → `space-y-6`
- Line 111: cards list `space-y-3` → `space-y-6`

`space-y-6` = 24px. Section spacing stays as-is.

### Files touched
- `src/pages/Today.tsx`
- `src/pages/Upcoming.tsx`

