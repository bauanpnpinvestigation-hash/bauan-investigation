import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 3500) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => {
        // Keep maximum 4 concurrent toasts to avoid clutter and save CPU on older phones
        const trimmed = prev.length >= 4 ? prev.slice(1) : prev;
        return [...trimmed, newToast];
      });

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback((message: string, title?: string) => showToast('success', message, title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast('error', message, title, 5000), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast('info', message, title), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast('warning', message, title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, dismissToast }}>
      {children}

      {/* Floating Lightweight Toast Container */}
      <aside 
        aria-live="polite" 
        className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-24px)] pointer-events-none"
      >
        {toasts.map((t) => {
          const typeStyles = {
            success: 'bg-emerald-950/95 border-emerald-500/60 text-white shadow-emerald-950/40',
            error: 'bg-rose-950/95 border-rose-500/60 text-white shadow-rose-950/40',
            info: 'bg-blue-950/95 border-blue-500/60 text-white shadow-blue-950/40',
            warning: 'bg-amber-950/95 border-amber-500/60 text-white shadow-amber-950/40',
          }[t.type];

          const IconComponent = {
            success: CheckCircle2,
            error: AlertCircle,
            info: Info,
            warning: AlertTriangle,
          }[t.type];

          const iconColor = {
            success: 'text-emerald-400',
            error: 'text-rose-400',
            info: 'text-blue-400',
            warning: 'text-amber-400',
          }[t.type];

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 transform-gpu animate-fadeIn text-xs ${typeStyles}`}
            >
              <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                {t.title && <div className="font-extrabold uppercase tracking-wide text-[11px] mb-0.5">{t.title}</div>}
                <div className="leading-relaxed font-medium break-words text-[11.5px] opacity-95">{t.message}</div>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
