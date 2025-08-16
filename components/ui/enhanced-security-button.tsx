import React from 'react';
import { cn } from '@/lib/utils';

interface SecurityButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'emergency' | 'secure' | 'premium';
  children: React.ReactNode;
}

export const SecurityButton = React.forwardRef<HTMLButtonElement, SecurityButtonProps>(
  ({ className, children, variant = 'secure', ...props }, ref) => {
    const variants = {
      emergency: 'bg-red-600 hover:bg-red-700 text-white border-red-500 animate-pulse',
      secure: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500',
      premium: 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black border-yellow-400'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 border-2 shadow-lg',
          'transform hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-4 focus:ring-opacity-50',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="relative z-10 flex items-center gap-2">
          {variant === 'emergency' && <span className="text-lg">🚨</span>}
          {variant === 'secure' && <span className="text-lg">🛡️</span>}
          {variant === 'premium' && <span className="text-lg">⭐</span>}
          {children}
        </div>
        
        {/* Subtle glow effect */}
        <div className={cn(
          'absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300',
          variant === 'emergency' && 'bg-red-400 group-hover:opacity-20',
          variant === 'secure' && 'bg-blue-400 group-hover:opacity-20',
          variant === 'premium' && 'bg-yellow-400 group-hover:opacity-20'
        )} />
      </button>
    );
  }
);

SecurityButton.displayName = 'SecurityButton';
