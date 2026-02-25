import React from 'react'
import clsx from 'clsx'
import { Chat } from '../../services/api'
import { Avatar } from '../ui/Avatar'
import { format, isToday, isYesterday } from 'date-fns'

interface ChatItemProps {
  chat: Chat
  currentUserId: string
  isActive: boolean
  onClick: () => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd.MM.yy')
}

export function ChatItem({ chat, currentUserId, isActive, onClick }: ChatItemProps) {
  const name = chat.name ?? 'Unknown'
  const lastMsg = chat.lastMessage
  const time = lastMsg ? formatTime(lastMsg.created_at) : ''
  const preview = lastMsg
    ? lastMsg.is_deleted
      ? 'Message deleted'
      : lastMsg.type !== 'text'
      ? `📎 ${lastMsg.file_name ?? 'File'}`
      : lastMsg.content.slice(0, 50)
    : ''

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors text-left',
        isActive && 'bg-dark-700'
      )}
    >
      <Avatar
        src={chat.avatar_url || null}
        name={name}
        size="md"
        online={chat.type === 'direct' ? chat.members?.find(m => m.user_id !== currentUserId)?.status === 'online' : undefined}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white truncate">{name}</span>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{time}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-gray-400 truncate">{preview}</span>
          {chat.unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 bg-primary-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
