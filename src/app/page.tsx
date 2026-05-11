'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import MouseGlow from '@/components/MouseGlow';
import { ToastProvider, useToast } from '@/components/Toast';
import { StatusBadge } from '@/components/StatusBadge';
import CompanyModal from '@/components/CompanyModal';
import QuickAddModal from '@/components/QuickAddModal';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { mockApplications } from '@/data/mockData';
import { JobApplication, ViewType } from '@/types';
import { exportToCSV } from '@/lib/utils';

const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });
const ApplicationsTable = dynamic(() => import('@/components/ApplicationsTable'), { ssr: false });
const KanbanBoard = dynamic(() => import('@/components/KanbanBoard'), { ssr: false });
const CalendarView = dynamic(() => import('@/components/CalendarView'), { ssr: false });
const ProfileView = dynamic(() => import('@/components/ProfileView'), { ssr: false });

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

function AppInner() {
  const { addToast } = useToast();
  const [applications, setApplications, isLoaded] = useLocalStorage<JobApplication[]>(
    'apex-applications',
    mockApplications
  );
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); setActiveView('dashboard'); }
      if ((e.metaKey || e.ctrlKey) && e.key === '2') { e.preventDefault(); setActiveView('applications'); }
      if ((e.metaKey || e.ctrlKey) && e.key === '3') { e.preventDefault(); setActiveView('kanban'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addApplication = useCallback((app: Omit<JobApplication, 'id' | 'timeline'>) => {
    const newApp: JobApplication = {
      ...app,
      id: `app-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timeline: [{
        id: `t-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'applied',
        title: 'Application Submitted',
        description: 'Added to tracker',
      }],
    };
    setApplications(prev => [newApp, ...prev]);
    addToast({ type: 'success', title: 'Application added!', message: `${app.company} — ${app.position}` });
  }, [setApplications, addToast]);

  const updateApplication = useCallback((id: string, updates: Partial<JobApplication>) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    if (updates.status) {
      addToast({ type: 'info', title: 'Status updated', message: `Moved to ${updates.status.replace('_', ' ')}` });
    }
    // Keep modal in sync
    setSelectedApp(prev => prev?.id === id ? { ...prev, ...updates } : prev);
  }, [setApplications, addToast]);

  const deleteApplication = useCallback((id: string) => {
    const app = applications.find(a => a.id === id);
    setApplications(prev => prev.filter(a => a.id !== id));
    addToast({ type: 'info', title: 'Deleted', message: app ? `${app.company} removed` : undefined });
  }, [applications, setApplications, addToast]);

  const handleImport = useCallback((imported: JobApplication[]) => {
    setApplications(prev => [...imported, ...prev]);
  }, [setApplications]);

  const handleClearAll = useCallback(() => {
    setApplications([]);
  }, [setApplications]);

  const handleExport = useCallback(() => {
    const data = applications.map(a => ({
      Company: a.company,
      Position: a.position,
      Salary: a.salary || '',
      Location: a.location,
      'Date Applied': a.dateApplied,
      Status: a.status,
      Priority: a.priority,
      Recruiter: a.recruiterName || '',
      'Follow-up': a.followUpDate || '',
      Notes: a.notes,
    }));
    exportToCSV(data, `apex-applications-${new Date().toISOString().split('T')[0]}.csv`);
    addToast({ type: 'success', title: 'Exported', message: `${applications.length} applications` });
  }, [applications, addToast]);

  const sidebarWidth = sidebarCollapsed ? 72 : 260;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-3 w-64">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-8 rounded-xl" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-root"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Background */}
      <div className="bg-orbs" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <MouseGlow />

      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={v => { setActiveView(v); setSearchQuery(''); }}
        applications={applications}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      {/* Main */}
      <main
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <TopBar
          activeView={activeView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => setIsAddModalOpen(true)}
          onMenuToggle={() => setSidebarCollapsed(c => !c)}
          onExport={handleExport}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
        />

        <div className="view-container flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              {activeView === 'dashboard' && (
                <Dashboard
                  applications={applications}
                  onSelectApp={setSelectedApp}
                  onAddApp={() => setIsAddModalOpen(true)}
                />
              )}
              {activeView === 'applications' && (
                <ApplicationsTable
                  applications={applications}
                  onSelectApp={setSelectedApp}
                  onUpdateApp={updateApplication}
                  onDeleteApp={deleteApplication}
                  searchQuery={searchQuery}
                />
              )}
              {activeView === 'kanban' && (
                <KanbanBoard
                  applications={applications}
                  onSelectApp={setSelectedApp}
                  onUpdateApp={updateApplication}
                  onAddApp={() => setIsAddModalOpen(true)}
                  searchQuery={searchQuery}
                />
              )}
              {activeView === 'calendar' && (
                <CalendarView
                  applications={applications}
                  onSelectApp={setSelectedApp}
                />
              )}
              {activeView === 'profile' && (
                <ProfileView
                  applications={applications}
                  onImport={handleImport}
                  onClearAll={handleClearAll}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Keyboard shortcut hint */}
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full text-xs pointer-events-none"
          style={{
            background: 'rgba(8,11,22,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-600)',
            fontFamily: 'var(--font-mono)',
            opacity: 0.7,
          }}
        >
          <span>⌘N add</span>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <span>⌘K search</span>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <span>⌘1–3 views</span>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedApp && (
          <CompanyModal
            key="company-modal"
            application={selectedApp}
            onClose={() => setSelectedApp(null)}
            onUpdate={updateApplication}
            onDelete={deleteApplication}
          />
        )}
        {isAddModalOpen && (
          <QuickAddModal
            key="add-modal"
            onClose={() => setIsAddModalOpen(false)}
            onAdd={addApplication}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
