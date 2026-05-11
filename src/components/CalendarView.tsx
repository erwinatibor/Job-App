'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalIcon, Circle } from 'lucide-react';
import { JobApplication } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '@/lib/utils';

interface Props {
  applications: JobApplication[];
  onSelectApp: (app: JobApplication) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarView({ applications, onSelectApp }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const navigate = (dir: -1 | 1) => {
    setMonth(m => {
      const newMonth = m + dir;
      if (newMonth < 0) { setYear(y => y - 1); return 11; }
      if (newMonth > 11) { setYear(y => y + 1); return 0; }
      return newMonth;
    });
  };

  const dateMap = useMemo(() => {
    const map: Record<string, JobApplication[]> = {};
    applications.forEach(app => {
      [app.dateApplied, app.followUpDate].forEach(d => {
        if (!d) return;
        const key = d;
        if (!map[key]) map[key] = [];
        map[key].push(app);
      });
    });
    return map;
  }, [applications]);

  const upcomingFollowUps = useMemo(() =>
    applications
      .filter(a => a.followUpDate)
      .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime())
      .slice(0, 8),
    [applications]
  );

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => {
    if (i < firstDay) return null;
    const day = i - firstDay + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { day, dateStr, apps: dateMap[dateStr] || [] };
  });

  const isToday = (dateStr: string) => {
    return dateStr === today.toISOString().split('T')[0];
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 glass-card overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-100)' }}>
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-400)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-400)', border: '1px solid var(--border-default)' }}
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-400)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-4 pt-3 pb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold py-1 uppercase tracking-wider"
              style={{ color: 'var(--text-600)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 px-4 pb-4 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} />;
            const hasEvents = cell.apps.length > 0;
            const today_ = isToday(cell.dateStr);
            return (
              <motion.div
                key={cell.dateStr}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.005 }}
                className="rounded-lg p-1.5 min-h-[52px] cursor-pointer transition-colors hover:bg-white/[0.03]"
                style={{
                  background: today_ ? 'rgba(212,168,39,0.08)' : undefined,
                  border: today_ ? '1px solid rgba(212,168,39,0.25)' : '1px solid transparent',
                }}
              >
                <span
                  className="text-xs font-semibold block mb-1 text-right w-5 ml-auto rounded-full h-5 flex items-center justify-center"
                  style={{
                    color: today_ ? 'var(--gold-400)' : 'var(--text-400)',
                    background: today_ ? 'rgba(212,168,39,0.12)' : undefined,
                  }}
                >
                  {cell.day}
                </span>
                {hasEvents && (
                  <div className="space-y-0.5">
                    {cell.apps.slice(0, 2).map(app => (
                      <button
                        key={app.id + cell.dateStr}
                        onClick={() => onSelectApp(app)}
                        className="w-full text-left rounded px-1 py-0.5 text-xs truncate transition-opacity hover:opacity-70"
                        style={{
                          background: 'rgba(99,102,241,0.15)',
                          color: '#818cf8',
                          fontSize: 10,
                          lineHeight: '1.3',
                        }}
                      >
                        {app.company}
                      </button>
                    ))}
                    {cell.apps.length > 2 && (
                      <p className="text-xs pl-1" style={{ color: 'var(--text-600)', fontSize: 10 }}>
                        +{cell.apps.length - 2}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Sidebar: Upcoming Follow-ups */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <Clock size={15} style={{ color: 'var(--gold-500)' }} />
            <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-100)' }}>
              Follow-ups
            </h3>
          </div>
          {upcomingFollowUps.length === 0 ? (
            <div className="py-10 text-center">
              <CalIcon size={28} style={{ color: 'var(--text-600)', margin: '0 auto 8px' }} />
              <p className="text-sm" style={{ color: 'var(--text-600)' }}>No follow-ups scheduled</p>
            </div>
          ) : (
            <div>
              {upcomingFollowUps.map((app, i) => {
                const isPast = new Date(app.followUpDate! + 'T00:00:00') < today;
                return (
                  <motion.button
                    key={app.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.04 }}
                    onClick={() => onSelectApp(app)}
                    className="w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: i < upcomingFollowUps.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                  >
                    <Circle
                      size={8}
                      style={{ color: isPast ? '#f87171' : 'var(--gold-500)', marginTop: 5, flexShrink: 0 }}
                      fill="currentColor"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-100)' }}>
                        {app.company}
                      </p>
                      <p className="text-xs truncate mb-1" style={{ color: 'var(--text-400)' }}>
                        {app.position}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-mono font-medium"
                          style={{ color: isPast ? '#f87171' : 'var(--gold-400)' }}
                        >
                          {formatDate(app.followUpDate!)}
                          {isPast && ' (overdue)'}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="glass-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-600)' }}>
            Legend
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)' }} />
              <span style={{ color: 'var(--text-400)' }}>Application / Follow-up</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(212,168,39,0.12)', border: '1px solid rgba(212,168,39,0.3)' }} />
              <span style={{ color: 'var(--text-400)' }}>Today</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
