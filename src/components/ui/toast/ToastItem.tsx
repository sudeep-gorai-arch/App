import React, { useEffect, useRef } from 'react';

import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Toast } from './ToastContext';

interface Props {
  toast: Toast;
  onClose: (id: string) => void;
}

export default function ToastItem({ toast, onClose }: Props) {
  const slide = useRef(new Animated.Value(80)).current;

  const opacity = useRef(new Animated.Value(0)).current;

  const progress = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),

      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),

      Animated.timing(progress, {
        toValue: 0,
        duration: 4000,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const colors = {
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  };

  const icons = {
    success: 'checkmark-circle',
    error: 'close-circle',
    warning: 'warning',
    info: 'information-circle',
  } as const;

  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  };

  const color = colors[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: color,
          transform: [
            {
              translateX: slide,
            },
          ],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={icons[toast.type]} size={26} color={color} />

        <View style={styles.textContainer}>
          <Text style={styles.title}>{titles[toast.type]}</Text>

          <Text style={styles.message}>{toast.message}</Text>
        </View>

        <Pressable onPress={() => onClose(toast.id)}>
          <Ionicons name="close" size={22} color="#BBBBBB" />
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.progress,
          {
            backgroundColor: color,
            width: progress.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',

    borderRadius: 18,

    borderWidth: 1,

    backgroundColor: '#1A1A1A',

    marginBottom: 12,

    minWidth: 320,

    maxWidth: 380,

    shadowColor: '#000',

    shadowOpacity: 0.3,

    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 10,
  },

  content: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    padding: 18,
  },

  textContainer: {
    flex: 1,

    marginHorizontal: 14,
  },

  title: {
    color: '#FFF',

    fontSize: 16,

    fontWeight: '700',
  },

  message: {
    color: '#CFCFCF',

    marginTop: 4,

    fontSize: 14,

    lineHeight: 20,
  },

  progress: {
    height: 4,
  },
});
