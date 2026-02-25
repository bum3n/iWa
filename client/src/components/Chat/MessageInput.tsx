import React, { useState, useRef, useCallback, useEffect } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import api from '../../api';

interface Props {
  onSendMessage: (content: string, type?: string, fileUrl?: string, fileName?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

const MessageInput = ({ onSendMessage, onTypingStart, onTypingStop }: Props) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const handleTyping = (value: string) => {
    setText(value);
    if (!isTyping.current && value) {
      isTyping.current = true;
      onTypingStart();
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      onTypingStop();
    }, 2000);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setText('');
    isTyping.current = false;
    onTypingStop();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmoji = (emojiData: EmojiClickData) => {
    setText(prev => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const { data } = await api.post('/upload', formData);
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
      onSendMessage('', isImage ? 'image' : 'file', data.url, data.name);
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  useEffect(() => () => { if (typingTimeout.current) clearTimeout(typingTimeout.current); }, []);

  return (
    <div className="relative p-4 bg-iwa-sidebar border-t border-iwa-border">
      {showEmoji && (
        <div className="absolute bottom-full left-4 mb-2 z-50">
          <EmojiPicker onEmojiClick={handleEmoji} theme={Theme.DARK} height={350} width={300} />
        </div>
      )}
      <div className="flex items-end gap-2 bg-iwa-input rounded-2xl px-4 py-2 border border-iwa-border">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="text-iwa-subtext hover:text-iwa-accent transition-colors text-xl flex-shrink-0 pb-1"
          title="Emoji"
        >
          😊
        </button>
        <textarea
          value={text}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          rows={1}
          className="flex-1 bg-transparent text-iwa-text placeholder-iwa-subtext resize-none focus:outline-none text-sm max-h-32 min-h-[24px]"
          style={{ height: 'auto' }}
          onInput={e => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = Math.min(t.scrollHeight, 128) + 'px';
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-iwa-subtext hover:text-iwa-accent transition-colors text-lg flex-shrink-0 pb-1"
          title="Attach file"
        >
          {uploading ? '⏳' : '📎'}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.txt,.zip" />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="w-8 h-8 bg-iwa-accent rounded-full flex items-center justify-center flex-shrink-0 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
