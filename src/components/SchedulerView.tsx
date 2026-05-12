'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Clock, Video, Phone, MapPin, Plus, Trash2,
  Check, ChevronDown, Copy, ExternalLink, Settings, Link2,
  Sparkles, Edit3, X, Monitor, Users
} from 'lucide-react';
import { Interview, InterviewType, InterviewFormat, JobApplication, UserAvailability, AvailabilityDay } from '@/types';
import { useToast } from './Toast';

interface Props {
  interviews: Interview[];
  availability: UserAvailability;
  applications: JobApplication[];
  onAddInterview: (i: Omit<Interview, 'id'>) => void;
  onUpdateInterview: (id: string, updates: Partial<Interview>) => void;
  onDeleteInterview: (id: string) => void;
  onSaveAvailability: (a: UserAvailability) => void;
}

const INTERVIEW_TYPES: { value: InterviewType; label: string; icon: string }[] = [
  { value: 'phone_screen', label: 'Phone Screen', icon: '📞' },
  { value: 'technical', label: 'Technical', icon: '💻' },
  { value: 'behavioral', label: 'Behavioral', icon: '🎯' },
  { value: 'final_round', label: 'Final Round', icon: '🏆' },
  { value: 'hr', label: 'HR Interview', icon: '👥' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const FORMAT_ICONS: Record<InterviewFormat, React.ElementType> = {
  video: Monitor,
  phone: Phone,
  in_person: MapPin,
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DURATIONS = [30, 45, 60, 90];
const BUFFERS = [0, 15, 30] as const;

function formatDateTime(date: string, time: string) {
  const d = new Date(`${date}T${time}`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getCountdown(date: string, time: string): string {
  const target = new Date(`${date}T${time}`).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff < 0) return 'Past';
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hrs}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function generateBookingLink(av: UserAvailability): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const enabled = av.days.filter(d => d.enabled);
  const params = new URLSearchParams({
    name: av.name,
    tz: av.timezone,
    days: enabled.map(d => d.day).join(','),
    start: enabled[0]?.startTime ?? '09:00',
    end: enabled[0]?.endTime ?? '17:00',
    dur: av.durations.join(','),
    buf: String(av.bufferMinutes),
  });
  return `${base}/book?${params.toString()}`;
}

// ── Add Interview Modal ────────────────────────────────────────────────
function AddInterviewModal({
  applications,
  onAdd,
  onClose,
}: {
  applications: JobApplication[];
  onAdd: (i: Omit<Interview, 'id'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    applicationId: '',
    company: '',
    position: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: 60 as Interview['duration'],
    type: 'phone_screen' as InterviewType,
    format: 'video' as InterviewFormat,
    meetingLink: '',
    location: '',
    notes: '',
    interviewers: '',
    status: 'upcoming' as Interview['status'],
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleAppSelect = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    set('applicationId', appId);
    if (app) { set('company', app.company); set('position', app.position); }
  };

  const handleSubmit = () => {
    if (!form.company || !form.date || !form.time) return;
    onAdd({ ...form });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.22 }}
        className="modal-card"
        style={{ maxWidth: 560 }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-100)' }}>Schedule Interview</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-400)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Link to application */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Link to Application (optional)</label>
            <select
              value={form.applicationId}
              onChange={e => handleAppSelect(e.target.value)}
              className="premium-input w-full px-3 py-2.5 text-sm"
              style={{ color: form.applicationId ? 'var(--text-100)' : 'var(--text-600)' }}
            >
              <option value="">— Select application —</option>
              {applications.map(a => (
                <option key={a.id} value={a.id}>{a.company} — {a.position}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Company *</label>
              <input value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="e.g. Stripe" className="premium-input w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Position</label>
              <input value={form.position} onChange={e => set('position', e.target.value)}
                placeholder="e.g. Frontend Engineer" className="premium-input w-full px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="premium-input w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Time *</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                className="premium-input w-full px-3 py-2.5 text-sm" />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map(d => (
                <button key={d} onClick={() => set('duration', d)}
                  className="py-2 rounded-xl text-xs font-medium transition-all text-center"
                  style={{
                    background: form.duration === d ? 'rgba(212,168,39,0.12)' : 'rgba(255,255,255,0.04)',
                    color: form.duration === d ? 'var(--gold-400)' : 'var(--text-400)',
                    border: `1px solid ${form.duration === d ? 'rgba(212,168,39,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Interview Type</label>
            <div className="grid grid-cols-3 gap-2">
              {INTERVIEW_TYPES.map(t => (
                <button key={t.value} onClick={() => set('type', t.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: form.type === t.value ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                    color: form.type === t.value ? '#818cf8' : 'var(--text-400)',
                    border: `1px solid ${form.type === t.value ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(['video', 'phone', 'in_person'] as InterviewFormat[]).map(f => {
                const Icon = FORMAT_ICONS[f];
                const labels = { video: 'Video Call', phone: 'Phone', in_person: 'In Person' };
                return (
                  <button key={f} onClick={() => set('format', f)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: form.format === f ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
                      color: form.format === f ? '#34d399' : 'var(--text-400)',
                      border: `1px solid ${form.format === f ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    <Icon size={12} /> {labels[f]}
                  </button>
                );
              })}
            </div>
          </div>

          {form.format === 'video' && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Meeting Link</label>
              <input type="url" value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)}
                placeholder="https://zoom.us/j/... or Google Meet link"
                className="premium-input w-full px-3 py-2.5 text-sm" />
            </div>
          )}
          {form.format === 'in_person' && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="Office address or building"
                className="premium-input w-full px-3 py-2.5 text-sm" />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Interviewers</label>
            <input value={form.interviewers} onChange={e => set('interviewers', e.target.value)}
              placeholder="e.g. Sarah Chen, Mike Johnson"
              className="premium-input w-full px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Topics to prepare, company research..."
              className="premium-input w-full px-3 py-2.5 text-sm resize-none"
              rows={3} style={{ fontFamily: 'var(--font-body)' }} />
          </div>
        </div>

        <div className="flex items-center justify-between p-5 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-400)' }}>Cancel</button>
          <button onClick={handleSubmit} className="glow-btn flex items-center gap-2 px-6 py-2.5 text-sm">
            <CalendarDays size={14} /> Schedule Interview
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Availability Settings Panel ────────────────────────────────────────
function AvailabilityPanel({
  availability,
  onSave,
}: {
  availability: UserAvailability;
  onSave: (a: UserAvailability) => void;
}) {
  const [draft, setDraft] = useState<UserAvailability>(availability);
  const [saved, setSaved] = useState(false);
  const { addToast } = useToast();

  const toggleDay = (day: number) => {
    setDraft(d => ({
      ...d,
      days: d.days.map(dd => dd.day === day ? { ...dd, enabled: !dd.enabled } : dd),
    }));
  };

  const setDayTime = (day: number, key: 'startTime' | 'endTime', val: string) => {
    setDraft(d => ({
      ...d,
      days: d.days.map(dd => dd.day === day ? { ...dd, [key]: val } : dd),
    }));
  };

  const toggleDuration = (dur: number) => {
    setDraft(d => ({
      ...d,
      durations: d.durations.includes(dur) ? d.durations.filter(x => x !== dur) : [...d.durations, dur],
    }));
  };

  const handleSave = () => {
    onSave(draft);
    setSaved(true);
    addToast({ type: 'success', title: 'Availability saved' });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Your name (shown on booking page)</label>
        <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          placeholder="e.g. Junnel" className="premium-input w-full px-3 py-2.5 text-sm" />
      </div>

      {/* Days */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-400)' }}>Available Days</label>
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {draft.days.map(dd => (
            <button key={dd.day} onClick={() => toggleDay(dd.day)}
              className="py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: dd.enabled ? 'rgba(212,168,39,0.12)' : 'rgba(255,255,255,0.04)',
                color: dd.enabled ? 'var(--gold-400)' : 'var(--text-600)',
                border: `1px solid ${dd.enabled ? 'rgba(212,168,39,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}>
              {DAYS[dd.day].slice(0, 2)}
            </button>
          ))}
        </div>

        {/* Time ranges for enabled days */}
        <div className="space-y-2">
          {draft.days.filter(d => d.enabled).map(dd => (
            <div key={dd.day} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-medium" style={{ color: 'var(--text-300)' }}>{DAYS[dd.day]}</span>
              <input type="time" value={dd.startTime}
                onChange={e => setDayTime(dd.day, 'startTime', e.target.value)}
                className="premium-input px-2 py-1.5 text-xs flex-1" />
              <span style={{ color: 'var(--text-600)' }}>to</span>
              <input type="time" value={dd.endTime}
                onChange={e => setDayTime(dd.day, 'endTime', e.target.value)}
                className="premium-input px-2 py-1.5 text-xs flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Meeting durations */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-400)' }}>Meeting Durations</label>
        <div className="flex gap-2">
          {DURATIONS.map(d => (
            <button key={d} onClick={() => toggleDuration(d)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: draft.durations.includes(d) ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                color: draft.durations.includes(d) ? '#818cf8' : 'var(--text-400)',
                border: `1px solid ${draft.durations.includes(d) ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
              }}>
              {d}m
            </button>
          ))}
        </div>
      </div>

      {/* Buffer */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-400)' }}>Buffer Between Meetings</label>
        <div className="flex gap-2">
          {BUFFERS.map(b => (
            <button key={b} onClick={() => setDraft(d => ({ ...d, bufferMinutes: b }))}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: draft.bufferMinutes === b ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)',
                color: draft.bufferMinutes === b ? '#34d399' : 'var(--text-400)',
                border: `1px solid ${draft.bufferMinutes === b ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}>
              {b === 0 ? 'None' : `${b}m`}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: saved ? 'rgba(52,211,153,0.12)' : 'rgba(212,168,39,0.1)',
          color: saved ? '#34d399' : 'var(--gold-400)',
          border: `1px solid ${saved ? 'rgba(52,211,153,0.25)' : 'rgba(212,168,39,0.25)'}`,
        }}>
        {saved ? <><Check size={14} /> Saved!</> : <><Check size={14} /> Save Availability</>}
      </button>
    </div>
  );
}

// ── Main SchedulerView ─────────────────────────────────────────────────
export default function SchedulerView({
  interviews, availability, applications,
  onAddInterview, onUpdateInterview, onDeleteInterview, onSaveAvailability,
}: Props) {
  const { addToast } = useToast();
  const [tab, setTab] = useState<'interviews' | 'availability'>('interviews');
  const [filter, setFilter] = useState<'upcoming' | 'all' | 'completed'>('upcoming');
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const bookingLink = generateBookingLink(availability);

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink).then(() => {
      setLinkCopied(true);
      addToast({ type: 'success', title: 'Booking link copied!' });
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const filtered = useMemo(() => {
    const now = new Date();
    return interviews
      .filter(i => {
        const dt = new Date(`${i.date}T${i.time}`);
        if (filter === 'upcoming') return i.status === 'upcoming' && dt >= now;
        if (filter === 'completed') return i.status === 'completed' || dt < now;
        return true;
      })
      .sort((a, b) => `${a.date}T${a.time}` < `${b.date}T${b.time}` ? -1 : 1);
  }, [interviews, filter]);

  const nextInterview = useMemo(() => {
    const now = new Date();
    return interviews
      .filter(i => i.status === 'upcoming' && new Date(`${i.date}T${i.time}`) > now)
      .sort((a, b) => `${a.date}T${a.time}` < `${b.date}T${b.time}` ? -1 : 1)[0];
  }, [interviews]);

  const typeInfo = (type: InterviewType) => INTERVIEW_TYPES.find(t => t.value === type)!;

  return (
    <div className="space-y-5">
      {/* Next interview countdown banner */}
      {nextInterview && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 flex items-center gap-5"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(212,168,39,0.05))' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            {typeInfo(nextInterview.type).icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-600)' }}>
              Next Interview
            </p>
            <p className="font-display font-bold text-lg truncate" style={{ color: 'var(--text-100)' }}>
              {nextInterview.company}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-400)' }}>
              {typeInfo(nextInterview.type).label} · {formatDateTime(nextInterview.date, nextInterview.time)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-mono font-bold text-2xl" style={{ color: 'var(--gold-400)' }}>
              {getCountdown(nextInterview.date, nextInterview.time)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-600)' }}>remaining</p>
          </div>
          {nextInterview.meetingLink && (
            <a href={nextInterview.meetingLink} target="_blank" rel="noopener noreferrer"
              className="glow-btn flex items-center gap-2 px-4 py-2 text-sm flex-shrink-0">
              <Video size={13} /> Join
            </a>
          )}
        </motion.div>
      )}

      {/* Tabs + actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
          {(['interviews', 'availability'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: tab === t ? 'var(--text-100)' : 'var(--text-400)',
              }}>
              {t === 'interviews' ? '📅 Interviews' : '⚙️ Availability'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Booking link button */}
          <button onClick={copyLink}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(10,102,194,0.1)', color: '#60a5fa', border: '1px solid rgba(10,102,194,0.2)' }}>
            {linkCopied ? <Check size={12} /> : <Link2 size={12} />}
            {linkCopied ? 'Copied!' : 'Copy booking link'}
          </button>
          <a href={bookingLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-400)', border: '1px solid var(--border-default)' }}>
            <ExternalLink size={12} /> Preview
          </a>
          {tab === 'interviews' && (
            <button onClick={() => setShowAddModal(true)} className="glow-btn flex items-center gap-2 px-4 py-2 text-sm">
              <Plus size={14} /> Schedule
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'interviews' ? (
          <motion.div key="interviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
              {(['upcoming', 'all', 'completed'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                  style={{
                    background: filter === f ? 'rgba(212,168,39,0.12)' : 'rgba(255,255,255,0.04)',
                    color: filter === f ? 'var(--gold-400)' : 'var(--text-400)',
                    border: `1px solid ${filter === f ? 'rgba(212,168,39,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {f}
                </button>
              ))}
              <span className="ml-auto text-xs self-center" style={{ color: 'var(--text-600)' }}>
                {filtered.length} interview{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20 gap-4">
                <div className="text-5xl">📅</div>
                <div className="text-center">
                  <p className="font-semibold" style={{ color: 'var(--text-200)' }}>No interviews {filter === 'upcoming' ? 'scheduled' : 'found'}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-600)' }}>
                    {filter === 'upcoming' ? 'Click "Schedule" to add your first interview' : 'Try a different filter'}
                  </p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="glow-btn flex items-center gap-2 px-5 py-2.5 text-sm">
                  <Plus size={14} /> Schedule Interview
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((iv, i) => {
                  const tInfo = typeInfo(iv.type);
                  const FormatIcon = FORMAT_ICONS[iv.format];
                  const isPast = new Date(`${iv.date}T${iv.time}`) < new Date();
                  return (
                    <motion.div
                      key={iv.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="glass-card p-4 flex items-start gap-4 group"
                      style={{ opacity: iv.status === 'cancelled' ? 0.5 : 1 }}
                    >
                      {/* Type icon */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        {tInfo.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-100)' }}>{iv.company}</p>
                            {iv.position && <p className="text-xs" style={{ color: 'var(--text-400)' }}>{iv.position}</p>}
                          </div>
                          {!isPast && iv.status === 'upcoming' && (
                            <span className="font-mono text-sm font-bold flex-shrink-0" style={{ color: 'var(--gold-400)' }}>
                              {getCountdown(iv.date, iv.time)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-600)' }}>
                          <div className="flex items-center gap-1">
                            <Clock size={11} /> {formatDateTime(iv.date, iv.time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <FormatIcon size={11} /> {iv.format.replace('_', ' ')}
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}>
                            {tInfo.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-400)' }}>
                            {iv.duration}m
                          </span>
                        </div>

                        {iv.interviewers && (
                          <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-500)' }}>
                            <Users size={10} /> {iv.interviewers}
                          </p>
                        )}
                        {iv.notes && (
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-600)' }}>{iv.notes}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {iv.meetingLink && (
                          <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 text-xs font-medium"
                            style={{ color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.06)' }}>
                            <Video size={12} /> Join
                          </a>
                        )}
                        {iv.status === 'upcoming' && !isPast && (
                          <button onClick={() => onUpdateInterview(iv.id, { status: 'completed' })}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                            style={{ color: 'var(--text-600)' }} title="Mark done">
                            <Check size={13} />
                          </button>
                        )}
                        <button onClick={() => onDeleteInterview(iv.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                          style={{ color: 'var(--text-600)' }} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="availability" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid lg:grid-cols-2 gap-5">
              {/* Availability settings */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Settings size={15} style={{ color: 'var(--gold-500)' }} />
                  <h3 className="font-display font-semibold" style={{ color: 'var(--text-100)' }}>Your Availability</h3>
                </div>
                <AvailabilityPanel availability={availability} onSave={onSaveAvailability} />
              </div>

              {/* Booking link preview */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Link2 size={15} style={{ color: '#60a5fa' }} />
                  <h3 className="font-display font-semibold" style={{ color: 'var(--text-100)' }}>Booking Link</h3>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-600)' }}>
                  Share this link with recruiters so they can book time with you directly.
                </p>
                <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                  <Link2 size={12} style={{ color: 'var(--text-600)', flexShrink: 0 }} />
                  <span className="text-xs font-mono truncate flex-1" style={{ color: 'var(--text-300)' }}>
                    {bookingLink}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyLink}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: linkCopied ? 'rgba(52,211,153,0.1)' : 'rgba(10,102,194,0.1)',
                      color: linkCopied ? '#34d399' : '#60a5fa',
                      border: `1px solid ${linkCopied ? 'rgba(52,211,153,0.25)' : 'rgba(10,102,194,0.25)'}`,
                    }}>
                    {linkCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
                  </button>
                  <a href={bookingLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-300)', border: '1px solid var(--border-default)' }}>
                    <ExternalLink size={13} /> Preview
                  </a>
                </div>

                <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(212,168,39,0.05)', border: '1px solid rgba(212,168,39,0.12)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--gold-400)' }}>💡 How it works</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-500)' }}>
                    Recruiter opens your link → sees your available slots → picks a time → gets a Google Calendar invite to confirm.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Interview Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddInterviewModal
            applications={applications}
            onAdd={onAddInterview}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
