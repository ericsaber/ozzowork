

## Update reminder row styling in FollowupCard.tsx and ContactFollowupCard.tsx

### 1. FollowupCard.tsx — reminder row (lines ~316–323)

- **Line 317**: `CornerDownRight size={10}` → `size={16}`, `color: tokens.color` → `color: "#2e7a4d"`
- **Line 319**: `fontWeight: 500` → `fontWeight: 400`
- **Line 320**: `fontSize: "10px"` → `fontSize: "12px"`
- **Line 321**: `color: tokens.color` → `color: "#2e7a4d"`

### 2. ContactFollowupCard.tsx — reminder row (lines ~231–235)

- **Line 231**: `CornerDownRight size={10}` → `size={16}`, `color: tokens.color` → `color: "#2e7a4d"`
- **Line 233**: `fontWeight: 500` → `fontWeight: 400`
- **Line 235**: `color: tokens.color` → `color: "#2e7a4d"`

Note: ContactFollowupCard.tsx already has `fontSize: "12px"` — no font-size change needed there.

### No other files touched. All existing console.log statements preserved.

