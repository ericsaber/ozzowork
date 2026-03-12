
-- Create follow_ups table
CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_id uuid REFERENCES public.interactions(id) ON DELETE SET NULL,
  follow_up_type text NOT NULL,
  due_date date NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- Create follow_up_edits table
CREATE TABLE public.follow_up_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_id uuid NOT NULL REFERENCES public.follow_ups(id) ON DELETE CASCADE,
  previous_type text NOT NULL,
  previous_due_date date NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_edits ENABLE ROW LEVEL SECURITY;

-- RLS policies for follow_ups
CREATE POLICY "Users can view own follow_ups" ON public.follow_ups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own follow_ups" ON public.follow_ups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own follow_ups" ON public.follow_ups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own follow_ups" ON public.follow_ups FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for follow_up_edits
CREATE POLICY "Users can view own follow_up_edits" ON public.follow_up_edits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own follow_up_edits" ON public.follow_up_edits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Migrate existing data
INSERT INTO public.follow_ups (contact_id, interaction_id, follow_up_type, due_date, user_id)
SELECT contact_id, id, planned_follow_up_type, follow_up_date, user_id
FROM public.interactions
WHERE follow_up_date IS NOT NULL;
