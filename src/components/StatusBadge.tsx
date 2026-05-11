'use client';

import { ApplicationStatus, PriorityTier } from '@/types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/utils';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export function StatusBadge({ status, size = 'md', showDot = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${sizeClasses[size]}`}
      style={{
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {showDot && (
        <span
          className="rounded-full flex-shrink-0"
          style={{
            width: size === 'sm' ? 5 : 6,
            height: size === 'sm' ? 5 : 6,
            backgroundColor: config.color,
            boxShadow: `0 0 6px ${config.color}`,
          }}
        />
      )}
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: PriorityTier;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md whitespace-nowrap ${sizeClass}`}
      style={{
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}22`,
      }}
    >
      {config.icon} {config.label}
    </span>
  );
}
