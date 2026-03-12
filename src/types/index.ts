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

export interface Interaction {
  id: string;
  user_id: string;
  contact_id: string;
  date: string;
  planned_follow_up_type: string;
  connect_type: string | null;
  note: string | null;
  follow_up_date: string | null;
  created_at: string;
}

export interface FollowUp {
  id: string;
  contact_id: string;
  interaction_id: string | null;
  follow_up_type: string;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  user_id: string;
}

export interface FollowUpEdit {
  id: string;
  follow_up_id: string;
  previous_type: string;
  previous_due_date: string;
  changed_at: string;
  user_id: string;
}

export interface FollowupItem {
  contact: Contact;
  lastInteraction: Interaction | null;
  followUpDate: string;
}
