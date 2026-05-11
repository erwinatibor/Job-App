'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, DollarSign, ExternalLink, Calendar, User, Link2,
  FileText, Clock, Tag, Building2, ChevronRight, Edit3, Check, Briefcase, Trash2
} from 'lucide-react';
import { JobApplication, ApplicationStatus, PriorityTier } from '@/types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { STATUS_CONFIG, PRIORITY_CONFIG, KANBAN_COLUMNS, formatDate, formatRelativeDate } from '@/lib/utils';

interface Props {
  application: JobApplication;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<JobApplication>) => void;
  onDelete: (id: string) => void;
}

const TABS = ['Overview', 'Timeline', 'Contact'] as const;
type Tab = typeof TABS[number];

const TIMELINE_ICONS: Record<string, string> = {
  applied: '📋',
  contacted: '✉️',
  screening: '🔍',
  interview: '🎯',
  offer: '🎉',
  rejection: '❌',
  note: '📝',
  followup: '🔔',
};

export default function CompanyModal({ application: app, onClose, onUpdate, onDelete }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(app.notes);
  const [editingStatus, setEditingStatus] = useState(false);

  const saveNotes = () => {
    onUpdate(app.id, { notes });
    setEditingNotes(false);
  };

  const updateStatus = (status: ApplicationStatus) => {
    onUpdate(app.id, { status });
    setEditingStatus(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="modal-card"
      >
        {/* Header */}
        <div
          className="relative p-6 pb-0"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 60%)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Header actions */}
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <button
              onClick={() => {
                if (window.confirm(`Delete ${app.company} — ${app.position}? This cannot be undone.`)) {
                  onDelete(app.id);
                  onClose();
                }
              }}
              className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
              style={{ color: 'var(--text-600)' }}
              title="Delete application"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-400)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Company info */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{
                background: `${STATUS_CONFIG[app.status].bg}`,
                border: `1px solid ${STATUS_CONFIG[app.status].border}`,
                color: STATUS_CONFIG[app.status].color,
                fontSize: 22,
              }}
            >
              {app.company[0]}
            </div>
            <div className="flex-1 min-w-0 pr-10">
              <h2 className="font-display font-bold text-xl mb-0.5" style={{ color: 'var(--text-100)' }}>
                {app.company}
              </h2>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-400)' }}>{app.position}</p>
              <div className="flex flex-wrap items-center gap-2">
                {/* Status dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setEditingStatus(s => !s)}
                    className="flex items-center gap-1 transition-opacity hover:opacity-75"
                  >
                    <StatusBadge status={app.status} size="md" />
                    <ChevronRight size={12} style={{ color: 'var(--text-600)' }} />
                  </button>
                  <AnimatePresence>
                    {editingStatus && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
                        style={{
                          background: 'rgba(8,11,22,0.98)',
                          border: '1px solid var(--border-strong)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                          minWidth: 170,
                        }}
                        onMouseLeave={() => setEditingStatus(false)}
                      >
                        {KANBAN_COLUMNS.map(s => {
                          const cfg = STATUS_CONFIG[s];
                          return (
                            <button
                              key={s}
                              onClick={() => updateStatus(s)}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                              style={{ color: s === app.status ? cfg.color : 'var(--text-400)' }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                              {cfg.label}
                              {s === app.status && <Check size={10} className="ml-auto" style={{ color: cfg.color }} />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <PriorityBadge priority={app.priority} />
                {app.remote && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                    Remote
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick meta row */}
          <div className="flex flex-wrap items-center gap-4 pb-4 text-xs" style={{ color: 'var(--text-400)' }}>
            {app.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={12} style={{ color: 'var(--text-600)' }} />
                {app.location}
              </div>
            )}
            {app.salary && (
              <div className="flex items-center gap-1.5">
                <DollarSign size={12} style={{ color: 'var(--text-600)' }} />
                {app.salary}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar size={12} style={{ color: 'var(--text-600)' }} />
              Applied {formatDate(app.dateApplied)}
            </div>
            {app.industry && (
              <div className="flex items-center gap-1.5">
                <Building2 size={12} style={{ color: 'var(--text-600)' }} />
                {app.industry}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-0">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2.5 text-sm font-medium relative transition-colors"
                style={{ color: activeTab === tab ? 'var(--text-100)' : 'var(--text-400)' }}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #d4a827, #f0c84a)' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {/* OVERVIEW TAB */}
              {activeTab === 'Overview' && (
                <div className="space-y-5">
                  {/* Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-600)' }}>
                        Notes
                      </label>
                      <button
                        onClick={() => editingNotes ? saveNotes() : setEditingNotes(true)}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors hover:bg-white/5"
                        style={{ color: editingNotes ? 'var(--gold-400)' : 'var(--text-400)' }}
                      >
                        {editingNotes ? <><Check size={11} /> Save</> : <><Edit3 size={11} /> Edit</>}
                      </button>
                    </div>
                    {editingNotes ? (
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="premium-input w-full p-3 text-sm resize-none leading-relaxed"
                        rows={5}
                        autoFocus
                        style={{ fontFamily: 'var(--font-body)' }}
                      />
                    ) : (
                      <div
                        className="rounded-xl p-4 text-sm leading-relaxed"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-subtle)',
                          color: notes ? 'var(--text-200)' : 'var(--text-600)',
                        }}
                      >
                        {notes || 'No notes yet. Click Edit to add notes.'}
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  {(app.jobLink || app.contactLink) && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-600)' }}>
                        Links
                      </p>
                      <div className="space-y-2">
                        {app.jobLink && (
                          <a
                            href={app.jobLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-3 rounded-xl transition-colors hover:bg-white/5"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', color: 'var(--text-200)' }}
                          >
                            <Briefcase size={14} style={{ color: 'var(--indigo-400)', flexShrink: 0 }} />
                            <span className="text-sm truncate flex-1">Job Posting</span>
                            <ExternalLink size={12} style={{ color: 'var(--text-600)', flexShrink: 0 }} />
                          </a>
                        )}
                        {app.contactLink && (
                          <a
                            href={app.contactLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-3 rounded-xl transition-colors hover:bg-white/5"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', color: 'var(--text-200)' }}
                          >
                            <Link2 size={14} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                            <span className="text-sm truncate flex-1">LinkedIn / Contact</span>
                            <ExternalLink size={12} style={{ color: 'var(--text-600)', flexShrink: 0 }} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {app.tags && app.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-600)' }}>
                        <Tag size={11} /> Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {app.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium"
                            style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-400)', border: '1px solid var(--border-default)' }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up */}
                  {app.followUpDate && (
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{
                        background: 'rgba(212,168,39,0.06)',
                        border: '1px solid rgba(212,168,39,0.15)',
                      }}
                    >
                      <Clock size={16} style={{ color: 'var(--gold-500)', flexShrink: 0 }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--gold-400)' }}>Follow-up Scheduled</p>
                        <p className="text-xs" style={{ color: 'var(--text-400)' }}>{formatDate(app.followUpDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'Timeline' && (
                <div>
                  {app.timeline.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm" style={{ color: 'var(--text-600)' }}>No timeline events yet</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Vertical line */}
                      <div
                        className="absolute left-[22px] top-2 bottom-2 w-px"
                        style={{ background: 'linear-gradient(to bottom, rgba(212,168,39,0.4), rgba(99,102,241,0.2), transparent)' }}
                      />
                      <div className="space-y-1">
                        {[...app.timeline].reverse().map((event, i) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex gap-4 pl-1"
                          >
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 z-10"
                              style={{ background: 'rgba(10,13,24,0.98)', border: '1px solid var(--border-default)' }}
                            >
                              {TIMELINE_ICONS[event.type] || '📌'}
                            </div>
                            <div
                              className="flex-1 rounded-xl p-3.5 mb-2"
                              style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-100)' }}>
                                  {event.title}
                                </p>
                                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-600)', fontFamily: 'var(--font-mono)' }}>
                                  {formatDate(event.date)}
                                </span>
                              </div>
                              {event.description && (
                                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-400)' }}>
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONTACT TAB */}
              {activeTab === 'Contact' && (
                <div className="space-y-4">
                  {app.recruiterName ? (
                    <div
                      className="flex items-center gap-4 p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                      >
                        {app.recruiterName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-100)' }}>
                          {app.recruiterName}
                        </p>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-400)' }}>Recruiter at {app.company}</p>
                        {app.contactLink && (
                          <a
                            href={app.contactLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors hover:opacity-80"
                            style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.2)' }}
                          >
                            <Link2 size={11} /> View LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <User size={32} style={{ color: 'var(--text-600)', margin: '0 auto 12px' }} />
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-400)' }}>No recruiter contact yet</p>
                      <p className="text-xs" style={{ color: 'var(--text-600)' }}>Add recruiter info when you hear back</p>
                    </div>
                  )}

                  {/* Next follow-up */}
                  <div
                    className="p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-600)' }}>
                      Outreach Timeline
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-400)' }}>Applied</span>
                        <span className="font-mono" style={{ color: 'var(--text-300)' }}>{formatDate(app.dateApplied)}</span>
                      </div>
                      {app.followUpDate && (
                        <div className="flex justify-between text-xs">
                          <span style={{ color: 'var(--text-400)' }}>Follow-up due</span>
                          <span className="font-mono" style={{ color: 'var(--gold-400)' }}>{formatDate(app.followUpDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
