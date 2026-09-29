import * as React from 'react';

export function Card({
  className = '',
  highlight = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { highlight?: boolean }) {
  return (
    <div
      className={`rounded-[12px] border transition-all ${
        highlight
          ? 'bg-surface-highlight border-warning-border'
          : 'bg-surface border-border shadow-[0_4px_20px_-4px_rgba(18,63,112,0.08)]'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pb-3 flex flex-col gap-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-fluid-lg font-black text-primary leading-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-fluid-sm text-text-muted ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pt-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pt-0 flex items-center justify-between border-t border-border mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
