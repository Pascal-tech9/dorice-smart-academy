import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-[10px] min-h-[44px]';

    const sizeStyles = {
      sm: 'h-9 px-3 text-fluid-xs',
      md: 'h-11 px-5 text-fluid-sm',
      lg: 'h-12 px-7 text-fluid-base',
    };

    const variantStyles = {
      primary: 'bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-active shadow-sm',
      accent: 'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active shadow-md',
      outline: 'border-2 border-primary text-primary hover:bg-primary-soft',
      ghost: 'text-primary hover:bg-primary-soft',
      destructive: 'bg-danger-solid text-text-inverse hover:opacity-90',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
