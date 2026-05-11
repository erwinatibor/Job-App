'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp, ChevronDown, ExternalLink, Edit3, Trash2, MoreHorizontal,
  Filter, SortAsc, MapPin, Calendar, DollarSign, User, AlertCircle, Search
} from 'lucide-react';
import { JobApplication, ApplicationStatus } from '@/types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, formatRelativeDate } from '@/lib/utils';

type SortKey = 'company' | 'dateApplied' | 'status' | 'priority' | 'followUpDate';
type SortDir = 'asc' | 'desc';

const ALL_STATUSES: ApplicationStatus[] = [
  'applied', 'contacted', 'screening', 'interview',
  'final_interview', 'offer', 'rejected', 'ghosted'
];

interface Props {
  applications: JobApplication[];
  onSelectApp: (app: JobApplication) => void;
  onUpdateApp: (id: string, updates: Partial<JobApplication>) => void;
  onDeleteApp: (id: string) => void;
  searchQuery: string;
}

export default function ApplicationsTable({ applications, onSelectApp, onUpdateApp, onDeleteApp, searchQuery }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('dateApplied');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let list = [...applications];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.company.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.recruiterName?.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      list = list.filter(a => a.status === filterStatus);
    }
    list.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if (sortKey === 'company') { aVal = a.company; bVal = b.company; }
      else if (sortKey === 'dateApplied') { aVal = a.dateApplied; bVal = b.dateApplied; }
      else if (sortKey === 'status') { aVal = a.status; bVal = b.status; }
      else if (sortKey === 'priority') {
        const order = { dream: 0, high: 1, medium: 2, low: 3 };
        aVal = order[a.priority]; bVal = order[b.priority];
      }
      else if (sortKey === 'followUpDate') {
        aVal = a.followUpDate || '9999'; bVal = b.followUpDate || '9999';
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [applications, searchQuery, filterStatus, sortKey, sortDir]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const SortIndicator = ({ col }: { col: SortKey }) => (
    <span className="ml-1 inline-flex flex-col" style={{ opacity: sortKey === col ? 1 : 0.3 }}>
      {sortDir === 'asc' && sortKey === col ? (
        <ChevronUp size={12} />
      ) : (
        <ChevronDown size={12} />
      )}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-2"
      >
        <div className="flex items-center gap-1.5 mr-2">
          <Filter size={13} style={{ color: 'var(--text-600)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-400)' }}>Filter:</span>
        </div>

        {/* All */}
        <button
          onClick={() => { setFilterStatus('all'); setPage(0); }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: filterStatus === 'all' ? 'rgba(212,168,39,0.12)' : 'rgba(255,255,255,0.04)',
            color: filterStatus === 'all' ? 'var(--gold-400)' : 'var(--text-400)',
            border: `1px solid ${filterStatus === 'all' ? 'rgba(212,168,39,0.25)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          All ({applications.length})
        </button>

        {ALL_STATUSES.map(s => {
          const count = applications.filter(a => a.status === s).length;
          if (count === 0) return null;
          const cfg = STATUS_CONFIG[s];
          const isActive = filterStatus === s;
          return (
            <button
              key={s}
              onClick={() => { setFilterStatus(isActive ? 'all' : s); setPage(0); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: isActive ? cfg.bg : 'rgba(255,255,255,0.04)',
                color: isActive ? cfg.color : 'var(--text-400)',
                border: `1px solid ${isActive ? cfg.border : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {cfg.label} ({count})
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-600)' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <Search size={24} style={{ color: 'var(--indigo-400)' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base" style={{ color: 'var(--text-200)' }}>No results found</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-600)' }}>
                {searchQuery ? `No applications match "${searchQuery}"` : 'No applications with this status'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('company')} style={{ paddingLeft: 20 }}>
                    Company <SortIndicator col="company" />
                  </th>
                  <th>Position</th>
                  <th>
                    <div className="flex items-center gap-1"><DollarSign size={11} />Salary</div>
                  </th>
                  <th>
                    <div className="flex items-center gap-1"><MapPin size={11} />Location</div>
                  </th>
                  <th onClick={() => toggleSort('dateApplied')}>
                    <div className="flex items-center gap-1"><Calendar size={11} />Applied <SortIndicator col="dateApplied" /></div>
                  </th>
                  <th onClick={() => toggleSort('status')}>
                    Status <SortIndicator col="status" />
                  </th>
                  <th onClick={() => toggleSort('priority')}>
                    Priority <SortIndicator col="priority" />
                  </th>
                  <th>
                    <div className="flex items-center gap-1"><User size={11} />Recruiter</div>
                  </th>
                  <th onClick={() => toggleSort('followUpDate')}>
                    Follow-up <SortIndicator col="followUpDate" />
                  </th>
                  <th style={{ paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {paged.map((app, i) => (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ delay: i * 0.03 }}
                      className="group"
                    >
                      {/* Company */}
                      <td style={{ paddingLeft: 20 }}>
                        <button
                          onClick={() => onSelectApp(app)}
                          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left"
                        >
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                          >
                            {app.company[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-100)' }}>
                              {app.company}
                            </p>
                            {app.industry && (
                              <p className="text-xs" style={{ color: 'var(--text-600)' }}>{app.industry}</p>
                            )}
                          </div>
                        </button>
                      </td>

                      {/* Position */}
                      <td>
                        <p className="text-sm max-w-[180px] truncate" style={{ color: 'var(--text-200)' }}>
                          {app.position}
                        </p>
                        {app.remote && (
                          <span className="text-xs" style={{ color: 'var(--text-600)' }}>Remote</span>
                        )}
                      </td>

                      {/* Salary */}
                      <td>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-400)' }}>
                          {app.salary || '—'}
                        </span>
                      </td>

                      {/* Location */}
                      <td>
                        <span className="text-xs max-w-[120px] truncate block" style={{ color: 'var(--text-400)' }}>
                          {app.location}
                        </span>
                      </td>

                      {/* Date Applied */}
                      <td>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-300)' }}>
                            {formatDate(app.dateApplied)}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-600)' }}>
                            {formatRelativeDate(app.dateApplied)}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={app.status} />
                      </td>

                      {/* Priority */}
                      <td>
                        <PriorityBadge priority={app.priority} />
                      </td>

                      {/* Recruiter */}
                      <td>
                        {app.recruiterName ? (
                          <div>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-300)' }}>
                              {app.recruiterName}
                            </p>
                            {app.contactLink && (
                              <a
                                href={app.contactLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs hover:opacity-70 transition-opacity flex items-center gap-0.5"
                                style={{ color: 'var(--indigo-400)' }}
                                onClick={e => e.stopPropagation()}
                              >
                                LinkedIn <ExternalLink size={9} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-600)' }}>—</span>
                        )}
                      </td>

                      {/* Follow-up */}
                      <td>
                        {app.followUpDate ? (
                          <div className="flex items-center gap-1">
                            {new Date(app.followUpDate + 'T00:00:00') <= new Date() && (
                              <AlertCircle size={11} style={{ color: '#f87171', flexShrink: 0 }} />
                            )}
                            <span
                              className="text-xs font-mono"
                              style={{
                                color: new Date(app.followUpDate + 'T00:00:00') <= new Date()
                                  ? '#f87171' : 'var(--text-400)'
                              }}
                            >
                              {formatDate(app.followUpDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-600)' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ paddingRight: 20 }}>
                        <div className="flex items-center gap-1">
                          {app.jobLink && (
                            <a
                              href={app.jobLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                              style={{ color: 'var(--text-600)' }}
                              title="View job posting"
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <button
                            onClick={() => onSelectApp(app)}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            style={{ color: 'var(--text-600)' }}
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); onDeleteApp(app.id); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                            style={{ color: 'var(--text-600)' }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-600)' }}>
              Page {page + 1} of {totalPages} · {filtered.length} results
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5 disabled:opacity-30"
                style={{ color: 'var(--text-400)', border: '1px solid var(--border-default)' }}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: page === p ? 'rgba(212,168,39,0.15)' : 'transparent',
                    color: page === p ? 'var(--gold-400)' : 'var(--text-400)',
                    border: page === p ? '1px solid rgba(212,168,39,0.25)' : '1px solid transparent',
                  }}
                >
                  {p + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5 disabled:opacity-30"
                style={{ color: 'var(--text-400)', border: '1px solid var(--border-default)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
