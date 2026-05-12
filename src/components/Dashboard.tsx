'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  Briefcase, MessageSquare, Trophy, Ghost, TrendingUp, Calendar,
  Flame, Target, ArrowUpRight, Clock, Star, ChevronRight
} from 'lucide-react';
import { JobApplication, Interview } from '@/types';
import { StatusBadge } from './StatusBadge';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { STATUS_CONFIG, formatRelativeDate, KANBAN_COLUMNS } from '@/lib/utils';
import { weeklyActivityData } from '@/data/mockData';

interface DashboardProps {
  applications: JobApplication[];
  interviews?: Interview[];
  onSelectApp: (app: JobApplication) => void;
  onAddApp: () => void;
  onGoToScheduler?: () => void;
}

function StatCard({
  label, value, icon: Icon, color, bg, delay, subtitle
}: {
  label: string; value: number; icon: React.ElementType;
  color: string; bg: string; delay: number; subtitle?: string;
}) {
  const count = useAnimatedCounter(value, 1600, delay);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="glass-card glass-card-hover p-5 cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: bg, border: `1px solid ${color}25` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <ArrowUpRight size={14} style={{ color: 'var(--text-600)' }} />
      </div>
      <p className="font-mono font-bold text-3xl mb-1" style={{ color }}>
        {count}
      </p>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-200)' }}>{label}</p>
      {subtitle && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-600)' }}>{subtitle}</p>
      )}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(8,11,22,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
      }}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-400)' }}>{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            <span style={{ color: 'var(--text-400)', textTransform: 'capitalize' }}>{p.name}:</span>
            <span className="font-bold font-mono" style={{ color: p.color }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard({ applications, interviews = [], onSelectApp, onAddApp, onGoToScheduler }: DashboardProps) {
  const stats = useMemo(() => {
    const total = applications.length;
    const interviews = applications.filter(a => ['interview', 'final_interview'].includes(a.status)).length;
    const offers = applications.filter(a => a.status === 'offer').length;
    const rejections = applications.filter(a => a.status === 'rejected').length;
    const responses = applications.filter(a => !['applied', 'ghosted'].includes(a.status)).length;
    const responseRate = total > 0 ? Math.round((responses / total) * 100) : 0;
    return { total, interviews, offers, rejections, responseRate };
  }, [applications]);

  const recentApps = useMemo(() =>
    [...applications]
      .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())
      .slice(0, 5),
    [applications]
  );

  const upcomingFollowUps = useMemo(() =>
    applications
      .filter(a => a.followUpDate && new Date(a.followUpDate) >= new Date())
      .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime())
      .slice(0, 3),
    [applications]
  );

  const pipelineBreakdown = useMemo(() =>
    KANBAN_COLUMNS.map(s => ({
      status: s,
      count: applications.filter(a => a.status === s).length,
      ...STATUS_CONFIG[s],
    })).filter(s => s.count > 0),
    [applications]
  );

  const nextInterview = useMemo(() => {
    const now = new Date();
    return interviews
      .filter(iv => iv.status === 'upcoming' && new Date(`${iv.date}T${iv.time}`) > now)
      .sort((a, b) => `${a.date}T${a.time}` < `${b.date}T${b.time}` ? -1 : 1)[0] ?? null;
  }, [interviews]);

  const getCountdown = (date: string, time: string) => {
    const diff = new Date(`${date}T${time}`).getTime() - Date.now();
    if (diff < 0) return 'Now';
    const days = Math.floor(diff / 86400000);
    const hrs = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hrs}h`;
    return `${hrs}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const streak = 7;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const motivationalMessages = [
    'Every application is a step closer. Keep pushing.',
    'The right opportunity is out there. Stay consistent.',
    'Rejection is redirection. You\'re building momentum.',
    'Top performers track everything. You\'re on the right path.',
  ];
  const motivationMsg = motivationalMessages[new Date().getDay() % motivationalMessages.length];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(212,168,39,0.08) 0%, rgba(99,102,241,0.06) 100%)',
          border: '1px solid rgba(212,168,39,0.15)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 80% 50%, rgba(212,168,39,0.15) 0%, transparent 60%)',
          }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--gold-500)' }}>
              {greeting}, Junnel 👋
            </p>
            <h2 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-100)' }}>
              {stats.total === 0 ? 'Start your journey' : `${stats.total} Applications Tracked`}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-400)' }}>{motivationMsg}</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Flame size={16} style={{ color: '#f97316' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-400)' }}>Streak</p>
                <p className="font-bold font-mono text-sm" style={{ color: '#f97316' }}>{streak} days</p>
              </div>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Target size={16} style={{ color: 'var(--indigo-400)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-400)' }}>Goal</p>
                <p className="font-bold font-mono text-sm" style={{ color: 'var(--indigo-400)' }}>
                  {stats.total}/20
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <div className="relative mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs" style={{ color: 'var(--text-400)' }}>Monthly goal progress</span>
              <span className="text-xs font-semibold font-mono" style={{ color: 'var(--gold-400)' }}>
                {Math.min(Math.round((stats.total / 20) * 100), 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #d4a827, #f0c84a, #818cf8)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.total / 20) * 100, 100)}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Applied"
          value={stats.total}
          icon={Briefcase}
          color="#818cf8"
          bg="rgba(99,102,241,0.1)"
          delay={0.05}
          subtitle="Across all stages"
        />
        <StatCard
          label="Interviews"
          value={stats.interviews}
          icon={MessageSquare}
          color="#a78bfa"
          bg="rgba(167,139,250,0.1)"
          delay={0.1}
          subtitle={`${stats.total > 0 ? Math.round((stats.interviews / stats.total) * 100) : 0}% conversion`}
        />
        <StatCard
          label="Offers"
          value={stats.offers}
          icon={Trophy}
          color="#34d399"
          bg="rgba(52,211,153,0.1)"
          delay={0.15}
          subtitle={stats.offers > 0 ? 'Congratulations!' : 'Keep going!'}
        />
        <StatCard
          label="Response Rate"
          value={stats.responseRate}
          icon={TrendingUp}
          color="#d4a827"
          bg="rgba(212,168,39,0.1)"
          delay={0.2}
          subtitle="vs. 15% avg."
        />
      </div>

      {/* Next Interview Countdown */}
      {nextInterview && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22 }}
          className="glass-card p-5 flex items-center gap-5 cursor-pointer group"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.07), rgba(212,168,39,0.04))', border: '1px solid rgba(99,102,241,0.15)' }}
          onClick={onGoToScheduler}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
            📅
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--indigo-400)' }}>
              Next Interview
            </p>
            <p className="font-display font-bold text-base truncate" style={{ color: 'var(--text-100)' }}>
              {nextInterview.company}
              {nextInterview.position && <span className="font-normal text-sm ml-2" style={{ color: 'var(--text-400)' }}>· {nextInterview.position}</span>}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-500)' }}>
              {new Date(`${nextInterview.date}T${nextInterview.time}`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              {' · '}
              {new Date(`${nextInterview.date}T${nextInterview.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-mono font-bold text-2xl" style={{ color: 'var(--gold-400)' }}>
              {getCountdown(nextInterview.date, nextInterview.time)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-600)' }}>remaining</p>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-600)', flexShrink: 0 }}
            className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      )}

      {/* Chart + Pipeline Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="lg:col-span-2 glass-card p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-100)' }}>
                Weekly Activity
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-600)' }}>Applications, interviews & responses</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#818cf8' }} />
                <span style={{ color: 'var(--text-400)' }}>Applied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#d4a827' }} />
                <span style={{ color: 'var(--text-400)' }}>Responses</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyActivityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradResp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4a827" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#d4a827" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-600)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-600)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="applications"
                name="applications"
                stroke="#818cf8"
                strokeWidth={2}
                fill="url(#gradApps)"
                dot={false}
                activeDot={{ r: 4, fill: '#818cf8', stroke: '#1a1e3a', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="responses"
                name="responses"
                stroke="#d4a827"
                strokeWidth={2}
                fill="url(#gradResp)"
                dot={false}
                activeDot={{ r: 4, fill: '#d4a827', stroke: '#1a1e2a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pipeline Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card p-5"
        >
          <h3 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--text-100)' }}>
            Pipeline
          </h3>
          {pipelineBreakdown.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Target size={32} style={{ color: 'var(--text-600)' }} />
              <p className="text-sm text-center" style={{ color: 'var(--text-600)' }}>
                No applications yet.<br />Add your first one!
              </p>
              <button onClick={onAddApp} className="glow-btn px-4 py-2 text-xs">
                + Add Application
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pipelineBreakdown.map(item => (
                <div key={item.status} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                  <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-400)' }}>{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ width: 60, background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.count / applications.length) * 100}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold font-mono w-4 text-right" style={{ color: item.color }}>
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent + Follow-ups Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="glass-card overflow-hidden"
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-100)' }}>
              Recent Applications
            </h3>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-600)' }}>
              {recentApps.length} entries
            </span>
          </div>
          {recentApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Briefcase size={28} style={{ color: 'var(--text-600)' }} />
              <p className="text-sm" style={{ color: 'var(--text-600)' }}>No applications yet</p>
            </div>
          ) : (
            <div>
              {recentApps.map((app, i) => (
                <motion.button
                  key={app.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  onClick={() => onSelectApp(app)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: i < recentApps.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    {app.company[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-100)' }}>{app.company}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-400)' }}>{app.position}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StatusBadge status={app.status} size="sm" />
                    <span className="text-xs" style={{ color: 'var(--text-600)' }}>
                      {formatRelativeDate(app.dateApplied)}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Follow-ups & Upcoming */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass-card overflow-hidden"
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-100)' }}>
              Upcoming Follow-ups
            </h3>
            <Calendar size={15} style={{ color: 'var(--text-600)' }} />
          </div>
          {upcomingFollowUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Clock size={28} style={{ color: 'var(--text-600)' }} />
              <p className="text-sm" style={{ color: 'var(--text-600)' }}>No upcoming follow-ups</p>
            </div>
          ) : (
            <div>
              {upcomingFollowUps.map((app, i) => {
                const daysUntil = Math.ceil(
                  (new Date(app.followUpDate! + 'T00:00:00').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <motion.button
                    key={app.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    onClick={() => onSelectApp(app)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: i < upcomingFollowUps.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 font-mono"
                      style={{
                        background: daysUntil <= 2 ? 'rgba(248,113,113,0.1)' : 'rgba(212,168,39,0.1)',
                        color: daysUntil <= 2 ? '#f87171' : 'var(--gold-400)',
                        border: `1px solid ${daysUntil <= 2 ? 'rgba(248,113,113,0.2)' : 'rgba(212,168,39,0.2)'}`,
                      }}
                    >
                      {daysUntil}d
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-100)' }}>{app.company}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-400)' }}>{app.position}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-600)', flexShrink: 0 }} />
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Motivation widget */}
          <div
            className="mx-4 mb-4 mt-2 p-3 rounded-xl"
            style={{ background: 'rgba(212,168,39,0.06)', border: '1px solid rgba(212,168,39,0.12)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Star size={13} style={{ color: 'var(--gold-500)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--gold-500)' }}>Daily Insight</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-400)' }}>
              {stats.responseRate > 20
                ? `Your ${stats.responseRate}% response rate is above average. Top candidates average 15-20%.`
                : `Focus on quality over quantity. Personalized applications typically get 3× more responses.`}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Application Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-100)' }}>
              Activity Heatmap
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-600)' }}>Last 12 weeks of application activity</p>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-600)' }}>
            <span>Less</span>
            {[0.1, 0.3, 0.5, 0.75, 1].map(op => (
              <div key={op} className="w-3 h-3 rounded-sm" style={{ background: `rgba(212,168,39,${op})` }} />
            ))}
            <span>More</span>
          </div>
        </div>
        <HeatmapGrid />
      </motion.div>
    </div>
  );
}

function HeatmapGrid() {
  const cells = useMemo(() => {
    return Array.from({ length: 84 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (83 - i));
      const dayOfWeek = date.getDay();
      const count = Math.random() > 0.55 ? Math.floor(Math.random() * 5) + 1 : 0;
      return {
        date: date.toISOString().split('T')[0],
        count,
        dayOfWeek,
      };
    });
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 14px)', gridAutoFlow: 'column', gap: 3 }}>
      {cells.map((cell, i) => (
        <div
          key={i}
          title={`${cell.date}: ${cell.count} application${cell.count !== 1 ? 's' : ''}`}
          className="rounded-sm transition-all duration-150 hover:scale-125 cursor-pointer"
          style={{
            width: 14,
            height: 14,
            background: cell.count === 0
              ? 'rgba(255,255,255,0.04)'
              : `rgba(212,168,39,${Math.min(cell.count * 0.2, 1)})`,
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        />
      ))}
    </div>
  );
}
