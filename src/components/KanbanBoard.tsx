'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { MapPin, Calendar, ExternalLink, Plus, GripVertical, ChevronDown } from 'lucide-react';
import { JobApplication, ApplicationStatus } from '@/types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { STATUS_CONFIG, KANBAN_COLUMNS, formatRelativeDate } from '@/lib/utils';

interface KanbanBoardProps {
  applications: JobApplication[];
  onSelectApp: (app: JobApplication) => void;
  onUpdateApp: (id: string, updates: Partial<JobApplication>) => void;
  onAddApp: () => void;
  searchQuery: string;
}

function KanbanCard({
  app,
  onSelect,
  onStatusChange,
}: {
  app: JobApplication;
  onSelect: () => void;
  onStatusChange: (status: ApplicationStatus) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="kanban-card group"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: STATUS_CONFIG[app.status].bg,
              color: STATUS_CONFIG[app.status].color,
              border: `1px solid ${STATUS_CONFIG[app.status].border}`,
            }}
          >
            {app.company[0]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs truncate" style={{ color: 'var(--text-100)' }}>
              {app.company}
            </p>
          </div>
        </div>
        <PriorityBadge priority={app.priority} size="sm" />
      </div>

      {/* Position */}
      <p className="text-xs mb-3 leading-snug" style={{ color: 'var(--text-400)', lineHeight: 1.5 }}>
        {app.position}
      </p>

      {/* Meta */}
      <div className="space-y-1.5 mb-3">
        {app.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={10} style={{ color: 'var(--text-600)', flexShrink: 0 }} />
            <span className="text-xs truncate" style={{ color: 'var(--text-600)' }}>{app.location}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar size={10} style={{ color: 'var(--text-600)', flexShrink: 0 }} />
          <span className="text-xs" style={{ color: 'var(--text-600)' }}>
            {formatRelativeDate(app.dateApplied)}
          </span>
        </div>
        {app.salary && (
          <p className="text-xs font-mono" style={{ color: 'var(--text-600)' }}>{app.salary}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={onSelect}
          className="text-xs font-medium transition-colors hover:opacity-70"
          style={{ color: STATUS_CONFIG[app.status].color }}
        >
          View details →
        </button>

        {/* Quick status change */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowStatusMenu(s => !s); }}
            className="flex items-center gap-1 p-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-600)' }}
          >
            <GripVertical size={12} />
            <ChevronDown size={10} />
          </button>
          <AnimatePresence>
            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 bottom-full mb-1 z-50 rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(8,11,22,0.98)',
                  border: '1px solid var(--border-strong)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                  minWidth: 160,
                }}
                onMouseLeave={() => setShowStatusMenu(false)}
              >
                {KANBAN_COLUMNS.map(s => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => { onStatusChange(s); setShowStatusMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-white/5 text-left"
                      style={{ color: s === app.status ? cfg.color : 'var(--text-400)' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                      {cfg.label}
                      {s === app.status && <span className="ml-auto text-xs opacity-60">current</span>}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function KanbanColumn({
  status,
  cards,
  onSelectApp,
  onUpdateApp,
  onAddApp,
}: {
  status: ApplicationStatus;
  cards: JobApplication[];
  onSelectApp: (app: JobApplication) => void;
  onUpdateApp: (id: string, updates: Partial<JobApplication>) => void;
  onAddApp: () => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="kanban-column"
      style={{
        background: isDragOver ? `${cfg.bg}` : undefined,
        borderColor: isDragOver ? cfg.border : undefined,
        transition: 'background 0.2s, border-color 0.2s',
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const id = e.dataTransfer.getData('applicationId');
        if (id) onUpdateApp(id, { status });
      }}
    >
      {/* Column Header */}
      <div className="kanban-column-header" style={{ background: 'rgba(4,6,15,0.7)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-300)' }}>
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold font-mono px-2 py-0.5 rounded-md"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            {cards.length}
          </span>
          {status === 'applied' && (
            <button
              onClick={onAddApp}
              className="p-1 rounded-md hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-600)' }}
            >
              <Plus size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="kanban-cards">
        <AnimatePresence mode="popLayout">
          {cards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 gap-2"
              style={{ border: '1px dashed var(--border-subtle)', borderRadius: 8, margin: '4px 0' }}
            >
              <p className="text-xs text-center" style={{ color: 'var(--text-600)' }}>
                Drop cards here
              </p>
            </motion.div>
          ) : (
            cards.map(app => (
              <div
                key={app.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('applicationId', app.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
              >
                <KanbanCard
                  app={app}
                  onSelect={() => onSelectApp(app)}
                  onStatusChange={newStatus => onUpdateApp(app.id, { status: newStatus })}
                />
              </div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function KanbanBoard({ applications, onSelectApp, onUpdateApp, onAddApp, searchQuery }: KanbanBoardProps) {
  const filtered = useMemo(() => {
    if (!searchQuery) return applications;
    const q = searchQuery.toLowerCase();
    return applications.filter(a =>
      a.company.toLowerCase().includes(q) || a.position.toLowerCase().includes(q)
    );
  }, [applications, searchQuery]);

  const columns = useMemo(() =>
    KANBAN_COLUMNS.map(status => ({
      status,
      cards: filtered.filter(a => a.status === status),
    })),
    [filtered]
  );

  return (
    <div>
      {/* Board Stats */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4 flex-wrap"
      >
        {KANBAN_COLUMNS.map(s => {
          const count = applications.filter(a => a.status === s).length;
          const cfg = STATUS_CONFIG[s];
          if (count === 0) return null;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
              <span className="text-xs" style={{ color: 'var(--text-600)' }}>{cfg.label}:</span>
              <span className="text-xs font-bold font-mono" style={{ color: cfg.color }}>{count}</span>
            </div>
          );
        })}
        <span className="text-xs ml-2" style={{ color: 'var(--text-600)' }}>
          · Drag cards to update status
        </span>
      </motion.div>

      {/* Board */}
      <div className="kanban-board">
        {columns.map(({ status, cards }, i) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <KanbanColumn
              status={status}
              cards={cards}
              onSelectApp={onSelectApp}
              onUpdateApp={onUpdateApp}
              onAddApp={onAddApp}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
