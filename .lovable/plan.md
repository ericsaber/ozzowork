

## Fix: CSV parser truncates company names containing spaces

### Problem
Line 163 uses a regex with `[^",\s]+` to split CSV values. The `\s` (whitespace) in the character class causes unquoted multi-word values like `Acme Corp` to be split into separate tokens (`Acme`, `Corp`). This misaligns every column after the first space-containing value.

### Fix

**File: `src/pages/Contacts.tsx`**

Replace the regex-based CSV line parser (line 163-165) with a proper quote-aware parser function that only splits on commas, not spaces:

```typescript
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}
```

Then replace line 163-165 with:
```typescript
const vals = parseCSVLine(lines[i]);
```

Also apply the same `parseCSVLine` function to the header line (line 146) for consistency, replacing `headerLine.split(",")`.

### What stays untouched
- vCard parsing, bulk add mutation, file handling, UI, everything else

