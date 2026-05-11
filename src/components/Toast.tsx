'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastMessage } from '@/types';

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: { text: '#34d399', border: 'rgba(52, 211, 153, 0.25)' },
  error: { text: '#f87171', border: 'rgba(248, 113, 113, 0.25)' },
  info: { text: '#818cf8', border: 'rgba(129, 140, 248, 0.25)' },
  warning: { text: '#fbbf24', border: 'rgba(251, 191, 36, 0.25)' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => {
            const Icon = ICONS[toast.type];
            const colors = COLORS[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="toast"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-start gap-3">
                  <Icon size={17} style={{ color: colors.text, flexShrink: 0, marginTop: 1 }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: colors.text }}>
                      {toast.title}
                    </p>
                    {toast.message && (
                      <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-400)' }}>
                        {toast.message}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-0.5 rounded hover:opacity-60 transition-opacity flex-shrink-0"
                    style={{ color: 'var(--text-600)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
