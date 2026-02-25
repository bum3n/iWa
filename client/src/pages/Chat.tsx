import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useMessages } from '../hooks/useMessages'
import { chatsApi, messagesApi, Chat, Message } from '../services/api'
import { MessageList } from '../components/chat/MessageList'
import { MessageInput } from '../components/chat/MessageInput'
import { TypingIndicator } from '../components/chat/TypingIndicator'
import { Avatar } from '../components/ui/Avatar'
import { Spinner } from '../components/ui/Spinner'

export function ChatPage() {
  const { id: chatId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()
  const { messages, loading, hasMore, loadMessages, sendMessage, editMessage, deleteMessage, addReaction } = useMessages(chatId)

  const [chat, setChat] = useState<Chat | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editMsg, setEditMsg] = useState<Message | null>(null)
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
  const [showPinned, setShowPinned] = useState(false)
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([])
  const [showMembers, setShowMembers] = useState(false)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const isTypingRef = useRef(false)

  useEffect(() => {
    if (!chatId) return
    setChatLoading(true)
    chatsApi.get(chatId)
      .then(res => setChat(res.data as unknown as Chat))
      .catch(() => navigate('/chat'))
      .finally(() => setChatLoading(false))
  }, [chatId])

  useEffect(() => {
    if (!socket || !chatId) return
    socket.emit('chat:join', { chatId })
    socket.emit('message:read', { chatId })

    const handleTypingStart = (data: { userId: string; displayName: string; chatId: string }) => {
      if (data.chatId === chatId && data.userId !== user?.id) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: data.displayName }))
      }
    }
    const handleTypingStop = (data: { userId: string; chatId: string }) => {
      if (data.chatId === chatId) {
        setTypingUsers(prev => { const n = { ...prev }; delete n[data.userId]; return n })
      }
    }
    socket.on('typing:start', handleTypingStart)
    socket.on('typing:stop', handleTypingStop)
    return () => {
      socket.off('typing:start', handleTypingStart)
      socket.off('typing:stop', handleTypingStop)
    }
  }, [socket, chatId, user?.id])

  const handleTyping = useCallback(() => {
    if (!socket || !chatId) return
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit('typing:start', { chatId })
    }
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      socket.emit('typing:stop', { chatId })
    }, 2000)
  }, [socket, chatId])

  const handleSend = useCallback(async (data: Parameters<typeof sendMessage>[0]) => {
    if (editMsg) {
      await editMessage(editMsg.id, data.content)
      setEditMsg(null)
    } else {
      await sendMessage({ ...data, reply_to_id: replyTo?.id })
      setReplyTo(null)
    }
  }, [editMsg, replyTo, sendMessage, editMessage])

  const loadPinnedMessages = async () => {
    if (!chatId) return
    const res = await messagesApi.pinned(chatId)
    setPinnedMessages(res.data.messages)
  }

  const togglePinned = () => {
    if (!showPinned) loadPinnedMessages()
    setShowPinned(!showPinned)
  }

  const handlePin = async (messageId: string) => {
    if (!chatId) return
    await messagesApi.pin(chatId, messageId)
    if (showPinned) loadPinnedMessages()
    loadMessages()
  }

  const chatName = chat?.name ?? 'Chat'
  const otherMember = chat?.type === 'direct'
    ? chat.members?.find(m => m.user_id !== user?.id)
    : null
  const isGroup = chat?.type === 'group' || chat?.type === 'channel'
  const memberCount = chat?.members?.length ?? 0

  if (chatLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700 bg-dark-800">
          <Avatar
            src={chat?.avatar_url || otherMember?.avatar_url || null}
            name={chatName}
            size="sm"
            online={otherMember?.status === 'online'}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{chatName}</div>
            <div className="text-xs text-gray-400">
              {otherMember
                ? otherMember.status === 'online' ? '● online' : '○ offline'
                : `${memberCount} members`}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={togglePinned}
              className={`p-2 rounded-lg hover:bg-dark-700 transition-colors ${showPinned ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}
              title="Pinned messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            {isGroup && (
              <button
                onClick={() => setShowMembers(!showMembers)}
                className={`p-2 rounded-lg hover:bg-dark-700 transition-colors ${showMembers ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}
                title="Members"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Pinned messages panel */}
        {showPinned && (
          <div className="border-b border-dark-700 bg-dark-800/50 max-h-40 overflow-y-auto">
            <div className="px-4 py-2 text-xs font-medium text-gray-400">📌 Pinned Messages</div>
            {pinnedMessages.length === 0 ? (
              <div className="px-4 pb-2 text-xs text-gray-500">No pinned messages</div>
            ) : (
              pinnedMessages.map(msg => (
                <div key={msg.id} className="px-4 py-1.5 hover:bg-dark-700 text-xs text-gray-300 truncate">
                  <span className="text-primary-400 mr-1">{msg.sender?.display_name}:</span>
                  {msg.content}
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages */}
        <MessageList
          messages={messages}
          currentUserId={user?.id ?? ''}
          isGroup={isGroup}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={() => messages[0] && loadMessages(messages[0].created_at)}
          onReply={msg => setReplyTo(msg)}
          onEdit={msg => setEditMsg(msg)}
          onDelete={deleteMessage}
          onReact={addReaction}
          onPin={handlePin}
        />

        <TypingIndicator names={Object.values(typingUsers)} />

        <div onKeyDown={handleTyping}>
          <MessageInput
            onSend={handleSend}
            replyTo={replyTo}
            editMessage={editMsg}
            onCancelReply={() => setReplyTo(null)}
            onCancelEdit={() => setEditMsg(null)}
          />
        </div>
      </div>

      {/* Members sidebar */}
      {showMembers && isGroup && (
        <div className="w-64 border-l border-dark-700 bg-dark-800 flex flex-col">
          <div className="px-4 py-3 border-b border-dark-700">
            <span className="text-sm font-medium text-white">Members ({memberCount})</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {chat?.members?.map(member => (
              <div key={member.user_id} className="flex items-center gap-3 px-4 py-2">
                <Avatar src={member.avatar_url} name={member.display_name} size="sm" online={member.status === 'online'} />
                <div>
                  <div className="text-xs font-medium text-white">{member.display_name}</div>
                  {(member.role === 'owner' || member.role === 'admin') && (
                    <div className="text-xs text-primary-400">{member.role}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
