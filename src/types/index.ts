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

export interface FollowupItem {
  contact: Contact;
  lastInteraction: Interaction | null;
  followUpDate: string;
}
