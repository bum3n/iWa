import React from 'react'
import clsx from 'clsx'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
  className?: string
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const dotSizeMap = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
}

export function Avatar({ src, name, size = 'md', online, className }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const colors = ['bg-primary-600', 'bg-purple-600', 'bg-green-600', 'bg-orange-600', 'bg-pink-600']
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0

  return (
    <div className={clsx('relative flex-shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name ?? ''}
          className={clsx('rounded-full object-cover', sizeMap[size])}
        />
      ) : (
        <div className={clsx('rounded-full flex items-center justify-center font-semibold text-white', sizeMap[size], colors[colorIndex])}>
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span className={clsx(
          'absolute bottom-0 right-0 rounded-full border-2 border-dark-800',
          dotSizeMap[size],
          online ? 'bg-green-500' : 'bg-gray-500'
        )} />
      )}
    </div>
  )
}
