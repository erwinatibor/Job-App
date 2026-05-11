'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Table2, Kanban, Calendar, User, Briefcase,
  ChevronLeft, ChevronRight, Plus, TrendingUp, Zap
} from 'lucide-react';
import { ViewType, JobApplication } from '@/types';
import { STATUS_CONFIG } from '@/lib/utils';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  applications: JobApplication[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddClick: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications' as ViewType, label: 'Applications', icon: Table2 },
  { id: 'kanban' as ViewType, label: 'Pipeline', icon: Kanban },
  { id: 'calendar' as ViewType, label: 'Calendar', icon: Calendar },
  { id: 'profile' as ViewType, label: 'Profile', icon: User },
];

export default function Sidebar({
  activeView,
  onViewChange,
  applications,
  collapsed,
  onToggleCollapse,
  onAddClick,
}: SidebarProps) {
  const offerCount = applications.filter(a => a.status === 'offer').length;
  const interviewCount = applications.filter(a => ['interview', 'final_interview'].includes(a.status)).length;
  const totalCount = applications.length;

  const quickStats = [
    { label: 'Total', value: totalCount, color: '#818cf8' },
    { label: 'Interviews', value: interviewCount, color: '#a78bfa' },
    { label: 'Offers', value: offerCount, color: '#34d399' },
  ];

  return (
    <motion.aside
      className="sidebar"
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: 'var(--border-subtle)', minHeight: 70 }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #d4a827, #f0c84a)' }}
              >
                <Zap size={15} className="text-black" />
              </div>
              <div>
                <p className="font-display font-bold text-base leading-none" style={{ color: 'var(--text-100)' }}>
                  Apex
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-600)' }}>
                  Job Tracker
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
            style={{ background: 'linear-gradient(135deg, #d4a827, #f0c84a)' }}
          >
            <Zap size={15} className="text-black" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-600)' }}
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Add Button */}
      <div className="px-3 py-3">
        <button
          onClick={onAddClick}
          className="glow-btn w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
          style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}
        >
          <Plus size={15} />
          {!collapsed && <span>New Application</span>}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="px-3 space-y-0.5 flex-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`sidebar-nav-item w-full ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.id === 'applications' && totalCount > 0 && (
                <span
                  className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-400)' }}
                >
                  {totalCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Stats (expanded only) */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-3 mb-3 p-3 rounded-12"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingUp size={12} style={{ color: 'var(--gold-500)' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-600)' }}>
                Quick Stats
              </span>
            </div>
            <div className="space-y-2">
              {quickStats.map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-400)' }}>{stat.label}</span>
                  <span className="text-sm font-bold font-mono" style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
            {/* Mini progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--text-600)' }}>Response Rate</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--gold-400)' }}>
                  {totalCount > 0
                    ? Math.round((applications.filter(a => !['applied', 'ghosted'].includes(a.status)).length / totalCount) * 100)
                    : 0}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #d4a827, #f0c84a)' }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${totalCount > 0
                      ? Math.round((applications.filter(a => !['applied', 'ghosted'].includes(a.status)).length / totalCount) * 100)
                      : 0}%`
                  }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle (collapsed state) */}
      {collapsed && (
        <div className="px-3 pb-4">
          <button
            onClick={onToggleCollapse}
            className="w-full p-2 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-600)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Profile Preview */}
      {!collapsed && (
        <div
          className="mx-3 mb-3 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors hover:bg-white/5"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
          onClick={() => onViewChange('profile')}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
          >
            J
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-200)' }}>Junnel</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-600)' }}>junnel@iozera.ai</p>
          </div>
          <Briefcase size={14} style={{ color: 'var(--text-600)', flexShrink: 0 }} />
        </div>
      )}
    </motion.aside>
  );
}
