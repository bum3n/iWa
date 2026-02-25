import React from 'react';
import { Conversation } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNowStrict } from 'date-fns';
import Avatar from '../Common/Avatar';

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem = ({ conversation, isActive, onClick }: Props) => {
  const { onlineUsers } = useSocket();
  const isGroup = conversation.type !== 'direct';
  const name = isGroup ? conversation.name : conversation.other_username;
  const color = isGroup ? (conversation.avatar_color || '#5288c1') : (conversation.other_avatar_color || '#5288c1');
  const isOnline = !isGroup && conversation.other_user_id ? onlineUsers.has(conversation.other_user_id) : undefined;
  
  const typeEmoji = conversation.type === 'channel' ? '📢 ' : conversation.type === 'group' ? '👥 ' : '';
  
  let timeStr = '';
  if (conversation.last_message_at) {
    try {
      timeStr = formatDistanceToNowStrict(new Date(conversation.last_message_at), { addSuffix: false });
    } catch { timeStr = ''; }
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 cursor-pointer rounded-xl transition-colors ${
        isActive ? 'bg-iwa-hover' : 'hover:bg-iwa-hover/60'
      }`}
    >
      <Avatar name={name || '?'} color={color} size="md" online={isOnline} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-iwa-text text-sm truncate">
            {typeEmoji}{name || 'Unknown'}
          </span>
          {timeStr && <span className="text-xs text-iwa-subtext flex-shrink-0 ml-2">{timeStr}</span>}
        </div>
        {conversation.last_message && (
          <p className="text-xs text-iwa-subtext truncate mt-0.5">{conversation.last_message}</p>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
