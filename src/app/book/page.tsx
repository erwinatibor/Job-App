'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Check, CalendarDays, Zap } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n: number) { return String(n).padStart(2, '0'); }

function generateSlots(startTime: string, endTime: string, duration: number, buffer: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur + duration <= end) {
    slots.push(`${pad(Math.floor(cur / 60))}:${pad(cur % 60)}`);
    cur += duration + buffer;
  }
  return slots;
}

function googleCalLink(name: string, date: string, time: string, duration: number): string {
  const start = new Date(`${date}T${time}`);
  const end = new Date(start.getTime() + duration * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Interview with ${name}`)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(`Scheduled via ${name}'s booking page`)}`;
}

function BookingContent() {
  const params = useSearchParams();
  const name = params.get('name') || 'Recruiter';
  const tz = params.get('tz') || 'UTC';
  const enabledDays = (params.get('days') || '1,2,3,4,5').split(',').map(Number);
  const startTime = params.get('start') || '09:00';
  const endTime = params.get('end') || '17:00';
  const durations = (params.get('dur') || '30,60').split(',').map(Number);
  const buffer = parseInt(params.get('buf') || '0', 10);

  const [selectedDuration, setSelectedDuration] = useState(durations[0]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const calDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cells: { date: Date | null; available: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, available: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({
        date,
        available: date >= today && enabledDays.includes(date.getDay()),
      });
    }
    return cells;
  }, [currentMonth, enabledDays]);

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    return generateSlots(startTime, endTime, selectedDuration, buffer);
  }, [selectedDate, selectedDuration, startTime, endTime, buffer]);

  const fmtDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${pad(m)} ${ampm}`;
  };

  const handleBook = () => {
    if (!selectedDate || !selectedSlot) return;
    const gcal = googleCalLink(name, selectedDate, selectedSlot, selectedDuration);
    window.open(gcal, '_blank');
    setBooked(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-950)', fontFamily: 'var(--font-body)' }}>
      <div className="w-full max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #d4a827, #f0c84a)' }}>
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: 'var(--text-100)' }}>Apex</span>
          </div>
          <h1 className="font-display font-bold text-3xl mb-1" style={{ color: 'var(--text-100)' }}>
            Schedule time with {name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-500)' }}>
            Pick a date and time that works for you
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {booked ? (
            <motion.div key="booked" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <Check size={28} style={{ color: '#34d399' }} />
              </div>
              <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-100)' }}>You're confirmed!</h2>
              <p className="text-sm" style={{ color: 'var(--text-400)' }}>
                {fmtDate(selectedDate!)} at {fmtTime(selectedSlot!)} · {selectedDuration} min
              </p>
              <p className="text-xs" style={{ color: 'var(--text-600)' }}>
                A Google Calendar event was opened for you to save the invite.
              </p>
              <button onClick={() => { setBooked(false); setSelectedDate(null); setSelectedSlot(null); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-400)', border: '1px solid var(--border-default)' }}>
                Book another time
              </button>
            </motion.div>
          ) : (
            <motion.div key="picker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x"
                style={{ borderColor: 'var(--border-subtle)' }}>
                {/* Left: duration + calendar */}
                <div className="p-6">
                  {/* Duration selector */}
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-600)' }}>
                    Duration
                  </p>
                  <div className="flex gap-2 mb-5">
                    {durations.map(d => (
                      <button key={d} onClick={() => { setSelectedDuration(d); setSelectedSlot(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: selectedDuration === d ? 'rgba(212,168,39,0.12)' : 'rgba(255,255,255,0.04)',
                          color: selectedDuration === d ? 'var(--gold-400)' : 'var(--text-400)',
                          border: `1px solid ${selectedDuration === d ? 'rgba(212,168,39,0.25)' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                        <Clock size={10} /> {d}m
                      </button>
                    ))}
                  </div>

                  {/* Month navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentMonth(m => {
                      const d = new Date(m.year, m.month - 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ color: 'var(--text-400)' }}>
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-100)' }}>
                      {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
                    </span>
                    <button onClick={() => setCurrentMonth(m => {
                      const d = new Date(m.year, m.month + 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ color: 'var(--text-400)' }}>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <div key={d} className="text-center text-xs font-semibold py-1"
                        style={{ color: 'var(--text-600)' }}>{d}</div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {calDays.map((cell, i) => {
                      if (!cell.date) return <div key={i} />;
                      const dateStr = `${cell.date.getFullYear()}-${pad(cell.date.getMonth() + 1)}-${pad(cell.date.getDate())}`;
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button key={i}
                          onClick={() => { if (cell.available) { setSelectedDate(dateStr); setSelectedSlot(null); } }}
                          disabled={!cell.available}
                          className="aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center"
                          style={{
                            background: isSelected ? 'rgba(212,168,39,0.15)' : cell.available ? 'rgba(255,255,255,0.03)' : 'transparent',
                            color: isSelected ? 'var(--gold-400)' : cell.available ? 'var(--text-200)' : 'var(--text-700)',
                            border: isSelected ? '1px solid rgba(212,168,39,0.35)' : cell.available ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
                            cursor: cell.available ? 'pointer' : 'default',
                          }}>
                          {cell.date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: time slots */}
                <div className="p-6">
                  {!selectedDate ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                      <CalendarDays size={32} style={{ color: 'var(--text-700)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-600)' }}>Select a date to see available times</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-600)' }}>
                        Available Times
                      </p>
                      <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-300)' }}>
                        {fmtDate(selectedDate)}
                      </p>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {slots.map(slot => (
                          <button key={slot} onClick={() => setSelectedSlot(slot)}
                            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={{
                              background: selectedSlot === slot ? 'rgba(212,168,39,0.12)' : 'rgba(255,255,255,0.04)',
                              color: selectedSlot === slot ? 'var(--gold-400)' : 'var(--text-300)',
                              border: `1px solid ${selectedSlot === slot ? 'rgba(212,168,39,0.3)' : 'rgba(255,255,255,0.06)'}`,
                            }}>
                            {fmtTime(slot)}
                          </button>
                        ))}
                      </div>

                      {selectedSlot && (
                        <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          onClick={handleBook}
                          className="glow-btn w-full mt-4 py-3 text-sm font-semibold">
                          Confirm · {fmtTime(selectedSlot)}
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 flex items-center justify-between text-xs"
                style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-600)' }}>
                <span>Timezone: {tz}</span>
                <span>Powered by Apex Job Tracker</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-950)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#d4a827' }} />
    </div>}>
      <BookingContent />
    </Suspense>
  );
}
