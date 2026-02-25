import React, { useEffect, useRef } from 'react'
import { Message } from '../../services/api'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥']

interface MessageActionsProps {
  message: Message
  isMine: boolean
  position: { x: number; y: number }
  onClose: () => void
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  onReact: (emoji: string) => void
  onPin: () => void
  onForward: () => void
  onCopy: () => void
}

export function MessageActions({ message, isMine, position, onClose, onReply, onEdit, onDelete, onReact, onPin, onForward, onCopy }: MessageActionsProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Adjust position to stay within viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 100,
    left: Math.min(position.x, window.innerWidth - 200),
    top: Math.min(position.y, window.innerHeight - 300),
  }

  return (
    <div ref={ref} style={style} className="bg-dark-700 rounded-xl shadow-2xl border border-dark-600 py-1 min-w-[160px] animate-fade-in">
      {/* Quick reactions */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-dark-600">
        {QUICK_EMOJIS.map(emoji => (
          <button key={emoji} onClick={() => onReact(emoji)} className="text-base hover:scale-125 transition-transform p-0.5">{emoji}</button>
        ))}
      </div>

      <button onClick={onReply} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
        Reply
      </button>
      <button onClick={onForward} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        Forward
      </button>
      <button onClick={onCopy} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        Copy
      </button>
      <button onClick={onPin} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
        {message.is_pinned ? 'Unpin' : 'Pin'}
      </button>
      {isMine && (
        <button onClick={onEdit} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </button>
      )}
      {isMine && (
        <button onClick={onDelete} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-600 hover:text-red-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete
        </button>
      )}
    </div>
  )
}
