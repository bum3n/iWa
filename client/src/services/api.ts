import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface PublicUser {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url: string
  status: string
}

export interface Message {
  id: string
  chat_id: string
  user_id: string
  content: string
  type: string
  file_url: string | null
  file_name: string | null
  file_size: number | null
  reply_to_id: string | null
  forwarded_from_id: string | null
  is_edited: number
  is_pinned: number
  is_deleted: number
  created_at: number
  updated_at: number
  reactions: { emoji: string; user_id: string; display_name: string }[]
  sender: PublicUser | null
  replyTo: Partial<Message> | null
}

export interface Chat {
  id: string
  type: 'direct' | 'group' | 'channel'
  name: string | null
  description: string
  avatar_url: string
  is_public: number
  invite_code: string | null
  owner_id: string | null
  created_at: number
  updated_at: number
  members: (ChatMember & PublicUser & { username: string })[]
  lastMessage: Message | null
  unreadCount: number
}

export interface ChatMember {
  id: string
  chat_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: number
  last_read_at: number
}

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { username: string; email: string; password: string; display_name: string }) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// Users
export const usersApi = {
  search: (q: string) => api.get<{ users: PublicUser[] }>(`/users/search?q=${encodeURIComponent(q)}`),
  get: (id: string) => api.get<{ user: PublicUser }>(`/users/${id}`),
  updateProfile: (data: { display_name?: string; bio?: string; status?: string }) => api.put('/users/profile', data),
  uploadAvatar: (file: File) => {
    const form = new FormData(); form.append('avatar', file)
    return api.post<{ user: PublicUser; avatar_url: string }>('/users/avatar', form)
  },
}

// Chats
export const chatsApi = {
  list: () => api.get<{ chats: Chat[] }>('/chats'),
  createDirect: (userId: string) => api.post<Chat>('/chats/direct', { userId }),
  createGroup: (name: string, description: string, memberIds: string[]) => api.post<Chat>('/chats/group', { name, description, memberIds }),
  get: (id: string) => api.get<Chat>(`/chats/${id}`),
  update: (id: string, data: Partial<Chat>) => api.put(`/chats/${id}`, data),
  addMember: (id: string, userId: string) => api.post(`/chats/${id}/members`, { userId }),
  removeMember: (id: string, userId: string) => api.delete(`/chats/${id}/members/${userId}`),
  join: (id: string, inviteCode?: string) => api.post(`/chats/${id}/join`, { inviteCode }),
  generateInvite: (id: string) => api.post<{ inviteCode: string }>(`/chats/${id}/invite`),
}

// Messages
export const messagesApi = {
  list: (chatId: string, before?: number, limit = 50) =>
    api.get<{ messages: Message[]; hasMore: boolean }>(`/messages/${chatId}?before=${before ?? ''}&limit=${limit}`),
  send: (chatId: string, data: { content: string; type?: string; reply_to_id?: string; file_url?: string; file_name?: string; file_size?: number }) =>
    api.post<{ message: Message }>(`/messages/${chatId}`, data),
  edit: (chatId: string, messageId: string, content: string) => api.put<{ message: Message }>(`/messages/${chatId}/${messageId}`, { content }),
  delete: (chatId: string, messageId: string) => api.delete(`/messages/${chatId}/${messageId}`),
  react: (chatId: string, messageId: string, emoji: string) => api.post(`/messages/${chatId}/${messageId}/react`, { emoji }),
  pin: (chatId: string, messageId: string) => api.post(`/messages/${chatId}/${messageId}/pin`),
  forward: (chatId: string, messageId: string, targetChatId: string) => api.post(`/messages/${chatId}/${messageId}/forward`, { targetChatId }),
  pinned: (chatId: string) => api.get<{ messages: Message[] }>(`/messages/${chatId}/pinned`),
}

// Channels
export const channelsApi = {
  listPublic: () => api.get<{ channels: Chat[] }>('/channels/public'),
  create: (name: string, description: string, is_public: boolean) => api.post<{ channel: Chat }>('/channels', { name, description, is_public }),
  get: (id: string) => api.get<{ channel: Chat; members: ChatMember[] }>(`/channels/${id}`),
  join: (id: string) => api.post(`/channels/${id}/join`),
  leave: (id: string) => api.delete(`/channels/${id}/leave`),
}

// Uploads
export const uploadsApi = {
  attachment: (file: File) => {
    const form = new FormData(); form.append('file', file)
    return api.post<{ url: string; filename: string; size: number }>('/uploads/attachment', form)
  },
}

export default api
