import React, { useState } from 'react'
import clsx from 'clsx'
import { Message as MessageType } from '../../services/api'
import { Avatar } from '../ui/Avatar'
import { MessageActions } from './MessageActions'
import { format } from 'date-fns'

interface MessageProps {
  message: MessageType
  isMine: boolean
  showAvatar?: boolean
  onReply?: (msg: MessageType) => void
  onEdit?: (msg: MessageType) => void
  onDelete?: (id: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onPin?: (messageId: string) => void
  onForward?: (msg: MessageType) => void
}

function groupReactions(reactions: MessageType['reactions']) {
  const groups: Record<string, { emoji: string; count: number; users: string[] }> = {}
  for (const r of reactions) {
    if (!groups[r.emoji]) groups[r.emoji] = { emoji: r.emoji, count: 0, users: [] }
    groups[r.emoji].count++
    groups[r.emoji].users.push(r.display_name)
  }
  return Object.values(groups)
}

export function Message({ message: msg, isMine, showAvatar, onReply, onEdit, onDelete, onReact, onPin, onForward }: MessageProps) {
  const [showActions, setShowActions] = useState(false)
  const [actionsPos, setActionsPos] = useState({ x: 0, y: 0 })

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setActionsPos({ x: e.clientX, y: e.clientY })
    setShowActions(true)
  }

  if (msg.is_deleted) {
    return (
      <div className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}>
        <div className="px-3 py-2 rounded-2xl bg-dark-700 text-gray-500 text-sm italic">
          🗑 Message deleted
        </div>
      </div>
    )
  }

  const reactionGroups = groupReactions(msg.reactions || [])

  return (
    <div
      className={clsx('flex items-end gap-2 group', isMine ? 'flex-row-reverse' : 'flex-row')}
      onContextMenu={handleContextMenu}
    >
      {!isMine && showAvatar && (
        <Avatar src={msg.sender?.avatar_url} name={msg.sender?.display_name} size="xs" />
      )}
      {!isMine && !showAvatar && <div className="w-6 flex-shrink-0" />}

      <div className={clsx('max-w-[70%] flex flex-col', isMine ? 'items-end' : 'items-start')}>
        {!isMine && showAvatar && msg.sender && (
          <span className="text-xs text-primary-400 font-medium mb-1 px-1">{msg.sender.display_name}</span>
        )}

        {/* Reply quote */}
        {msg.replyTo && !msg.replyTo.is_deleted && (
          <div className={clsx('text-xs px-2 py-1 mb-1 rounded-lg border-l-2 border-primary-500 bg-dark-700 text-gray-300 max-w-full')}>
            <div className="truncate">{(msg.replyTo as MessageType).content}</div>
          </div>
        )}

        {/* Forwarded indicator */}
        {msg.forwarded_from_id && (
          <div className="text-xs text-gray-500 mb-1 px-1">↪ Forwarded</div>
        )}

        <div
          className={clsx(
            'relative px-3 py-2 rounded-2xl text-sm break-words',
            isMine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-dark-700 text-gray-100 rounded-bl-sm'
          )}
        >
          {/* File attachment */}
          {msg.file_url && msg.type !== 'text' && (
            <div className="mb-2">
              {msg.type === 'image' ? (
                <img src={msg.file_url} alt={msg.file_name ?? ''} className="max-w-full rounded-lg max-h-60 object-cover" />
              ) : (
                <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-200 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-xs truncate max-w-[200px]">{msg.file_name}</span>
                </a>
              )}
            </div>
          )}

          {msg.content && <span>{msg.content}</span>}

          <div className={clsx('flex items-center gap-1 mt-1', isMine ? 'justify-end' : 'justify-start')}>
            <span className={clsx('text-xs', isMine ? 'text-primary-200' : 'text-gray-500')}>
              {format(new Date(msg.created_at), 'HH:mm')}
            </span>
            {msg.is_edited === 1 && (
              <span className={clsx('text-xs', isMine ? 'text-primary-200' : 'text-gray-500')}>· edited</span>
            )}
            {msg.is_pinned === 1 && (
              <span className="text-xs">📌</span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {reactionGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {reactionGroups.map(r => (
              <button
                key={r.emoji}
                title={r.users.join(', ')}
                onClick={() => onReact?.(msg.id, r.emoji)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-dark-700 hover:bg-dark-600 rounded-full text-xs transition-colors"
              >
                <span>{r.emoji}</span>
                <span className="text-gray-300">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className={clsx('opacity-0 group-hover:opacity-100 transition-opacity flex items-center', isMine ? 'flex-row-reverse' : 'flex-row')}>
        <button
          onClick={e => { setActionsPos({ x: e.clientX, y: e.clientY }); setShowActions(true) }}
          className="p-1 rounded hover:bg-dark-600 text-gray-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {showActions && (
        <MessageActions
          message={msg}
          isMine={isMine}
          position={actionsPos}
          onClose={() => setShowActions(false)}
          onReply={() => { onReply?.(msg); setShowActions(false) }}
          onEdit={() => { onEdit?.(msg); setShowActions(false) }}
          onDelete={() => { onDelete?.(msg.id); setShowActions(false) }}
          onReact={emoji => { onReact?.(msg.id, emoji); setShowActions(false) }}
          onPin={() => { onPin?.(msg.id); setShowActions(false) }}
          onForward={() => { onForward?.(msg); setShowActions(false) }}
          onCopy={() => { navigator.clipboard.writeText(msg.content); setShowActions(false) }}
        />
      )}
    </div>
  )
}
