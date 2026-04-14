

## Plan: Auth Screen Copy/Style + Favicon Update

### 1. Auth screen (`src/pages/Auth.tsx`)

**Line ~50 — `<h1>` tag**: Change class from `font-heading ... italic` to use inline style `fontFamily: "'Outfit', sans-serif"`, `fontWeight: 500`. Remove `italic` class. Keep `text-4xl` and `text-foreground`. Ensure lowercase text (it already is).

**Line ~51 — `<p>` tagline**: Change text from `"Never forget to follow up."` to `"Follow Through."`

### 2. Favicon (`public/favicon.svg` + `index.html`)

- Copy uploaded SVG from `user-uploads://ozzo-icon.svg` to `public/favicon.svg`
- Delete `public/favicon.ico` if it exists
- Add `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` to `<head>` in `index.html`
- Remove any existing `.ico` favicon link

### 3. Build error fix (`supabase/functions/transcribe-audio/index.ts`)

Line 162: cast `e` to `Error` — `(e as Error).message` — to resolve the existing TS18046 build error.

No other files touched. All `console.log` statements preserved.

