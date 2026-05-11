import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ApplicationStatus, PriorityTier } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_CONFIG: Record<ApplicationStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  emoji: string;
}> = {
  applied: {
    label: 'Applied',
    color: '#818cf8',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.25)',
    glow: 'rgba(99, 102, 241, 0.15)',
    emoji: '📋',
  },
  contacted: {
    label: 'Contacted',
    color: '#22d3ee',
    bg: 'rgba(34, 211, 238, 0.1)',
    border: 'rgba(34, 211, 238, 0.25)',
    glow: 'rgba(34, 211, 238, 0.12)',
    emoji: '✉️',
  },
  screening: {
    label: 'Screening',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.1)',
    border: 'rgba(251, 191, 36, 0.25)',
    glow: 'rgba(251, 191, 36, 0.12)',
    emoji: '🔍',
  },
  interview: {
    label: 'Interview',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.25)',
    glow: 'rgba(167, 139, 250, 0.15)',
    emoji: '🎯',
  },
  final_interview: {
    label: 'Final Round',
    color: '#f472b6',
    bg: 'rgba(244, 114, 182, 0.12)',
    border: 'rgba(244, 114, 182, 0.25)',
    glow: 'rgba(244, 114, 182, 0.15)',
    emoji: '🚀',
  },
  offer: {
    label: 'Offer',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.1)',
    border: 'rgba(52, 211, 153, 0.3)',
    glow: 'rgba(52, 211, 153, 0.2)',
    emoji: '🎉',
  },
  rejected: {
    label: 'Rejected',
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.1)',
    border: 'rgba(248, 113, 113, 0.2)',
    glow: 'rgba(248, 113, 113, 0.1)',
    emoji: '❌',
  },
  ghosted: {
    label: 'Ghosted',
    color: '#9ca3af',
    bg: 'rgba(156, 163, 175, 0.08)',
    border: 'rgba(156, 163, 175, 0.2)',
    glow: 'rgba(156, 163, 175, 0.08)',
    emoji: '👻',
  },
};

export const PRIORITY_CONFIG: Record<PriorityTier, {
  label: string;
  color: string;
  bg: string;
  icon: string;
}> = {
  dream: {
    label: 'Dream',
    color: '#d4a827',
    bg: 'rgba(212, 168, 39, 0.12)',
    icon: '⭐',
  },
  high: {
    label: 'High',
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.1)',
    icon: '🔥',
  },
  medium: {
    label: 'Medium',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.1)',
    icon: '▲',
  },
  low: {
    label: 'Low',
    color: '#9ca3af',
    bg: 'rgba(156, 163, 175, 0.08)',
    icon: '▼',
  },
};

export const KANBAN_COLUMNS: ApplicationStatus[] = [
  'applied',
  'contacted',
  'screening',
  'interview',
  'final_interview',
  'offer',
  'rejected',
  'ghosted',
];

export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val == null ? '' : String(val);
        return str.includes(',') ? `"${str}"` : str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
