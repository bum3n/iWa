import React, { useEffect, useRef } from 'react'
import EmojiPickerReact, { EmojiClickData, Theme } from 'emoji-picker-react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div ref={ref}>
      <EmojiPickerReact
        onEmojiClick={(data: EmojiClickData) => onSelect(data.emoji)}
        theme={Theme.DARK}
        width={320}
        height={400}
      />
    </div>
  )
}
