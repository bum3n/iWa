import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersApi, chatsApi, channelsApi, PublicUser, Chat } from '../../services/api'
import { Avatar } from '../ui/Avatar'

interface GlobalSearchProps {
  onClose: () => void
  onSelectChat: (id: string) => void
}

export function GlobalSearch({ onClose, onSelectChat }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<PublicUser[]>([])
  const [publicChannels, setPublicChannels] = useState<Chat[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
    channelsApi.listPublic().then(res => setPublicChannels(res.data.channels)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!query.trim()) { setUsers([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await usersApi.search(query)
        setUsers(res.data.users)
      } catch {}
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleUserClick = async (user: PublicUser) => {
    try {
      const res = await chatsApi.createDirect(user.id)
      onSelectChat(res.data.id)
    } catch {}
  }

  const filteredChannels = publicChannels.filter(c =>
    !query || c.name?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-dark-600 animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-600">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search users, channels..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
          />
          {loading && <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />}
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {/* Users */}
          {users.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Users</div>
              {users.map(user => (
                <button key={user.id} onClick={() => handleUserClick(user)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700 transition-colors text-left">
                  <Avatar src={user.avatar_url} name={user.display_name} size="sm" online={user.status === 'online'} />
                  <div>
                    <div className="text-sm font-medium text-white">{user.display_name}</div>
                    <div className="text-xs text-gray-500">@{user.username}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Channels */}
          {filteredChannels.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Public Channels</div>
              {filteredChannels.map(ch => (
                <button key={ch.id} onClick={() => onSelectChat(ch.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700 transition-colors text-left">
                  <Avatar src={ch.avatar_url || null} name={ch.name} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-white">{ch.name}</div>
                    <div className="text-xs text-gray-500">{ch.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && !users.length && !loading && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">No results found</div>
          )}

          {!query && !filteredChannels.length && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">Start typing to search...</div>
          )}
        </div>
      </div>
    </div>
  )
}
