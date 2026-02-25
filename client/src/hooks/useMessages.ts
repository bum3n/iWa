import { useState, useCallback, useEffect, useRef } from 'react'
import { messagesApi, Message } from '../services/api'
import { useSocket } from './useSocket'

export function useMessages(chatId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const { socket } = useSocket()
  const chatIdRef = useRef(chatId)
  chatIdRef.current = chatId

  const loadMessages = useCallback(async (before?: number) => {
    if (!chatId) return
    setLoading(true)
    try {
      const res = await messagesApi.list(chatId, before)
      if (before) {
        setMessages(prev => [...res.data.messages, ...prev])
      } else {
        setMessages(res.data.messages)
      }
      setHasMore(res.data.hasMore)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [chatId])

  useEffect(() => {
    setMessages([])
    setHasMore(false)
    if (chatId) loadMessages()
  }, [chatId])

  useEffect(() => {
    if (!socket) return

    const handleNew = (data: { message: Message }) => {
      if (data.message.chat_id === chatIdRef.current) {
        setMessages(prev => {
          const exists = prev.find(m => m.id === data.message.id)
          if (exists) return prev
          return [...prev, data.message]
        })
      }
    }

    const handleUpdated = (data: { message: Message }) => {
      if (data.message.chat_id === chatIdRef.current) {
        setMessages(prev => prev.map(m => m.id === data.message.id ? data.message : m))
      }
    }

    const handleDeleted = (data: { messageId: string; chatId: string }) => {
      if (data.chatId === chatIdRef.current) {
        setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, is_deleted: 1, content: '' } : m))
      }
    }

    socket.on('message:new', handleNew)
    socket.on('message:updated', handleUpdated)
    socket.on('message:deleted', handleDeleted)

    return () => {
      socket.off('message:new', handleNew)
      socket.off('message:updated', handleUpdated)
      socket.off('message:deleted', handleDeleted)
    }
  }, [socket])

  const sendMessage = useCallback(async (data: {
    content: string; type?: string; reply_to_id?: string
    file_url?: string; file_name?: string; file_size?: number
  }) => {
    if (!chatId) return
    if (socket) {
      socket.emit('message:send', { chatId, ...data })
    } else {
      const res = await messagesApi.send(chatId, data)
      setMessages(prev => [...prev, res.data.message])
    }
  }, [chatId, socket])

  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!chatId) return
    if (socket) {
      socket.emit('message:edit', { chatId, messageId, content })
    } else {
      const res = await messagesApi.edit(chatId, messageId, content)
      setMessages(prev => prev.map(m => m.id === messageId ? res.data.message : m))
    }
  }, [chatId, socket])

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!chatId) return
    if (socket) {
      socket.emit('message:delete', { chatId, messageId })
    } else {
      await messagesApi.delete(chatId, messageId)
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: 1, content: '' } : m))
    }
  }, [chatId, socket])

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!chatId) return
    await messagesApi.react(chatId, messageId, emoji)
    await loadMessages()
  }, [chatId, loadMessages])

  return { messages, loading, hasMore, loadMessages, sendMessage, editMessage, deleteMessage, addReaction }
}
