import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { fontFamily } from '../../styles/typography';

type Props = {
  width?: number;
  height?: number;
};

type PreviewMetrics = {
  paddingTop: number;
  paddingHorizontal: number;
  paddingBottom: number;

  lockAreaMarginTop: number;
  lockIconSize: number;

  clockMarginTop: number;
  clockFontSize: number;
  clockLineHeight: number;
  clockLetterSpacing: number;

  dateMarginTop: number;
  dateFontSize: number;

  widgetMarginTop: number;
  widgetHeight: number;
  widgetMinWidth: number;
  widgetFontSize: number;

  notificationGap: number;
  notificationMinHeight: number;
  notificationRadius: number;
  notificationPaddingHorizontal: number;
  notificationPaddingVertical: number;
  notificationInnerGap: number;
  notificationIconSize: number;
  notificationIconRadius: number;
  notificationIonSize: number;
  notificationTitleFontSize: number;
  notificationTextFontSize: number;

  hintChevronSize: number;
  hintFontSize: number;

  bottomMinHeight: number;
  roundActionSize: number;
  roundActionIonSize: number;
  homeIndicatorWidth: number;
  homeIndicatorHeight: number;
  homeIndicatorMarginBottom: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
};

const buildMetrics = (width?: number, height?: number): PreviewMetrics => {
  const safeWidth = typeof width === 'number' && width > 0 ? width : 340;
  const safeHeight = typeof height === 'number' && height > 0 ? height : 604;

  /*
   * Premium responsive lock-screen preview:
   * - Scales for both image and video crop preview frames.
   * - Keeps the top clean for Back and Next/Done buttons.
   * - Keeps lock screen UI compact so wallpaper remains the hero.
   */
  const baseScale = clamp(Math.min(safeWidth / 340, safeHeight / 604), 0.66, 1);
  const compactScale = clamp(baseScale * 0.92, 0.58, 0.92);

  const clockFontSize = Math.round(clamp(61 * baseScale, 45, 61));
  const clockLineHeight = Math.round(clamp(56 * baseScale, 42, 56));

  const roundActionSize = Math.round(clamp(48 * compactScale, 36, 44));
  const notificationIconSize = Math.round(clamp(34 * compactScale, 27, 34));

  return {
    paddingTop: Math.round(clamp(safeHeight * 0.058, 28, 40)),
    paddingHorizontal: Math.round(clamp(safeWidth * 0.058, 16, 21)),
    paddingBottom: Math.round(clamp(safeHeight * 0.026, 12, 17)),

    lockAreaMarginTop: Math.round(clamp(safeHeight * 0.022, 10, 16)),
    lockIconSize: Math.round(clamp(17 * compactScale, 13, 16)),

    clockMarginTop: Math.round(clamp(9 * baseScale, 6, 9)),
    clockFontSize,
    clockLineHeight,
    clockLetterSpacing: clamp(-1.8 * baseScale, -1.8, -1.2),

    dateMarginTop: Math.round(clamp(7 * baseScale, 4, 7)),
    dateFontSize: Math.round(clamp(13 * baseScale, 10, 13)),

    widgetMarginTop: Math.round(clamp(safeHeight * 0.025, 12, 16)),
    widgetHeight: Math.round(clamp(28 * compactScale, 22, 28)),
    widgetMinWidth: Math.round(clamp(158 * compactScale, 118, 158)),
    widgetFontSize: Math.round(clamp(11 * compactScale, 9, 11)),

    notificationGap: Math.round(clamp(12 * compactScale, 8, 12)),
    notificationMinHeight: Math.round(clamp(70 * compactScale, 53, 68)),
    notificationRadius: Math.round(clamp(24 * compactScale, 18, 24)),
    notificationPaddingHorizontal: Math.round(clamp(15 * compactScale, 11, 15)),
    notificationPaddingVertical: Math.round(clamp(12 * compactScale, 9, 12)),
    notificationInnerGap: Math.round(clamp(11 * compactScale, 8, 11)),
    notificationIconSize,
    notificationIconRadius: Math.round(clamp(notificationIconSize * 0.36, 10, 13)),
    notificationIonSize: Math.round(clamp(15 * compactScale, 11, 15)),
    notificationTitleFontSize: Math.round(clamp(12.5 * compactScale, 10, 12)),
    notificationTextFontSize: Math.round(clamp(10.5 * compactScale, 8, 10)),

    hintChevronSize: Math.round(clamp(15 * compactScale, 11, 15)),
    hintFontSize: Math.round(clamp(10.5 * compactScale, 8, 10)),

    bottomMinHeight: Math.round(clamp(58 * compactScale, 42, 54)),
    roundActionSize,
    roundActionIonSize: Math.round(clamp(21 * compactScale, 15, 20)),
    homeIndicatorWidth: Math.round(clamp(66 * compactScale, 46, 64)),
    homeIndicatorHeight: Math.round(clamp(4 * compactScale, 3, 4)),
    homeIndicatorMarginBottom: Math.round(clamp(5 * compactScale, 3, 5)),
  };
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

  const metrics = useMemo(() => buildMetrics(width, height), [width, height]);

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
        {
          paddingTop: metrics.paddingTop,
          paddingHorizontal: metrics.paddingHorizontal,
          paddingBottom: metrics.paddingBottom,
        },
      ]}
    >
      <View
        style={[
          styles.lockArea,
          {
            marginTop: metrics.lockAreaMarginTop,
          },
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={metrics.lockIconSize}
          color="rgba(255,255,255,0.84)"
        />

        <Text
          style={[
            styles.clock,
            {
              marginTop: metrics.clockMarginTop,
              fontSize: metrics.clockFontSize,
              lineHeight: metrics.clockLineHeight,
              letterSpacing: metrics.clockLetterSpacing,
            },
          ]}
        >
          {clockText}
        </Text>

        <Text
          style={[
            styles.date,
            {
              marginTop: metrics.dateMarginTop,
              fontSize: metrics.dateFontSize,
            },
          ]}
        >
          {date}
        </Text>

        <View
          style={[
            styles.addWidgets,
            {
              marginTop: metrics.widgetMarginTop,
              height: metrics.widgetHeight,
              minWidth: metrics.widgetMinWidth,
              borderRadius: metrics.widgetHeight / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.addWidgetsText,
              {
                fontSize: metrics.widgetFontSize,
              },
            ]}
          >
            Add widgets
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.notificationStack,
          {
            gap: metrics.notificationGap,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.09)']}
          style={[
            styles.notificationCard,
            {
              minHeight: metrics.notificationMinHeight,
              borderRadius: metrics.notificationRadius,
              paddingHorizontal: metrics.notificationPaddingHorizontal,
              paddingVertical: metrics.notificationPaddingVertical,
              gap: metrics.notificationInnerGap,
            },
          ]}
        >
          <View
            style={[
              styles.notificationIcon,
              {
                width: metrics.notificationIconSize,
                height: metrics.notificationIconSize,
                borderRadius: metrics.notificationIconRadius,
              },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={metrics.notificationIonSize}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.notificationTextWrap}>
            <Text
              style={[
                styles.notificationTitle,
                {
                  fontSize: metrics.notificationTitleFontSize,
                },
              ]}
            >
              FlexiWalls
            </Text>

            <Text
              style={[
                styles.notificationText,
                {
                  fontSize: metrics.notificationTextFontSize,
                },
              ]}
              numberOfLines={1}
            >
              Wallpaper preview is ready
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.smallHint}>
          <Ionicons
            name="chevron-up"
            size={metrics.hintChevronSize}
            color="rgba(255,255,255,0.78)"
          />

          <Text
            style={[
              styles.smallHintText,
              {
                fontSize: metrics.hintFontSize,
              },
            ]}
          >
            Swipe to unlock
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.bottomActions,
          {
            minHeight: metrics.bottomMinHeight,
          },
        ]}
      >
        <View
          style={[
            styles.roundAction,
            {
              width: metrics.roundActionSize,
              height: metrics.roundActionSize,
              borderRadius: metrics.roundActionSize / 2,
            },
          ]}
        >
          <Ionicons
            name="flashlight-outline"
            size={metrics.roundActionIonSize}
            color="#FFFFFF"
          />
        </View>

        <View
          style={[
            styles.homeIndicator,
            {
              width: metrics.homeIndicatorWidth,
              height: metrics.homeIndicatorHeight,
              borderRadius: metrics.homeIndicatorHeight / 2,
              marginBottom: metrics.homeIndicatorMarginBottom,
            },
          ]}
        />

        <View
          style={[
            styles.roundAction,
            {
              width: metrics.roundActionSize,
              height: metrics.roundActionSize,
              borderRadius: metrics.roundActionSize / 2,
            },
          ]}
        >
          <Ionicons
            name="camera-outline"
            size={metrics.roundActionIonSize}
            color="#FFFFFF"
          />
        </View>
      </View>
    </View>
  );
};

export default LockScreenPreview;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },

  lockArea: {
    alignItems: 'center',
  },

  clock: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  date: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: fontFamily.semiBold,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  addWidgets: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.46)',
    backgroundColor: 'rgba(255,255,255,0.11)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addWidgetsText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  notificationStack: {},

  notificationCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationIcon: {
    backgroundColor: 'rgba(139,92,246,0.70)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationTextWrap: {
    flex: 1,
  },

  notificationTitle: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
  },

  notificationText: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fontFamily.semiBold,
  },

  smallHint: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
  },

  smallHintText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fontFamily.semiBold,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  bottomActions: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  roundAction: {
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeIndicator: {
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
});