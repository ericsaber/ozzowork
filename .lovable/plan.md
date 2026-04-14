

## Plan: Fix pluralization of attention count in Today.tsx

**File:** `src/pages/Today.tsx`

**Line ~176** — replace:
```ts
{!isLoading && attentionCount > 0 && <span> · {attentionCount} need attention</span>}
```
with:
```ts
{!isLoading && attentionCount > 0 && <span> · {attentionCount} {attentionCount === 1 ? "needs" : "need"} attention</span>}
```

No other changes. All `console.log` statements preserved.

