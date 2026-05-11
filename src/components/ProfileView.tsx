'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Briefcase, Github, Linkedin, Globe, Settings, Download,
  Upload, Trash2, Target, Star, Award, Shield, Bell
} from 'lucide-react';
import { JobApplication } from '@/types';
import { useToast } from './Toast';
import { exportToCSV } from '@/lib/utils';

interface Props {
  applications: JobApplication[];
  onImport: (apps: JobApplication[]) => void;
  onClearAll: () => void;
}

export default function ProfileView({ applications, onImport, onClearAll }: Props) {
  const { addToast } = useToast();
  const [profile, setProfile] = useState({
    name: 'Junnel',
    email: 'junnel@iozera.ai',
    title: 'Full-Stack Engineer',
    github: 'github.com/junnel',
    linkedin: 'linkedin.com/in/junnel',
    website: '',
    targetRole: 'Senior Frontend Engineer',
    targetSalary: '$170,000 – $200,000',
    monthlyGoal: 20,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const stats = {
    total: applications.length,
    offers: applications.filter(a => a.status === 'offer').length,
    interviews: applications.filter(a => ['interview', 'final_interview'].includes(a.status)).length,
    responseRate: applications.length > 0
      ? Math.round((applications.filter(a => !['applied', 'ghosted'].includes(a.status)).length / applications.length) * 100)
      : 0,
  };

  const handleExport = () => {
    const data = applications.map(app => ({
      Company: app.company,
      Position: app.position,
      Salary: app.salary || '',
      Location: app.location,
      'Date Applied': app.dateApplied,
      Status: app.status,
      Priority: app.priority,
      Recruiter: app.recruiterName || '',
      'Follow-up': app.followUpDate || '',
      Notes: app.notes,
      Tags: app.tags.join(', '),
    }));
    exportToCSV(data, `apex-applications-${new Date().toISOString().split('T')[0]}.csv`);
    addToast({ type: 'success', title: 'Exported!', message: `${applications.length} applications exported to CSV` });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (Array.isArray(json)) {
          onImport(json);
          addToast({ type: 'success', title: 'Imported!', message: `${json.length} applications imported` });
        }
      } catch {
        addToast({ type: 'error', title: 'Import failed', message: 'File must be valid JSON' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(applications, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `apex-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    addToast({ type: 'success', title: 'Backup created', message: 'JSON backup downloaded' });
  };

  const saveProfile = () => {
    setProfile(draft);
    setEditing(false);
    addToast({ type: 'success', title: 'Profile updated' });
  };

  const achievements = [
    { icon: '🎯', label: 'First Application', unlocked: stats.total >= 1 },
    { icon: '🚀', label: '10 Applications', unlocked: stats.total >= 10 },
    { icon: '💬', label: 'First Interview', unlocked: stats.interviews >= 1 },
    { icon: '🏆', label: 'Offer Received', unlocked: stats.offers >= 1 },
    { icon: '🔥', label: '7-Day Streak', unlocked: true },
    { icon: '⭐', label: '25+ Applications', unlocked: stats.total >= 25 },
  ];

  return (
    <div className="max-w-3xl space-y-5">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white' }}
            >
              {profile.name[0]}
            </div>
            <div>
              {editing ? (
                <input
                  value={draft.name}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  className="premium-input px-3 py-1.5 text-xl font-bold mb-1 w-48"
                  style={{ fontFamily: 'var(--font-display)' }}
                />
              ) : (
                <h2 className="font-display font-bold text-xl mb-0.5" style={{ color: 'var(--text-100)' }}>
                  {profile.name}
                </h2>
              )}
              {editing ? (
                <input
                  value={draft.title}
                  onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                  className="premium-input px-3 py-1.5 text-sm w-48"
                />
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-400)' }}>{profile.title}</p>
              )}
            </div>
          </div>
          <button
            onClick={editing ? saveProfile : () => { setDraft(profile); setEditing(true); }}
            className={editing ? 'glow-btn px-4 py-2 text-sm' : 'px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors'}
            style={editing ? {} : { color: 'var(--text-400)', border: '1px solid var(--border-default)' }}
          >
            {editing ? 'Save Profile' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Mail, label: 'Email', key: 'email' },
            { icon: Target, label: 'Target Role', key: 'targetRole' },
            { icon: Linkedin, label: 'LinkedIn', key: 'linkedin' },
            { icon: Github, label: 'GitHub', key: 'github' },
          ].map(({ icon: Icon, label, key }) => (
            <div key={key} className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
              <Icon size={14} style={{ color: 'var(--text-600)', flexShrink: 0 }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs" style={{ color: 'var(--text-600)' }}>{label}</p>
                {editing ? (
                  <input
                    value={draft[key as keyof typeof draft] as string}
                    onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                    className="premium-input w-full px-2 py-1 text-xs mt-0.5"
                  />
                ) : (
                  <p className="text-sm truncate" style={{ color: 'var(--text-200)' }}>
                    {profile[key as keyof typeof profile] || '—'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Job Search Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-3"
      >
        {[
          { label: 'Applications', value: stats.total, color: '#818cf8' },
          { label: 'Interviews', value: stats.interviews, color: '#a78bfa' },
          { label: 'Offers', value: stats.offers, color: '#34d399' },
          { label: 'Response %', value: `${stats.responseRate}%`, color: '#d4a827' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="glass-card p-4 text-center"
          >
            <p className="font-mono font-bold text-2xl mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-400)' }}>{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Award size={16} style={{ color: 'var(--gold-500)' }} />
          <h3 className="font-display font-semibold" style={{ color: 'var(--text-100)' }}>Achievements</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map(a => (
            <div
              key={a.label}
              className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all"
              style={{
                background: a.unlocked ? 'rgba(212,168,39,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${a.unlocked ? 'rgba(212,168,39,0.15)' : 'rgba(255,255,255,0.06)'}`,
                opacity: a.unlocked ? 1 : 0.4,
              }}
            >
              <span className="text-2xl">{a.icon}</span>
              <p className="text-xs font-medium" style={{ color: a.unlocked ? 'var(--text-200)' : 'var(--text-600)' }}>
                {a.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} style={{ color: 'var(--indigo-400)' }} />
          <h3 className="font-display font-semibold" style={{ color: 'var(--text-100)' }}>Data & Export</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)', color: 'var(--text-200)' }}
          >
            <Download size={14} style={{ color: 'var(--gold-500)' }} /> Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)', color: 'var(--text-200)' }}
          >
            <Download size={14} style={{ color: 'var(--indigo-400)' }} /> Backup JSON
          </button>
          <label className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)', color: 'var(--text-200)' }}>
            <Upload size={14} style={{ color: '#34d399' }} /> Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Delete ALL applications? This cannot be undone.')) {
              onClearAll();
              addToast({ type: 'info', title: 'All data cleared' });
            }
          }}
          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-red-500/10"
          style={{ color: 'var(--text-600)' }}
        >
          <Trash2 size={12} style={{ color: '#f87171' }} />
          Clear all application data
        </button>
      </motion.div>
    </div>
  );
}
