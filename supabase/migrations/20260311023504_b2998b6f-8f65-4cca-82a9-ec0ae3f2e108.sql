-- Step 1: Rename type → planned_follow_up_type
ALTER TABLE public.interactions RENAME COLUMN type TO planned_follow_up_type;

-- Step 2: Add connect_type column
ALTER TABLE public.interactions ADD COLUMN connect_type text;

-- Step 3: Migrate 'note' values to 'text'
UPDATE public.interactions SET planned_follow_up_type = 'text' WHERE planned_follow_up_type = 'note';