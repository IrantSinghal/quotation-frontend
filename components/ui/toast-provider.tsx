'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastListener, type Toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: 'bg-white border-l-4 border-green-500',
  error:   'bg-white border-l-4 border-red-500',
  info:    'bg-white border-l-4 border-blue-500',
  warning: 'bg-white border-l-4 border-amber-500',
};

const ICON_COLORS = {
  success: 'text-green-500',
  error:   'text-red-500',
  info:    'text-blue-500',
  warning: 'text-amber-500',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg shadow-lg min-w-[320px] max-w-[420px] animate-fade-in',
        STYLES[toast.type]
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', ICON_COLORS[toast.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-slate-600 mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsub = useToastListener((t) => {
      setToasts(prev => [...prev, t]);
    });
    return unsub;
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </>
  );
}
