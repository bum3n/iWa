export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  status: string;
  created_at: number;
  updated_at: number;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name: string | null;
  description: string;
  avatar_url: string;
  is_public: number;
  invite_code: string | null;
  owner_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface ChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: number;
  last_read_at: number;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  reply_to_id: string | null;
  forwarded_from_id: string | null;
  is_edited: number;
  is_pinned: number;
  is_deleted: number;
  created_at: number;
  updated_at: number;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: number;
}

export interface PublicUser {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
