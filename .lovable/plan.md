

## Step 1: Drop and recreate tables with new schema + RLS

All existing data in `interactions`, `follow_ups`, and `follow_up_edits` will be lost. `task_records` and all other tables remain untouched. No component changes.

### Single migration

One migration that:

1. **Drops** existing tables in dependency order: `follow_up_edits` → `follow_ups` → `interactions` (cascade)
2. **Creates** the three new tables with the exact schema from your spec
3. **Enables RLS** on all three
4. **Creates RLS policies** (select/insert/update/delete scoped to `auth.uid() = user_id`) on all three

Existing RLS policies are dropped automatically when the tables are dropped.

### SQL

```sql
-- Drop in dependency order
DROP TABLE IF EXISTS follow_up_edits CASCADE;
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;

-- Create interactions
CREATE TABLE interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  connect_type text,
  connect_date timestamptz NOT NULL DEFAULT now(),
  note text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create follow_ups
CREATE TABLE follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  planned_type text,
  planned_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  completed_at timestamptz,
  connect_type text,
  connect_date timestamptz,
  note text,
  reminder_note varchar(55),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create follow_up_edits
CREATE TABLE follow_up_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_id uuid REFERENCES follow_ups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  previous_type text,
  previous_due_date date NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_edits ENABLE ROW LEVEL SECURITY;

-- RLS: interactions
CREATE POLICY "Users can select own interactions" ON interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interactions" ON interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON interactions FOR DELETE USING (auth.uid() = user_id);

-- RLS: follow_ups
CREATE POLICY "Users can select own follow_ups" ON follow_ups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own follow_ups" ON follow_ups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own follow_ups" ON follow_ups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own follow_ups" ON follow_ups FOR DELETE USING (auth.uid() = user_id);

-- RLS: follow_up_edits
CREATE POLICY "Users can select own follow_up_edits" ON follow_up_edits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own follow_up_edits" ON follow_up_edits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own follow_up_edits" ON follow_up_edits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own follow_up_edits" ON follow_up_edits FOR DELETE USING (auth.uid() = user_id);
```

No files modified. Database-only change.

