import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { chatsApi, channelsApi, Chat } from '../../services/api'
import { Avatar } from '../ui/Avatar'
import { ChatList } from '../chat/ChatList'
import { GlobalSearch } from '../search/GlobalSearch'

export function Sidebar() {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState<'chats' | 'channels'>('chats')
  const [chats, setChats] = useState<Chat[]>([])
  const [channels, setChannels] = useState<Chat[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadChats()
    loadChannels()
    const interval = setInterval(loadChats, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const loadChats = async () => {
    try {
      const res = await chatsApi.list()
      setChats(res.data.chats.filter(c => c.type !== 'channel'))
    } catch {}
  }

  const loadChannels = async () => {
    try {
      const res = await chatsApi.list()
      setChannels(res.data.chats.filter(c => c.type === 'channel'))
    } catch {}
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return
    try {
      const res = await chatsApi.createGroup(groupName.trim(), '', [])
      setShowNewGroup(false)
      setGroupName('')
      await loadChats()
      navigate(`/chat/${res.data.id}`)
    } catch {}
  }

  const currentChatId = location.pathname.split('/chat/')[1]

  return (
    <div className="w-80 flex-shrink-0 h-full bg-dark-800 border-r border-dark-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-dark-700">
        <h1 className="text-xl font-bold text-primary-400">iWa</h1>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="p-1.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
            title="New"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {showNewMenu && (
            <div className="absolute right-0 top-8 bg-dark-700 rounded-xl shadow-xl border border-dark-600 py-1 z-10 w-44">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white" onClick={() => { setShowSearch(true); setShowNewMenu(false) }}>
                {t.chat.newChat}
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 hover:text-white" onClick={() => { setShowNewGroup(true); setShowNewMenu(false) }}>
                {t.chat.newGroup}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-lg text-gray-400 hover:text-gray-300 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>{t.chat.search}</span>
          <kbd className="ml-auto text-xs bg-dark-600 px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-1 mb-2">
        <button
          onClick={() => setTab('chats')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === 'chats' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          {t.chat.chats}
        </button>
        <button
          onClick={() => setTab('channels')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === 'channels' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          {t.chat.channels}
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        <ChatList
          chats={tab === 'chats' ? chats : channels}
          currentChatId={currentChatId}
          currentUserId={user?.id ?? ''}
          onChatClick={id => navigate(`/chat/${id}`)}
        />
      </div>

      {/* Bottom */}
      <div className="px-4 py-3 border-t border-dark-700 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <Avatar src={user?.avatar_url} name={user?.display_name} size="sm" online />
          <span className="text-sm font-medium text-white truncate">{user?.display_name}</span>
        </button>
        <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors" title="Settings">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button onClick={logout} className="p-1.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors" title={t.auth.logout}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNewGroup(false)} />
          <div className="relative bg-dark-800 rounded-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">{t.chat.newGroup}</h3>
            <input
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Group name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowNewGroup(false)} className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg text-sm">{t.profile.cancel}</button>
              <button onClick={handleCreateGroup} className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm">{t.common.create}</button>
            </div>
          </div>
        </div>
      )}

      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} onSelectChat={id => { navigate(`/chat/${id}`); setShowSearch(false) }} />}
    </div>
  )
}
