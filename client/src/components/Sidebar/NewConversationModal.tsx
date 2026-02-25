import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import api from '../../api';
import Avatar from '../Common/Avatar';

interface Props {
  onClose: () => void;
  onCreated: (conv: any) => void;
}

const NewConversationModal = ({ onClose, onCreated }: Props) => {
  const [tab, setTab] = useState<'direct' | 'group' | 'channel'>('direct');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(data));
  }, []);

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  const toggleUser = (id: number) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (tab === 'direct' && selectedUsers.length !== 1) return;
    if ((tab === 'group' || tab === 'channel') && !name.trim()) return;
    
    setLoading(true);
    try {
      const { data } = await api.post('/conversations', {
        type: tab,
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        member_ids: selectedUsers
      });
      onCreated(data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-iwa-sidebar border border-iwa-border rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-iwa-border">
          <h2 className="font-semibold text-iwa-text">New Conversation</h2>
          <button onClick={onClose} className="text-iwa-subtext hover:text-iwa-text text-xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-iwa-border">
          {(['direct', 'group', 'channel'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedUsers([]); }}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'text-iwa-accent border-b-2 border-iwa-accent' : 'text-iwa-subtext hover:text-iwa-text'
              }`}
            >
              {t === 'direct' ? '💬 Direct' : t === 'group' ? '👥 Group' : '📢 Channel'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(tab === 'group' || tab === 'channel') && (
            <>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={`${tab === 'channel' ? 'Channel' : 'Group'} name`}
                className="w-full bg-iwa-input border border-iwa-border rounded-lg px-3 py-2 text-iwa-text placeholder-iwa-subtext text-sm focus:outline-none focus:border-iwa-accent"
              />
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-iwa-input border border-iwa-border rounded-lg px-3 py-2 text-iwa-text placeholder-iwa-subtext text-sm focus:outline-none focus:border-iwa-accent"
              />
            </>
          )}

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-iwa-input border border-iwa-border rounded-lg px-3 py-2 text-iwa-text placeholder-iwa-subtext text-sm focus:outline-none focus:border-iwa-accent"
          />

          <div className="space-y-1">
            {filtered.map(u => (
              <div
                key={u.id}
                onClick={() => tab === 'direct' ? setSelectedUsers([u.id]) : toggleUser(u.id)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedUsers.includes(u.id) ? 'bg-iwa-accent/20 border border-iwa-accent/40' : 'hover:bg-iwa-hover'
                }`}
              >
                <Avatar name={u.username} color={u.avatar_color} size="sm" />
                <span className="text-iwa-text text-sm">{u.username}</span>
                {selectedUsers.includes(u.id) && <span className="ml-auto text-iwa-accent">✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-iwa-border">
          <button
            onClick={handleCreate}
            disabled={loading || (tab === 'direct' && selectedUsers.length !== 1) || ((tab === 'group' || tab === 'channel') && !name.trim())}
            className="w-full bg-iwa-accent hover:bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
