import React from 'react';
import { Conversation } from '../../types';
import { useSocket } from '../../context/SocketContext';
import Avatar from '../Common/Avatar';

interface Props { conversation: Conversation }

const ChatHeader = ({ conversation }: Props) => {
  const { onlineUsers } = useSocket();
  
  const isGroup = conversation.type !== 'direct';
  const name = isGroup ? conversation.name : conversation.other_username;
  const color = isGroup ? (conversation.avatar_color || '#5288c1') : (conversation.other_avatar_color || '#5288c1');
  const isOnline = !isGroup && conversation.other_user_id ? onlineUsers.has(conversation.other_user_id) : false;
  
  const typeIcons = { direct: null, group: '👥', channel: '📢' };
  
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-iwa-sidebar border-b border-iwa-border shadow-sm">
      <Avatar name={name || '?'} color={color} size="md" online={!isGroup ? isOnline : undefined} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {typeIcons[conversation.type] && (
            <span className="text-sm">{typeIcons[conversation.type]}</span>
          )}
          <span className="font-semibold text-iwa-text truncate">{name || 'Unknown'}</span>
        </div>
        <p className="text-xs text-iwa-subtext">
          {isGroup
            ? `${conversation.member_count || 0} members`
            : isOnline ? 'online' : 'offline'
          }
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;
