'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Briefcase, MapPin, DollarSign, Link, Calendar, User,
  FileText, Check, ChevronDown, Sparkles, Loader2, AlertTriangle,
  ExternalLink, RefreshCw
} from 'lucide-react';
import { JobApplication, ApplicationStatus, PriorityTier } from '@/types';
import { STATUS_CONFIG, PRIORITY_CONFIG, KANBAN_COLUMNS } from '@/lib/utils';
import type { LinkedInData } from '@/app/api/linkedin/route';

interface Props {
  onClose: () => void;
  onAdd: (app: Omit<JobApplication, 'id' | 'timeline'>) => void;
}

const PRIORITIES: PriorityTier[] = ['dream', 'high', 'medium', 'low'];

type AutoFillState = 'idle' | 'loading' | 'success' | 'partial' | 'error';
type UrlType = 'job' | 'profile' | 'company' | 'unknown';

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  icon?: React.ElementType;
  required?: boolean;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  filled?: boolean;
}

function InputField({ label, name, type = 'text', placeholder, icon: Icon, required, value, onChange, error, filled }: InputFieldProps) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>
        {label}
        {required && <span style={{ color: '#f87171' }}>*</span>}
        <AnimatePresence>
          {filled && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7, x: -4 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              <Sparkles size={9} /> auto-filled
            </motion.span>
          )}
        </AnimatePresence>
      </label>
      <motion.div
        animate={filled ? {
          boxShadow: ['0 0 0 0 rgba(212,168,39,0)', '0 0 0 4px rgba(212,168,39,0.15)', '0 0 0 0 rgba(212,168,39,0)'],
        } : {}}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        {Icon && (
          <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: filled ? 'var(--gold-500)' : 'var(--text-600)' }} />
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          placeholder={placeholder}
          className="premium-input w-full py-2.5 text-sm"
          style={{
            paddingLeft: Icon ? 32 : 12,
            paddingRight: 12,
            borderColor: filled ? 'rgba(212,168,39,0.35)' : undefined,
            background: filled ? 'rgba(212,168,39,0.04)' : undefined,
            transition: 'border-color 0.3s, background 0.3s',
          }}
        />
      </motion.div>
      {error && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}

