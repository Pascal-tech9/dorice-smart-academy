import * as React from 'react';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type StatusVariant = 'paid' | 'partial' | 'unpaid' | 'overdue' | 'credit';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: StatusVariant;
  label?: string;
  showIcon?: boolean;
}

export function Badge({ variant, label, showIcon = true, className = '', children, ...props }: BadgeProps) {
  const configs = {
    paid: {
      text: label || 'Paid',
      styles: 'bg-success-soft text-success-fg border-success-border',
      icon: CheckCircle2,
    },
    partial: {
      text: label || 'Partial',
      styles: 'bg-warning-soft text-warning-fg border-warning-border',
      icon: Clock,
    },
    unpaid: {
      text: label || 'Unpaid',
      styles: 'bg-surface text-primary border-primary',
      icon: AlertCircle,
    },
    overdue: {
      text: label || 'Overdue',
      styles: 'bg-danger-soft text-danger-fg border-danger-border',
      icon: AlertTriangle,
    },
    credit: {
      text: label || 'Credit',
      styles: 'bg-info-soft text-info-fg border-info-border',
      icon: Info,
    },
  };

  const config = configs[variant];
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-fluid-xs font-bold border transition-colors ${config.styles} ${className}`}
      {...props}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{children || config.text}</span>
    </span>
  );
}
