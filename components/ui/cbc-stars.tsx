import * as React from 'react';
import { Star } from 'lucide-react';

export type CbcLevel = 'EE' | 'ME' | 'AE' | 'BE';

interface CbcStarsProps {
  level: CbcLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CbcStars({ level, showLabel = true, size = 'md', className = '' }: CbcStarsProps) {
  const configs = {
    EE: {
      stars: 4,
      code: 'EE',
      title: 'Exceeding Expectations',
      containerStyles: 'bg-level-ee-soft text-level-ee-fg border-success-border',
      starFill: 'fill-level-ee text-level-ee',
    },
    ME: {
      stars: 3,
      code: 'ME',
      title: 'Meeting Expectations',
      containerStyles: 'bg-level-me-soft text-level-me-fg border-info-border',
      starFill: 'fill-level-me text-level-me',
    },
    AE: {
      stars: 2,
      code: 'AE',
      title: 'Approaching Expectations',
      containerStyles: 'bg-level-ae-soft text-level-ae-fg border-warning-border',
      starFill: 'fill-level-ae text-level-ae',
    },
    BE: {
      stars: 1,
      code: 'BE',
      title: 'Below Expectations',
      containerStyles: 'bg-level-be-soft text-level-be-fg border-danger-border',
      starFill: 'fill-level-be text-level-be',
    },
  };

  const config = configs[level];

  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-fluid-xs font-bold ${config.containerStyles} ${className}`}
      title={`${config.code} - ${config.title}`}
    >
      <div className="flex items-center gap-0.5" aria-label={`${config.stars} out of 4 stars`}>
        {[1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={`${starSizes[size]} ${
              i <= config.stars ? config.starFill : 'text-border opacity-40'
            }`}
          />
        ))}
      </div>
      <span className="font-black tracking-wide">{config.code}</span>
      {showLabel && <span className="text-fluid-xs font-medium opacity-90 hidden sm:inline">({config.title})</span>}
    </div>
  );
}
