import React, { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth, className, ...props }, ref) => (
    <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        className={clsx(
          'px-3 py-2 rounded-lg bg-dark-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors',
          error ? 'border-red-500' : 'border-dark-600',
          fullWidth && 'w-full',
          className
        )}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
)

Input.displayName = 'Input'
