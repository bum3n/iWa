export interface User {
  id: number;
  username: string;
  avatar_color: string;
  last_seen?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_username: string;
  sender_avatar_color: string;
  content: string;
  type: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  type: 'direct' | 'group' | 'channel';
  name?: string;
  description?: string;
  avatar_color?: string;
  created_by: number;
  created_at: string;
  member_count?: number;
  last_message?: string;
  last_message_at?: string;
  other_username?: string;
  other_avatar_color?: string;
  other_user_id?: number;
}

export interface TypingUser {
  userId: number;
  username: string;
  conversation_id: number;
}
