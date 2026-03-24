export interface Contact {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskRecord {
  id: string;
  contact_id: string;
  user_id: string;
  connect_type: string | null;
  connect_date: string | null;
  note: string | null;
  planned_follow_up_type: string | null;
  planned_follow_up_date: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  related_task_record_id: string | null;
}

export interface FollowUpEdit {
  id: string;
  follow_up_id: string | null;
  task_record_id: string | null;
  previous_type: string;
  previous_due_date: string;
  changed_at: string;
  user_id: string;
}
