
CREATE TABLE public.task_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  connect_type text,
  connect_date timestamptz,
  note text,
  planned_follow_up_type text,
  planned_follow_up_date date,
  status text NOT NULL DEFAULT 'active',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task_records" ON public.task_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own task_records" ON public.task_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task_records" ON public.task_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own task_records" ON public.task_records FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_task_records_updated_at
  BEFORE UPDATE ON public.task_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.follow_up_edits ALTER COLUMN follow_up_id DROP NOT NULL;
ALTER TABLE public.follow_up_edits ADD COLUMN task_record_id uuid REFERENCES public.task_records(id) ON DELETE CASCADE;

INSERT INTO public.task_records (contact_id, user_id, connect_type, connect_date, note, planned_follow_up_type, planned_follow_up_date, status, completed_at, created_at)
SELECT
  i.contact_id, i.user_id, i.connect_type, i.date, i.note,
  f.follow_up_type, f.due_date,
  CASE WHEN f.completed THEN 'completed' ELSE 'active' END,
  f.completed_at, i.created_at
FROM interactions i
INNER JOIN follow_ups f ON f.interaction_id = i.id;

INSERT INTO public.task_records (contact_id, user_id, planned_follow_up_type, planned_follow_up_date, status, completed_at, created_at)
SELECT f.contact_id, f.user_id, f.follow_up_type, f.due_date,
  CASE WHEN f.completed THEN 'completed' ELSE 'active' END,
  f.completed_at, f.created_at
FROM follow_ups f WHERE f.interaction_id IS NULL;

INSERT INTO public.task_records (contact_id, user_id, connect_type, connect_date, note, status, created_at)
SELECT i.contact_id, i.user_id, i.connect_type, i.date, i.note, 'active', i.created_at
FROM interactions i
WHERE NOT EXISTS (SELECT 1 FROM follow_ups f WHERE f.interaction_id = i.id);
