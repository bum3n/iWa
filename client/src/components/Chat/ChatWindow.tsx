import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Message, Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import ChatHeader from './ChatHeader';

interface Props { conversation: Conversation }

const ChatWindow = ({ conversation }: Props) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isGroup = conversation.type !== 'direct';

  const scrollToBottom = useCallback((smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    setMessages([]);
    setTypingUsers(new Map());
    setLoading(true);
    
    api.get(`/conversations/${conversation.id}/messages`).then(({ data }) => {
      setMessages(data);
      setLoading(false);
      setTimeout(() => scrollToBottom(), 50);
    }).catch(() => setLoading(false));
  }, [conversation.id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_conversation', conversation.id);

    const handleNewMessage = (msg: Message) => {
      if (msg.conversation_id !== conversation.id) return;
      setMessages(prev => [...prev, msg]);
      setTimeout(() => scrollToBottom(true), 50);
      // Clear typing for sender
      setTypingUsers(prev => { const n = new Map(prev); n.delete(msg.sender_id); return n; });
    };

    const handleTyping = ({ userId, username, conversation_id }: { userId: number; username: string; conversation_id: number }) => {
      if (conversation_id !== conversation.id || userId === user?.id) return;
      setTypingUsers(prev => new Map(prev).set(userId, username));
    };

    const handleStopTyping = ({ userId, conversation_id }: { userId: number; conversation_id: number }) => {
      if (conversation_id !== conversation.id) return;
      setTypingUsers(prev => { const n = new Map(prev); n.delete(userId); return n; });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing', handleStopTyping);
    };
  }, [socket, conversation.id, user?.id]);

  const sendMessage = (content: string, type = 'text', fileUrl?: string, fileName?: string) => {
    if (!socket || (!content.trim() && !fileUrl)) return;
    socket.emit('send_message', {
      conversation_id: conversation.id,
      content,
      type,
      file_url: fileUrl,
      file_name: fileName
    });
  };

  const handleTypingStart = () => {
    socket?.emit('typing_start', { conversation_id: conversation.id });
  };

  const handleTypingStop = () => {
    socket?.emit('typing_stop', { conversation_id: conversation.id });
  };

  const typingUsernames = Array.from(typingUsers.values());

  return (
    <div className="flex flex-col h-full bg-iwa-chat">
      <ChatHeader conversation={conversation} />
      
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-iwa-subtext">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-iwa-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading messages...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-iwa-subtext">
            <div className="text-center">
              <div className="text-5xl mb-3">💬</div>
              <p>No messages yet</p>
              <p className="text-sm">Say hello!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg, idx) => {
              const prev = idx > 0 ? messages[idx - 1] : null;
              const showAvatar = !prev || prev.sender_id !== msg.sender_id;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === user?.id}
                  showAvatar={showAvatar}
                  isGroup={isGroup}
                />
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <TypingIndicator usernames={typingUsernames} />
      <MessageInput
        onSendMessage={sendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />
    </div>
  );
};

export default ChatWindow;
