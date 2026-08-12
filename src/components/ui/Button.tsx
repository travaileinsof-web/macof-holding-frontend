import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'luxury';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-foreground text-background hover:bg-foreground/90',
      outline: 'border border-black/20 text-foreground hover:border-primary hover:text-primary',
      ghost: 'hover:bg-black/5 hover:text-primary',
      luxury: 'bg-primary text-primary-foreground uppercase tracking-[0.2em] font-medium shadow-[0_0_20px_rgba(0,85,164,0.15)] hover:shadow-[0_0_30px_rgba(0,85,164,0.3)] hover:bg-blue-800',
    };

    const sizes = {
      default: 'h-12 px-6 py-2',
      sm: 'h-10 px-4 text-xs',
      lg: 'h-14 px-10 text-sm tracking-[0.2em]',
      icon: 'h-12 w-12',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-none text-xs font-sans transition-all duration-500 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

