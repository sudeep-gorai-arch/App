import React, { useCallback, useEffect, useRef } from 'react';

import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Toast } from './ToastContext';

interface Props {
  toast: Toast;
  onClose: (id: string) => void;
}

const TYPE_CONFIG = {
  success: {
    color: '#6EE7B7',
    icon: 'checkmark' as const,
    title: 'Done',
  },
  error: {
    color: '#FDA4AF',
    icon: 'close' as const,
    title: 'Unable to complete',
  },
  warning: {
    color: '#FCD34D',
    icon: 'alert' as const,
    title: 'Attention',
  },
  info: {
    color: '#A78BFA',
    icon: 'information' as const,
    title: 'Info',
  },
};

const EXIT_DURATION = 180;

export default function ToastItem({ toast, onClose }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.84)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingRef = useRef(false);

  const config = TYPE_CONFIG[toast.type];

  const dismiss = useCallback(
    (afterClose?: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;

      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      progress.stopAnimation();

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: EXIT_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.86,
          duration: EXIT_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose(toast.id);
        afterClose?.();
      });
    },
    [onClose, opacity, progress, scale, toast.id],
  );

  useEffect(() => {
    opacity.setValue(0);
    scale.setValue(0.84);
    progress.setValue(1);
    closingRef.current = false;

    const entrance = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 210,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 18,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]);

    const progressAnimation = Animated.timing(progress, {
      toValue: 0,
      duration: toast.duration,
      useNativeDriver: false,
    });

    entrance.start();
    progressAnimation.start();

    closeTimerRef.current = setTimeout(() => {
      dismiss();
    }, toast.duration);

    return () => {
      entrance.stop();
      progressAnimation.stop();

      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [dismiss, opacity, progress, scale, toast.duration]);

  const handleAction = useCallback(() => {
    const action = toast.action;

    dismiss(() => {
      if (!action) return;

      Promise.resolve(action.onPress()).catch(error => {
        console.log('TOAST ACTION ERROR', error);
      });
    });
  }, [dismiss, toast.action]);

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.outer,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.border}>
        <BlurView
          intensity={56}
          tint="dark"
          experimentalBlurMethod={
            Platform.OS === 'android' ? 'dimezisBlurView' : undefined
          }
          style={styles.glass}
        >
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.15)',
              'rgba(255,255,255,0.045)',
              'rgba(7,7,10,0.93)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            onPress={() => dismiss()}
            style={({ pressed }) => [
              styles.closeButton,
              { opacity: pressed ? 0.55 : 1 },
            ]}
          >
            <Ionicons
              name="close"
              size={16}
              color="rgba(255,255,255,0.48)"
            />
          </Pressable>

          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: `${config.color}18`,
                borderColor: `${config.color}52`,
              },
            ]}
          >
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>

          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{toast.message}</Text>

          {toast.action ? (
            <Pressable
              onPress={handleAction}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.actionButton,
                {
                  borderColor: `${config.color}55`,
                  backgroundColor: `${config.color}12`,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.actionText, { color: config.color }]}>
                {toast.action.label}
              </Text>
              <Ionicons name="arrow-forward" size={12} color={config.color} />
            </Pressable>
          ) : null}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.progress,
              {
                backgroundColor: config.color,
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </BlurView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    maxWidth: 292,
    marginVertical: 6,
  },

  border: {
    borderRadius: 28,
    padding: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000000',
    shadowOpacity: 0.42,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 16,
    },
    elevation: 18,
  },

  glass: {
    minHeight: 210,
    borderRadius: 27,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
    backgroundColor: 'rgba(7,7,10,0.86)',
  },

  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  title: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0.15,
    textAlign: 'center',
  },

  message: {
    color: 'rgba(255,255,255,0.67)',
    marginTop: 5,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
    textAlign: 'center',
  },

  actionButton: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 16,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },

  actionText: {
    fontSize: 11,
    fontWeight: '800',
  },

  progress: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 2,
    opacity: 0.72,
  },
});