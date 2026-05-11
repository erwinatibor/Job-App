'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Menu, Download, Upload, Sun, Moon, Command, X } from 'lucide-react';
import { ViewType } from '@/types';

interface TopBarProps {
  activeView: ViewType;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddClick: () => void;
  onMenuToggle: () => void;
  onExport?: () => void;
  onImport?: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const VIEW_LABELS: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Your job search at a glance' },
  applications: { title: 'Applications', subtitle: 'Manage and track every application' },
  kanban: { title: 'Pipeline', subtitle: 'Visual job search flow' },
  calendar: { title: 'Calendar', subtitle: 'Follow-ups & interview schedule' },
  profile: { title: 'Profile', subtitle: 'Your account & preferences' },
};

export default function TopBar({
  activeView,
  searchQuery,
  onSearchChange,
  onAddClick,
  onMenuToggle,
  onExport,
  darkMode,
  onToggleDark,
}: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewInfo = VIEW_LABELS[activeView];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        onSearchChange('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearchChange]);

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 gap-4"
      style={{
        height: 'var(--topbar-height)',
        background: 'rgba(4, 6, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Left: menu + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg transition-colors hover:bg-white/5 md:hidden"
          style={{ color: 'var(--text-400)' }}
        >
          <Menu size={18} />
        </button>
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="font-display font-bold text-lg leading-tight" style={{ color: 'var(--text-100)' }}>
            {viewInfo.title}
          </h1>
          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-600)' }}>
            {viewInfo.subtitle}
          </p>
        </motion.div>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <motion.div
          className="relative flex items-center"
          animate={{ width: searchFocused ? 280 : 200 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ minWidth: 160 }}
        >
          <Search
            size={14}
            className="absolute left-3 pointer-events-none"
            style={{ color: searchFocused ? 'var(--gold-500)' : 'var(--text-600)' }}
          />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search…"
            className="premium-input w-full pl-8 pr-16 py-2 text-sm"
          />
          <div
            className="absolute right-2.5 flex items-center gap-0.5 pointer-events-none"
            style={{ opacity: searchFocused && searchQuery ? 0 : 0.5 }}
          >
            {searchQuery ? (
              <button
                className="pointer-events-auto p-0.5"
                onMouseDown={e => { e.preventDefault(); onSearchChange(''); }}
                style={{ color: 'var(--text-400)' }}
              >
                <X size={12} />
              </button>
            ) : (
              <>
                <Command size={10} style={{ color: 'var(--text-600)' }} />
                <span className="text-xs" style={{ color: 'var(--text-600)', fontFamily: 'var(--font-mono)' }}>K</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Export */}
        {onExport && (
          <button
            onClick={onExport}
            className="p-2 rounded-lg transition-colors hover:bg-white/5 hidden sm:block"
            style={{ color: 'var(--text-400)' }}
            title="Export CSV"
          >
            <Download size={16} />
          </button>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-400)' }}
          title="Toggle theme"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Add button */}
        <button
          onClick={onAddClick}
          className="glow-btn flex items-center gap-2 px-4 py-2 text-sm hidden sm:flex"
          title="New application (⌘N)"
        >
          <Plus size={15} />
          <span>Add</span>
        </button>
      </div>
    </header>
  );
}
