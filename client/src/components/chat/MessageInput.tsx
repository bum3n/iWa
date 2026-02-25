import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'
import clsx from 'clsx'
import { Message } from '../../services/api'
import { EmojiPicker } from './EmojiPicker'
import { uploadsApi } from '../../services/api'

interface MessageInputProps {
  onSend: (data: { content: string; type?: string; reply_to_id?: string; file_url?: string; file_name?: string; file_size?: number }) => void
  replyTo?: Message | null
  editMessage?: Message | null
  onCancelReply?: () => void
  onCancelEdit?: () => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ onSend, replyTo, editMessage, onCancelReply, onCancelEdit, disabled, placeholder }: MessageInputProps) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editMessage) {
      setText(editMessage.content)
      textareaRef.current?.focus()
    }
  }, [editMessage])

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus()
  }, [replyTo])

  const adjustHeight = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 140) + 'px'
    }
  }

  const handleSend = () => {
    const content = text.trim()
    if (!content) return
    onSend({
      content,
      reply_to_id: replyTo?.id,
    })
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onCancelReply?.()
    onCancelEdit?.()
  }

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      onCancelReply?.()
      onCancelEdit?.()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadsApi.attachment(file)
      const type = file.type.startsWith('image/') ? 'image' : 'file'
      onSend({ content: '', type, file_url: res.data.url, file_name: res.data.filename, file_size: res.data.size })
    } catch {}
    finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadsApi.attachment(file)
      const type = file.type.startsWith('image/') ? 'image' : 'file'
      onSend({ content: '', type, file_url: res.data.url, file_name: res.data.filename, file_size: res.data.size })
    } catch {}
    finally { setUploading(false) }
  }

  return (
    <div className="px-4 py-3 border-t border-dark-700" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
      {/* Reply / Edit indicators */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-dark-700 rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-primary-400 font-medium">Replying to {replyTo.sender?.display_name}</div>
            <div className="text-xs text-gray-400 truncate">{replyTo.content}</div>
          </div>
          <button onClick={onCancelReply} className="text-gray-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {editMessage && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-dark-700 rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-yellow-400 font-medium">Editing message</div>
            <div className="text-xs text-gray-400 truncate">{editMessage.content}</div>
          </div>
          <button onClick={onCancelEdit} className="text-gray-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
          title="Attach file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

        {/* Text area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => { setText(e.target.value); adjustHeight() }}
            onKeyDown={handleKey}
            disabled={disabled || uploading}
            placeholder={placeholder ?? 'New message... (Enter to send)'}
            rows={1}
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm leading-relaxed"
            style={{ minHeight: '44px', maxHeight: '140px' }}
          />
        </div>

        {/* Emoji */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
            title="Emoji"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 right-0 z-10">
              <EmojiPicker onSelect={emoji => { setText(t => t + emoji); setShowEmoji(false); textareaRef.current?.focus() }} onClose={() => setShowEmoji(false)} />
            </div>
          )}
        </div>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled || uploading}
          className={clsx(
            'p-2.5 rounded-xl transition-colors flex-shrink-0',
            text.trim() && !disabled
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-dark-700 text-gray-500 cursor-not-allowed'
          )}
          title="Send"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
