import React, { useEffect, useRef, useCallback } from 'react'
import { Message as MessageType } from '../../services/api'
import { Message } from './Message'
import { Spinner } from '../ui/Spinner'
import { useInView } from 'react-intersection-observer'

interface MessageListProps {
  messages: MessageType[]
  currentUserId: string
  isGroup?: boolean
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onReply?: (msg: MessageType) => void
  onEdit?: (msg: MessageType) => void
  onDelete?: (id: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onPin?: (messageId: string) => void
  onForward?: (msg: MessageType) => void
}

export function MessageList({
  messages, currentUserId, isGroup, loading, hasMore, onLoadMore,
  onReply, onEdit, onDelete, onReact, onPin, onForward
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeight = useRef(0)
  const isFirstLoad = useRef(true)

  const { ref: topRef, inView } = useInView({ threshold: 0.1 })

  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView()
      isFirstLoad.current = false
    }
  }, [messages.length])

  useEffect(() => {
    if (!loading && messages.length > 0 && isFirstLoad.current === false) {
      const container = containerRef.current
      if (container && prevScrollHeight.current > 0) {
        container.scrollTop = container.scrollHeight - prevScrollHeight.current
        prevScrollHeight.current = 0
      } else {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [messages, loading])

  useEffect(() => {
    if (inView && hasMore && !loading) {
      prevScrollHeight.current = containerRef.current?.scrollHeight ?? 0
      onLoadMore?.()
    }
  }, [inView, hasMore, loading])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-2">
      {hasMore && (
        <div ref={topRef} className="flex justify-center py-2">
          {loading ? <Spinner size="sm" /> : <div className="h-4" />}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1]
          const showAvatar = isGroup && (!prevMsg || prevMsg.user_id !== msg.user_id)
          const showDate = !prevMsg || new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString()
          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-dark-600" />
                  <span className="text-xs text-gray-500 px-2">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex-1 h-px bg-dark-600" />
                </div>
              )}
              <Message
                message={msg}
                isMine={msg.user_id === currentUserId}
                showAvatar={!!showAvatar}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
                onPin={onPin}
                onForward={onForward}
              />
            </React.Fragment>
          )
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
