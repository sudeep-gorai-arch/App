import React, { ReactNode, useCallback, useMemo, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import ToastItem from './ToastItem';

import { Toast, ToastContext, ToastType } from './ToastContext';

interface Props {
  children: ReactNode;
}

export default function ToastProvider({ children }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id =
        Date.now().toString() + Math.random().toString(36).substring(2);

      setToasts(current => [
        ...current,
        {
          id,
          type,
          message,
        },
      ]);

      setTimeout(() => {
        remove(id);
      }, 4000);
    },
    [remove],
  );

  const value = useMemo(
    () => ({
      success: (message: string) => addToast('success', message),

      error: (message: string) => addToast('error', message),

      warning: (message: string) => addToast('warning', message),

      info: (message: string) => addToast('info', message),
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
    position: 'absolute',

    top: 60,

    left: 16,

    right: 16,

    zIndex: 9999,

    elevation: 9999,

    alignItems: 'center',
  },
});
