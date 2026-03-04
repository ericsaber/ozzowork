
ALTER TABLE public.contacts ADD COLUMN first_name text;
ALTER TABLE public.contacts ADD COLUMN last_name text;

-- Migrate existing data: split name into first_name and last_name
UPDATE public.contacts SET
  first_name = split_part(name, ' ', 1),
  last_name = CASE
    WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END;

-- Now make first_name NOT NULL
ALTER TABLE public.contacts ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.contacts ALTER COLUMN first_name SET DEFAULT '';
ALTER TABLE public.contacts ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE public.contacts ALTER COLUMN last_name SET DEFAULT '';

-- Drop old name column
ALTER TABLE public.contacts DROP COLUMN name;
