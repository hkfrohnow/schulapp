export type UserRole = "parent" | "teacher" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface BoardPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  pinned: boolean;
  created_at: string;
  author?: UserProfile;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  parent_id: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  other_user?: UserProfile;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { full_name: string };
}

export interface TimetableEntry {
  id: string;
  class_name: string;
  day_of_week: number;
  period: number;
  start_time: string;
  end_time: string;
  subject: string;
  teacher_id: string | null;
  room: string | null;
  teacher?: { full_name: string } | null;
}

export type SickNoteStatus = "active" | "recovered";

export interface SickNote {
  id: string;
  student_id: string;
  reported_by: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes: string | null;
  status: SickNoteStatus;
  created_at: string;
  student?: Student;
  reporter?: { full_name: string };
}
