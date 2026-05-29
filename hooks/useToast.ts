'use client';

import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

let toastListeners: Array<(toast: Toast) => void> = [];

export function emitToast(toast: Omit<Toast, 'id'>) {
  const t: Toast = { ...toast, id: Math.random().toString(36).slice(2) };
  toastListeners.forEach(fn => fn(t));
}

export function useToastListener(cb: (t: Toast) => void) {
  toastListeners.push(cb);
  return () => {
    toastListeners = toastListeners.filter(fn => fn !== cb);
  };
}

// Simple imperative API for use anywhere
export const toast = {
  success: (title: string, description?: string) =>
    emitToast({ type: 'success', title, description }),
  error: (title: string, description?: string) =>
    emitToast({ type: 'error', title, description }),
  info: (title: string, description?: string) =>
    emitToast({ type: 'info', title, description }),
  warning: (title: string, description?: string) =>
    emitToast({ type: 'warning', title, description }),
};
