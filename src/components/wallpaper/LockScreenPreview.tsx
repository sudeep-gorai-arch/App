import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { fontFamily } from '../../styles/typography';

type Props = {
  width?: number;
  height?: number;
};

const formatCurrentTime = () => {
  const now = new Date();

  let hours = now.getHours();
  const minutes = now.getMinutes();

  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;

  return {
    hour: String(hours).padStart(2, '0'),
    minute: String(minutes).padStart(2, '0'),
  };
};

const formatCurrentDate = () => {
  const now = new Date();

  return now.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
};

const useCurrentDateTime = () => {
  const [dateTime, setDateTime] = useState(() => ({
    time: formatCurrentTime(),
    date: formatCurrentDate(),
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime({
        time: formatCurrentTime(),
        date: formatCurrentDate(),
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return dateTime;
};

const LockScreenPreview = ({ width, height }: Props) => {
  const { time, date } = useCurrentDateTime();

  const clockText = useMemo(() => {
    return `${time.hour}\n${time.minute}`;
  }, [time.hour, time.minute]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        typeof width === 'number' ? { width } : null,
        typeof height === 'number' ? { height } : null,
      ]}
    >
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>
          {Number(time.hour)}:{time.minute}
        </Text>

        <View style={styles.statusRight}>
          <Ionicons name="notifications-off" size={14} color="#FFFFFF" />
          <Ionicons name="wifi" size={14} color="#FFFFFF" />
          <Ionicons name="cellular" size={13} color="#FFFFFF" />

          <View style={styles.battery}>
            <Text style={styles.batteryText}>98</Text>
          </View>
        </View>
      </View>

      <View style={styles.lockArea}>
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color="rgba(255,255,255,0.84)"
        />

        <Text style={styles.clock}>{clockText}</Text>

        <Text style={styles.date}>{date}</Text>

        <View style={styles.addWidgets}>
          <Text style={styles.addWidgetsText}>Add widgets</Text>
        </View>
      </View>

      <View style={styles.notificationStack}>
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.10)']}
          style={styles.notificationCard}
        >
          <View style={styles.notificationIcon}>
            <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
          </View>

          <View style={styles.notificationTextWrap}>
            <Text style={styles.notificationTitle}>FlexiWalls</Text>
            <Text style={styles.notificationText}>Wallpaper preview is ready</Text>
          </View>
        </LinearGradient>

        <View style={styles.smallHint}>
          <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.82)" />
          <Text style={styles.smallHintText}>Swipe to unlock</Text>
        </View>
      </View>

      <View style={styles.bottomActions}>
        <View style={styles.roundAction}>
          <Ionicons name="flashlight-outline" size={24} color="#FFFFFF" />
        </View>

        <View style={styles.homeIndicator} />

        <View style={styles.roundAction}>
          <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
};

export default LockScreenPreview;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },

  statusBar: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusTime: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 17,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  battery: {
    minWidth: 24,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  batteryText: {
    color: '#111111',
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
  },

  lockArea: {
    marginTop: 18,
    alignItems: 'center',
  },

  clock: {
    marginTop: 10,
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 66,
    lineHeight: 61,
    letterSpacing: -2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  date: {
    marginTop: 7,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  addWidgets: {
    marginTop: 17,
    height: 30,
    minWidth: 172,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.50)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addWidgetsText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  notificationStack: {
    gap: 13,
  },

  notificationCard: {
    minHeight: 76,
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  notificationIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationTextWrap: {
    flex: 1,
  },

  notificationTitle: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 13,
  },

  notificationText: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },

  smallHint: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
  },

  smallHintText: {
    color: 'rgba(255,255,255,0.76)',
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  bottomActions: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  roundAction: {
    width: 54,
    height: 54,
    borderRadius: 99,
    backgroundColor: 'rgba(0,0,0,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeIndicator: {
    width: 74,
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.86)',
    marginBottom: 5,
  },
});