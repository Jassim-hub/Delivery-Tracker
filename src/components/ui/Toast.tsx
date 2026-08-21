import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: (_message: string, _type?: ToastType) => void 0 });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]); // max 5 at once
    timers.current[id] = setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => Object.values(timers.current).forEach(clearTimeout);
  }, []);

  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
    error:   <AlertCircle  className="w-4 h-4 text-rose-500 flex-shrink-0" />,
    info:    <Info         className="w-4 h-4 text-blue-500 flex-shrink-0" />,
  };

  const bgMap: Record<ToastType, string> = {
    success: 'bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-700',
    error:   'bg-white dark:bg-gray-800 border-rose-200 dark:border-rose-700',
    info:    'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Stack — fixed bottom-left, above role switcher */}
      <div
        className="fixed bottom-20 left-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg
              animate-slide-up text-sm font-medium text-gray-900 dark:text-gray-100
              ${bgMap[t.type]}
            `}
          >
            {iconMap[t.type]}
            <span className="flex-1 text-xs leading-relaxed">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="p-0.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
