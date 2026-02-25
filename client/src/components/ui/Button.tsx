import React, { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import { Spinner } from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-primary-600 hover:bg-primary-700 text-white': variant === 'primary',
          'bg-dark-700 hover:bg-dark-600 text-white': variant === 'secondary',
          'bg-transparent hover:bg-dark-700 text-gray-300': variant === 'ghost',
          'bg-red-600 hover:bg-red-700 text-white': variant === 'danger',
          'px-2.5 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
          'w-full': fullWidth,
        },
        className
      )}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {children}
    </button>
  )
}
