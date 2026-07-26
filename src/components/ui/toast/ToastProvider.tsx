import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { StyleSheet, View } from 'react-native';

import ToastItem from './ToastItem';

import {
  Toast,
  ToastContext,
  ToastOptions,
  ToastType,
} from './ToastContext';

interface Props {
  children: ReactNode;
}

const DEFAULT_TOAST_DURATION = 4000;
const ACTION_TOAST_DURATION = 6000;

export default function ToastProvider({ children }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastKeysRef = useRef(new Map<string, string>());
  const activeToastKeysRef = useRef(new Set<string>());

  const remove = useCallback((id: string) => {
    const toastKey = toastKeysRef.current.get(id);

    if (toastKey) {
      activeToastKeysRef.current.delete(toastKey);
      toastKeysRef.current.delete(id);
    }

    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, options: ToastOptions = {}) => {
      const toastKey = `${type}:${message}`;

      if (activeToastKeysRef.current.has(toastKey)) {
        return;
      }

      const id =
        Date.now().toString() + Math.random().toString(36).substring(2);
      const duration = Math.max(
        1500,
        options.duration ??
          (options.action ? ACTION_TOAST_DURATION : DEFAULT_TOAST_DURATION),
      );

      activeToastKeysRef.current.add(toastKey);
      toastKeysRef.current.set(id, toastKey);

      setToasts(current => [
        ...current,
        {
          id,
          type,
          message,
          duration,
          action: options.action,
        },
      ]);
    },
    [],
  );

  useEffect(() => {
    return () => {
      toastKeysRef.current.clear();
      activeToastKeysRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      success: (message: string, options?: ToastOptions) =>
        addToast('success', message, options),

      error: (message: string, options?: ToastOptions) =>
        addToast('error', message, options),

      warning: (message: string, options?: ToastOptions) =>
        addToast('warning', message, options),

      info: (message: string, options?: ToastOptions) =>
        addToast('info', message, options),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <View pointerEvents="box-none" style={styles.container}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={remove} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
});