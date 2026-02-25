import React from 'react'
import { Chat } from '../../services/api'
import { ChatItem } from './ChatItem'

interface ChatListProps {
  chats: Chat[]
  currentChatId?: string
  currentUserId: string
  onChatClick: (id: string) => void
}

export function ChatList({ chats, currentChatId, currentUserId, onChatClick }: ChatListProps) {
  if (!chats.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        No chats yet
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {chats.map(chat => (
        <ChatItem
          key={chat.id}
          chat={chat}
          currentUserId={currentUserId}
          isActive={chat.id === currentChatId}
          onClick={() => onChatClick(chat.id)}
        />
      ))}
    </div>
  )
}
