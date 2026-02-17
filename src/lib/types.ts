export interface Broadcast {
  id: string;
  code: string;
  admin_name: string;
  password: string;
  created_at: string;
}

export interface Message {
  id: string;
  broadcast_id: string;
  sender_role: "instructor";
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}

export type Role = "instructor" | "student" | "administrator";
