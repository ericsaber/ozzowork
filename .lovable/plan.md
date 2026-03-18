

## Fix: Contact Record Page Content Cut Off at Top

### Root Cause

There is **no scroll-to-top behavior** on route navigation. When the user scrolls down on the Contacts list and taps a contact, React Router navigates to `/contact/:id` but the browser retains the previous scroll position. This makes the top of the contact record (avatar, name, action buttons) appear cut off.

The `LogInteractionSheet` addition is a red herring — it renders via a portal (`DrawerPrimitive.Portal`) and does not affect page layout. The timing correlation is coincidental or the sheet testing involved more navigation that exposed this existing issue.

### Fix

**Create `src/components/Scroll<lov-plan>

## Fix: Contact Record Page Content Cut Off at Top

### Root Cause

There is **no scroll-to-top behavior** on route navigation. When the user scrolls down on the Contacts list and taps a contact, React Router navigates to `/contact/:id` but the browser retains the previous scroll position. This makes the top of the contact record (avatar, name, action buttons) appear cut off.

The `LogInteractionSheet` addition is a red herring — it renders via a portal (`DrawerPrimitive.Portal`) and does not affect page layout. The timing correlation is coincidental or the sheet testing involved more navigation that exposed this existing issue.

### Fix

**Create `src/components/ScrollToTop.tsx`** — a small component that scrolls to top on forward navigation:

```typescript
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType !== "POP") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, navType]);

  return null;
};
```

**Update `src/App.tsx`** — add `<ScrollToTop />` inside `BrowserRouter`, before `<Routes>`:

```tsx
<BrowserRouter>
  <ScrollToTop />
  <AppContent />
</BrowserRouter>
```

This preserves scroll position on back/forward (POP navigation) but resets to top on new navigations — standard mobile app behavior.

### Files Changed

1. New `src/components/ScrollToTop.tsx`
2. `src/App.tsx` — import and render ScrollToTop inside BrowserRouter

