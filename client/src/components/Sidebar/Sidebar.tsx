import React, { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api';
import ConversationItem from './ConversationItem';
import NewConversationModal from './NewConversationModal';
import Avatar from '../Common/Avatar';

interface Props {
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
}

const Sidebar = ({ activeConversation, onSelectConversation }: Props) => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [search, setSearch] = useState('');

  const loadConversations = useCallback(() => {
    api.get('/conversations').then(({ data }) => setConversations(data));
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: any) => {
      loadConversations();
    };
    socket.on('new_message', handler);
    return () => socket.off('new_message', handler);
  }, [socket, loadConversations]);

  const handleCreated = (conv: Conversation) => {
    setShowNewModal(false);
    api.get('/conversations').then(({ data }) => {
      setConversations(data);
      const full = data.find((c: Conversation) => c.id === conv.id) || conv;
      onSelectConversation(full);
    });
  };

  const filtered = conversations.filter(c => {
    const name = c.type === 'direct' ? c.other_username : c.name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-iwa-sidebar border-r border-iwa-border w-72 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-iwa-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <span className="font-bold text-iwa-text text-lg">iWa</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-iwa-hover text-iwa-subtext hover:text-iwa-accent transition-colors"
            title="New conversation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8H8v-.57c0-1.01 2-1.71 4-1.71s4 .7 4 1.71V14z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-iwa-input border border-iwa-border rounded-xl px-3 py-2 text-iwa-text placeholder-iwa-subtext text-sm focus:outline-none focus:border-iwa-accent"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.length === 0 ? (
          <div className="text-center text-iwa-subtext text-sm py-8">
            <div className="text-3xl mb-2">💬</div>
            <p>No conversations yet</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="text-iwa-accent hover:underline mt-1"
            >
              Start one!
            </button>
          </div>
        ) : (
          filtered.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversation?.id === conv.id}
              onClick={() => onSelectConversation(conv)}
            />
          ))
        )}
      </div>

      {/* User footer */}
      <div className="flex items-center justify-between px-3 py-3 border-t border-iwa-border">
        <div className="flex items-center gap-2 min-w-0">
          {user && <Avatar name={user.username} color={user.avatar_color} size="sm" online={true} />}
          <span className="text-sm text-iwa-text font-medium truncate">{user?.username}</span>
        </div>
        <button
          onClick={logout}
          className="text-xs text-iwa-subtext hover:text-red-400 transition-colors flex-shrink-0 ml-2"
          title="Logout"
        >
          ⇠ Logout
        </button>
      </div>

      {showNewModal && (
        <NewConversationModal onClose={() => setShowNewModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
};

export default Sidebar;
