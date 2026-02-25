import React from 'react';

interface Props { usernames: string[] }

const TypingIndicator = ({ usernames }: Props) => {
  if (usernames.length === 0) return null;
  const text = usernames.length === 1
    ? `${usernames[0]} is typing`
    : `${usernames.slice(0, 2).join(', ')} are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-iwa-subtext text-sm">
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-iwa-subtext rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span>{text}...</span>
    </div>
  );
};

export default TypingIndicator;
