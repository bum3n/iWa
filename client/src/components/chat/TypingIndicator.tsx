import React from 'react'

interface TypingIndicatorProps {
  names: string[]
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (!names.length) return null

  const text = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing`
    : `${names[0]} and ${names.length - 1} others are typing`

  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot" />
      </div>
      <span className="text-xs text-gray-400">{text}</span>
    </div>
  )
}