export default function QuickAddModal({ onClose, onAdd }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    company: '',
    position: '',
    salary: '',
    location: '',
    jobLink: '',
    dateApplied: new Date().toISOString().split('T')[0],
    status: 'applied' as ApplicationStatus,
    priority: 'medium' as PriorityTier,
    recruiterName: '',
    contactLink: '',
    followUpDate: '',
    notes: '',
    tags: '',
    remote: false,
    industry: '',
  });
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // LinkedIn auto-fill state
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [autoFillState, setAutoFillState] = useState<AutoFillState>('idle');
  const [autoFillMessage, setAutoFillMessage] = useState('');
  const [autoFillCount, setAutoFillCount] = useState(0);
  const [urlType, setUrlType] = useState<UrlType>('unknown');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedUrl = useRef('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (k: string, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  // ── LinkedIn auto-fill ──────────────────────────────────────────
  const triggerAutoFill = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed || trimmed === lastFetchedUrl.current) return;
    if (!trimmed.includes('linkedin') && !trimmed.startsWith('http')) return;

    lastFetchedUrl.current = trimmed;
    setAutoFillState('loading');
    setAutoFillMessage('');
    setMissingFields([]);

    try {
      const res = await fetch('/api/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) throw new Error('API error');
      const data: LinkedInData = await res.json();

      setUrlType(data._urlType ?? 'unknown');

      const fieldMap: Record<string, keyof typeof form> = {
        recruiterName: 'recruiterName',
        company: 'company',
        position: 'position',
        location: 'location',
        salary: 'salary',
        industry: 'industry',
        jobLink: 'jobLink',
        contactLink: 'contactLink',
      };

      const filled = new Set<string>();
      const updates: Partial<typeof form> = {};

      for (const [dataKey, formKey] of Object.entries(fieldMap)) {
        const val = (data as Record<string, unknown>)[dataKey];
        if (val && typeof val === 'string' && val.length > 0) {
          updates[formKey as keyof typeof form] = val as never;
          filled.add(formKey);
        }
      }
      if (data.remote !== undefined) {
        updates.remote = data.remote;
        filled.add('remote');
      }

      setForm(f => ({ ...f, ...updates }));
      setAutoFilled(filled);

      // Compute what still needs manual input
      const KEY_FIELDS = ['company', 'position', 'location'];
      const missing = KEY_FIELDS.filter(f => !filled.has(f));
      setMissingFields(missing);

      if (data._partial) {
        setAutoFillState('partial');
        setAutoFillMessage(data._message ?? 'Partial data — fill remaining fields manually.');
        setAutoFillCount(filled.size);
      } else if (filled.size > 0) {
        setAutoFillState('success');
        setAutoFillMessage(`${filled.size} field${filled.size !== 1 ? 's' : ''} auto-filled`);
        setAutoFillCount(filled.size);
      } else {
        setAutoFillState('error');
        setAutoFillMessage(data._message ?? 'No data found. Fill in manually.');
      }
    } catch {
      setAutoFillState('error');
      setAutoFillMessage('Could not reach LinkedIn. Fill in manually.');
    }
  }, []);

  const handleLinkedinUrlChange = (val: string) => {
    setLinkedinUrl(val);
    setAutoFillState('idle');
    lastFetchedUrl.current = '';
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.includes('linkedin.com')) {
      debounceRef.current = setTimeout(() => triggerAutoFill(val), 600);
    }
  };

  const handleLinkedinPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    setLinkedinUrl(pasted);
    if (pasted.includes('linkedin')) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setTimeout(() => triggerAutoFill(pasted), 100);
    }
  };

  const validate1 = () => {
    const errs: Record<string, string> = {};
    if (!form.company.trim()) errs.company = 'Required';
    if (!form.position.trim()) errs.position = 'Required';
    return errs;
  };

  const handleNext = () => {
    const errs = validate1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(2);
  };

  const handleSubmit = () => {
    onAdd({
      company: form.company.trim(),
      position: form.position.trim(),
      salary: form.salary.trim() || undefined,
      location: form.location.trim(),
      jobLink: form.jobLink.trim() || undefined,
      dateApplied: form.dateApplied,
      status: form.status,
      priority: form.priority,
      recruiterName: form.recruiterName.trim() || undefined,
      contactLink: form.contactLink.trim() || undefined,
      followUpDate: form.followUpDate || undefined,
      notes: form.notes.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      remote: form.remote,
      industry: form.industry.trim() || undefined,
    });
    onClose();
  };

  const isAutoFilled = (field: string) => autoFilled.has(field);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="modal-card"
        style={{ maxWidth: 620 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-100)' }}>
              New Application
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-600)' }}>
              Step {step} of 2 — {step === 1 ? 'Core info' : 'Details & tracking'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-400)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 pt-4 flex gap-2">
          {[1, 2].map(s => (
            <div key={s} className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{ background: step >= s ? 'linear-gradient(90deg, #d4a827, #f0c84a)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-5 space-y-4"
              >
                {/* ── LinkedIn Auto-fill Section ── */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(10,102,194,0.07) 0%, rgba(99,102,241,0.05) 100%)',
                    border: '1px solid rgba(10,102,194,0.18)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2.5 px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(10,102,194,0.12)' }}>
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ background: '#0a66c2', color: 'white', fontFamily: 'var(--font-display)', fontSize: 11 }}
                    >
                      in
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-200)' }}>
                      Auto-fill from LinkedIn
                    </span>

                    {/* URL type badge */}
                    <AnimatePresence>
                      {urlType !== 'unknown' && autoFillState !== 'idle' && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: urlType === 'job' ? 'rgba(52,211,153,0.1)' : urlType === 'profile' ? 'rgba(167,139,250,0.1)' : 'rgba(99,102,241,0.1)',
                            color: urlType === 'job' ? '#34d399' : urlType === 'profile' ? '#a78bfa' : '#818cf8',
                            border: `1px solid ${urlType === 'job' ? 'rgba(52,211,153,0.2)' : urlType === 'profile' ? 'rgba(167,139,250,0.2)' : 'rgba(99,102,241,0.2)'}`,
                          }}
                        >
                          {urlType === 'job' ? '📋 Job listing' : urlType === 'profile' ? '👤 Profile' : urlType === 'company' ? '🏢 Company' : ''}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: 'rgba(10,102,194,0.12)', color: '#60a5fa', border: '1px solid rgba(10,102,194,0.2)' }}
                    >
                      Paste & go
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* URL input */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                        {autoFillState === 'loading'
                          ? <Loader2 size={13} className="animate-spin" style={{ color: '#0a66c2' }} />
                          : <Link size={13} style={{ color: 'var(--text-600)' }} />}
                      </div>
                      <input
                        value={linkedinUrl}
                        onChange={e => handleLinkedinUrlChange(e.target.value)}
                        onPaste={handleLinkedinPaste}
                        placeholder="Paste LinkedIn job posting or profile URL…"
                        className="premium-input w-full pl-8 pr-20 py-2.5 text-sm"
                        style={{
                          borderColor: autoFillState === 'success' ? 'rgba(52,211,153,0.4)'
                            : autoFillState === 'loading' ? 'rgba(10,102,194,0.4)'
                              : autoFillState === 'partial' ? 'rgba(251,191,36,0.3)'
                                : autoFillState === 'error' ? 'rgba(248,113,113,0.3)'
                                  : undefined,
                        }}
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <AnimatePresence mode="wait">
                          {autoFillState === 'success' && (
                            <motion.div key="ok" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
                              <Check size={10} style={{ color: '#34d399' }} />
                              <span className="text-xs font-bold font-mono" style={{ color: '#34d399' }}>{autoFillCount}</span>
                            </motion.div>
                          )}
                          {(autoFillState === 'partial' || autoFillState === 'error') && (
                            <motion.button key="retry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              onClick={() => { lastFetchedUrl.current = ''; triggerAutoFill(linkedinUrl); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors hover:bg-white/5"
                              style={{ color: 'var(--text-400)' }} title="Retry">
                              <RefreshCw size={11} /> Retry
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Status area */}
                    <AnimatePresence mode="wait">
                      {autoFillState === 'idle' && (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="flex gap-4 text-xs" style={{ color: 'var(--text-600)' }}>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
                              <span>Job listing URL — best results</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa' }} />
                              <span>Profile URL — partial</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {autoFillState === 'loading' && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2 text-xs" style={{ color: '#60a5fa' }}>
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#0a66c2' }}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />
                            ))}
                          </div>
                          Fetching LinkedIn data…
                        </motion.div>
                      )}

                      {autoFillState === 'success' && (
                        <motion.div key="success" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399' }}>
                          <Check size={12} style={{ flexShrink: 0 }} />
                          <span className="font-medium">{autoFillMessage}</span>
                          {missingFields.length > 0 && (
                            <span className="ml-auto opacity-70">
                              Still need: {missingFields.join(', ')}
                            </span>
                          )}
                        </motion.div>
                      )}

                      {autoFillState === 'partial' && (
                        <motion.div key="partial" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="rounded-lg overflow-hidden text-xs"
                          style={{ border: '1px solid rgba(251,191,36,0.2)' }}>

                          {/* What was filled */}
                          {autoFillCount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2"
                              style={{ background: 'rgba(52,211,153,0.06)', borderBottom: '1px solid rgba(251,191,36,0.12)' }}>
                              <Sparkles size={11} style={{ color: '#34d399', flexShrink: 0 }} />
                              <span style={{ color: '#34d399' }}>
                                {autoFillCount} field{autoFillCount !== 1 ? 's' : ''} auto-filled
                              </span>
                            </div>
                          )}

                          {/* Context-aware guidance */}
                          <div className="px-3 py-2.5" style={{ background: 'rgba(251,191,36,0.05)' }}>
                            {urlType === 'profile' ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 font-medium" style={{ color: '#fbbf24' }}>
                                  <AlertTriangle size={11} style={{ flexShrink: 0 }} />
                                  LinkedIn profiles require login to scrape
                                </div>
                                <p style={{ color: 'var(--text-400)', lineHeight: 1.5 }}>
                                  {autoFillCount > 0
                                    ? 'Name extracted from URL. Please fill in '
                                    : 'Please fill in '}
                                  <strong style={{ color: 'var(--text-200)' }}>Company</strong> and <strong style={{ color: 'var(--text-200)' }}>Position</strong> manually.
                                </p>
                                <p style={{ color: 'var(--text-600)', lineHeight: 1.5 }}>
                                  💡 Tip: Paste the <strong style={{ color: 'var(--text-400)' }}>job listing URL</strong> instead for full auto-fill.
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-start gap-1.5" style={{ color: 'var(--text-400)' }}>
                                <AlertTriangle size={11} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
                                <span style={{ lineHeight: 1.5 }}>
                                  {autoFillMessage}
                                  {missingFields.length > 0 && (
                                    <> Fill in: <strong style={{ color: 'var(--text-200)' }}>{missingFields.join(', ')}</strong></>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {autoFillState === 'error' && (
                        <motion.div key="error" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs"
                          style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: 'var(--text-400)' }}>
                          <AlertTriangle size={11} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <p style={{ color: '#f87171', fontWeight: 500, marginBottom: 2 }}>Could not fetch data</p>
                            <p>{autoFillMessage}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── Divider ── */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-600)' }}>or fill manually</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                </div>

                {/* ── Form Fields ── */}
                <InputField label="Company" name="company" icon={Briefcase} placeholder="e.g. Stripe" required
                  value={form.company} onChange={set} error={errors.company} filled={isAutoFilled('company')} />
                <InputField label="Position" name="position" placeholder="e.g. Senior Frontend Engineer" required
                  value={form.position} onChange={set} error={errors.position} filled={isAutoFilled('position')} />
                <InputField label="Location" name="location" icon={MapPin} placeholder="e.g. San Francisco, CA"
                  value={form.location} onChange={set} filled={isAutoFilled('location')} />
                <InputField label="Salary Range" name="salary" icon={DollarSign} placeholder="e.g. $150,000 – $180,000"
                  value={form.salary} onChange={set} filled={isAutoFilled('salary')} />
                <InputField label="Job Posting URL" name="jobLink" icon={Link} type="url" placeholder="https://..."
                  value={form.jobLink} onChange={set} filled={isAutoFilled('jobLink')} />

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>
                    Industry
                    {isAutoFilled('industry') && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs"
                        style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                        <Sparkles size={9} /> auto-filled
                      </motion.span>
                    )}
                  </label>
                  <input
                    value={form.industry}
                    onChange={e => set('industry', e.target.value)}
                    placeholder="e.g. FinTech, Developer Tools"
                    className="premium-input w-full px-3 py-2.5 text-sm"
                    style={{
                      borderColor: isAutoFilled('industry') ? 'rgba(212,168,39,0.35)' : undefined,
                      background: isAutoFilled('industry') ? 'rgba(212,168,39,0.04)' : undefined,
                    }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => set('remote', !form.remote)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: form.remote ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.04)',
                      color: form.remote ? '#60a5fa' : 'var(--text-400)',
                      border: `1px solid ${form.remote ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center"
                      style={{
                        background: form.remote ? 'rgba(96,165,250,0.3)' : 'transparent',
                        border: `1px solid ${form.remote ? '#60a5fa' : 'rgba(255,255,255,0.15)'}`,
                      }}
                    >
                      {form.remote && <Check size={10} style={{ color: '#60a5fa' }} />}
                    </div>
                    Remote position
                  </button>
                  {isAutoFilled('remote') && (
                    <span className="text-xs flex items-center gap-1" style={{ color: '#34d399' }}>
                      <Sparkles size={9} /> auto-detected
                    </span>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-5 space-y-4"
              >
                {/* Status */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Status</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusMenu(s => !s)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left"
                      style={{
                        background: STATUS_CONFIG[form.status].bg,
                        border: `1px solid ${STATUS_CONFIG[form.status].border}`,
                        color: STATUS_CONFIG[form.status].color,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: STATUS_CONFIG[form.status].color }} />
                        {STATUS_CONFIG[form.status].label}
                      </div>
                      <ChevronDown size={14} />
                    </button>
                    <AnimatePresence>
                      {showStatusMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden w-full"
                          style={{ background: 'rgba(8,11,22,0.98)', border: '1px solid var(--border-strong)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
                        >
                          {KANBAN_COLUMNS.map(s => {
                            const cfg = STATUS_CONFIG[s];
                            return (
                              <button key={s}
                                onClick={() => { set('status', s); setShowStatusMenu(false); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                                style={{ color: 'var(--text-400)' }}
                              >
                                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                                {cfg.label}
                                {form.status === s && <Check size={12} className="ml-auto" style={{ color: cfg.color }} />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>Priority Tier</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRIORITIES.map(p => {
                      const cfg = PRIORITY_CONFIG[p];
                      const isActive = form.priority === p;
                      return (
                        <button key={p} onClick={() => set('priority', p)}
                          className="py-2 rounded-xl text-xs font-medium transition-all text-center"
                          style={{
                            background: isActive ? cfg.bg : 'rgba(255,255,255,0.04)',
                            color: isActive ? cfg.color : 'var(--text-400)',
                            border: `1px solid ${isActive ? `${cfg.color}40` : 'rgba(255,255,255,0.06)'}`,
                          }}
                        >
                          {cfg.icon} {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <InputField label="Date Applied" name="dateApplied" type="date" icon={Calendar}
                  value={form.dateApplied} onChange={set} />

                {/* Recruiter fields with auto-fill indicators */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>
                      Recruiter Name
                      {isAutoFilled('recruiterName') && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs"
                          style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                          <Sparkles size={9} />
                        </motion.span>
                      )}
                    </label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: isAutoFilled('recruiterName') ? 'var(--gold-500)' : 'var(--text-600)' }} />
                      <input
                        value={form.recruiterName}
                        onChange={e => set('recruiterName', e.target.value)}
                        placeholder="Name"
                        className="premium-input w-full pl-8 pr-3 py-2.5 text-sm"
                        style={{
                          borderColor: isAutoFilled('recruiterName') ? 'rgba(212,168,39,0.35)' : undefined,
                          background: isAutoFilled('recruiterName') ? 'rgba(212,168,39,0.04)' : undefined,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>
                      Contact Link
                      {isAutoFilled('contactLink') && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs"
                          style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                          <Sparkles size={9} />
                        </motion.span>
                      )}
                    </label>
                    <div className="relative">
                      <ExternalLink size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: isAutoFilled('contactLink') ? 'var(--gold-500)' : 'var(--text-600)' }} />
                      <input
                        type="url"
                        value={form.contactLink}
                        onChange={e => set('contactLink', e.target.value)}
                        placeholder="LinkedIn URL"
                        className="premium-input w-full pl-8 pr-3 py-2.5 text-sm"
                        style={{
                          borderColor: isAutoFilled('contactLink') ? 'rgba(212,168,39,0.35)' : undefined,
                          background: isAutoFilled('contactLink') ? 'rgba(212,168,39,0.04)' : undefined,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <InputField label="Follow-up Date" name="followUpDate" type="date" icon={Calendar}
                  value={form.followUpDate} onChange={set} />

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-400)' }}>
                    Tags <span style={{ color: 'var(--text-600)', fontWeight: 400 }}>(comma-separated)</span>
                  </label>
                  <input value={form.tags} onChange={e => set('tags', e.target.value)}
                    placeholder="react, typescript, remote, fintech"
                    className="premium-input w-full px-3 py-2.5 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-400)' }}>
                    <FileText size={11} /> Notes
                  </label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="Add any notes, impressions, or next steps..."
                    className="premium-input w-full px-3 py-2.5 text-sm resize-none leading-relaxed"
                    rows={3} style={{ fontFamily: 'var(--font-body)' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 pt-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-400)' }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button
            onClick={step === 1 ? handleNext : handleSubmit}
            className="glow-btn flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            {step === 1 ? <>Next →</> : <><Check size={15} /> Add Application</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
