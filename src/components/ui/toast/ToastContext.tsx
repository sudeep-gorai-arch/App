import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onPress: () => void | Promise<void>;
}

export interface ToastOptions {
  /** How long the popup remains visible. Defaults to 4 seconds. */
  duration?: number;
  /** Optional action displayed inside the auto-dismiss popup. */
  action?: ToastAction;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  action?: ToastAction;
}

type ShowToast = (message: string, options?: ToastOptions) => void;

export interface ToastContextType {
  success: ShowToast;
  error: ShowToast;
  warning: ShowToast;
  info: ShowToast;
}

export const ToastContext = createContext<ToastContextType | null>(null);