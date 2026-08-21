import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-11 w-full rounded-lg bg-white/60 dark:bg-gray-800/60 border border-slate-900/10 dark:border-gray-700 px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150',
            error && 'border-red-600 focus:border-red-600 focus:ring-red-600/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';