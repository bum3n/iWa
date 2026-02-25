import React from 'react';
import { Message } from '../../types';
import { format } from 'date-fns';
import Avatar from '../Common/Avatar';

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isGroup: boolean;
}

const MessageBubble = ({ message, isOwn, showAvatar, isGroup }: Props) => {
  const time = format(new Date(message.created_at), 'HH:mm');
  const isImage = message.type === 'image' || (message.file_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(message.file_url || ''));

  return (
    <div className={`flex items-end gap-2 group mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && isGroup && (
        <div className={`mb-1 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
          <Avatar name={message.sender_username} color={message.sender_avatar_color} size="sm" />
        </div>
      )}

      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && isGroup && showAvatar && (
          <span className="text-xs text-iwa-accent mb-1 ml-1">{message.sender_username}</span>
        )}
        
        <div
          className={`rounded-2xl px-4 py-2 relative ${
            isOwn
              ? 'bg-iwa-bubble rounded-br-sm text-white'
              : 'bg-iwa-bubble2 rounded-bl-sm text-iwa-text'
          }`}
        >
          {isImage && message.file_url ? (
            <div>
              <img
                src={message.file_url}
                alt={message.file_name || 'image'}
                className="max-w-full rounded-lg max-h-64 object-contain"
              />
              {message.content && <p className="mt-1 text-sm">{message.content}</p>}
            </div>
          ) : message.type === 'file' && message.file_url ? (
            <a
              href={message.file_url}
              download={message.file_name}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <span>📎</span>
              <span>{message.file_name || 'Download file'}</span>
            </a>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          <span className={`text-xs mt-1 block text-right ${isOwn ? 'text-blue-200' : 'text-iwa-subtext'}`}>
            {time}
            {isOwn && ' ✓'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
