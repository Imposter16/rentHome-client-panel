'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let activeToasts: ToastItem[] = [];
const listeners: Set<ToastListener> = new Set();

function notify() {
  listeners.forEach((listener) => listener([...activeToasts]));
}

export const toast = {
  show: (message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, message, type, duration };
    activeToasts = [...activeToasts, newToast];
    notify();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
  },
  success: (message: string, duration?: number) => toast.show(message, 'success', duration),
  error: (message: string, duration?: number) => toast.show(message, 'error', duration ?? 5000),
  info: (message: string, duration?: number) => toast.show(message, 'info', duration),
  warning: (message: string, duration?: number) => toast.show(message, 'warning', duration ?? 5000),
  dismiss: (id: string) => {
    activeToasts = activeToasts.filter((t) => t.id !== id);
    notify();
  },
};

export const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
  toast.show(message, type, duration);
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const update = (updated: ToastItem[]) => setToasts(updated);
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
            item.type === 'error'
              ? 'bg-red-950/90 border-red-800 text-red-100'
              : item.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-100'
              : item.type === 'warning'
              ? 'bg-amber-950/90 border-amber-800 text-amber-100'
              : 'bg-slate-900/95 border-slate-700 text-slate-100'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {item.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {item.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
          </div>

          <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
            {item.message}
          </div>

          <button
            onClick={() => toast.dismiss(item.id)}
            className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
