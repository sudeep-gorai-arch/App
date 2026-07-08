import React, { useMemo } from 'react';
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

  appItemWidth: number;
  appIconSize: number;
  appIconRadius: number;
  appIonSize: number;
  appLabelFontSize: number;
  appLabelMarginTop: number;
  appsMarginBottom: number;

  dotLarge: number;
  dotSmall: number;
  dotGap: number;
  pageDotsMarginBottom: number;

  dockIconSize: number;
  dockIconRadius: number;
  dockIonSize: number;
  dockMarginBottom: number;

  navBarHeight: number;
  navShapeSize: number;
  navHomeSize: number;
  navStroke: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
};

const buildMetrics = (width?: number, height?: number): PreviewMetrics => {
  const safeWidth = typeof width === 'number' && width > 0 ? width : 340;
  const safeHeight = typeof height === 'number' && height > 0 ? height : 604;

  /*
   * Premium compact scaling:
   * - Works for image crop preview and video crop preview.
   * - Keeps launcher elements smaller so wallpaper remains the hero.
   */
  const baseScale = clamp(Math.min(safeWidth / 340, safeHeight / 604), 0.66, 1);

  const appIconSize = Math.round(clamp(40 * baseScale, 33, 40));
  const dockIconSize = Math.round(clamp(41 * baseScale, 34, 41));

  const navScale = clamp(baseScale * 0.86, 0.58, 0.86);
  const navShapeSize = Math.round(clamp(15 * navScale, 10, 13));
  const navHomeSize = Math.round(clamp(18 * navScale, 12, 16));

  return {
    paddingTop: Math.round(clamp(safeHeight * 0.035, 18, 26)),
    paddingHorizontal: Math.round(clamp(safeWidth * 0.058, 16, 21)),
    paddingBottom: Math.round(clamp(safeHeight * 0.017, 8, 12)),

    appItemWidth: Math.round(clamp(53 * baseScale, 44, 53)),
    appIconSize,
    appIconRadius: Math.round(clamp(appIconSize * 0.34, 12, 15)),
    appIonSize: Math.round(clamp(appIconSize * 0.42, 14, 17)),
    appLabelFontSize: Math.round(clamp(9.2 * baseScale, 8, 9)),
    appLabelMarginTop: Math.round(clamp(5 * baseScale, 4, 5)),
    appsMarginBottom: Math.round(clamp(safeHeight * 0.025, 13, 17)),

    dotLarge: Math.round(clamp(7.5 * baseScale, 5, 8)),
    dotSmall: Math.round(clamp(6 * baseScale, 4, 6)),
    dotGap: Math.round(clamp(6.5 * baseScale, 5, 7)),
    pageDotsMarginBottom: Math.round(clamp(safeHeight * 0.03, 16, 21)),

    dockIconSize,
    dockIconRadius: Math.round(clamp(dockIconSize * 0.35, 12, 15)),
    dockIonSize: Math.round(clamp(dockIconSize * 0.44, 15, 18)),
    dockMarginBottom: Math.round(clamp(safeHeight * 0.032, 17, 22)),

    navBarHeight: Math.round(clamp(22 * navScale, 15, 20)),
    navShapeSize,
    navHomeSize,
    navStroke: clamp(1.7 * navScale, 1.1, 1.5),
  };
};

const HOME_APPS = [
  {
    id: 'store',
    label: 'Store',
    icon: 'bag-outline',
    tint: ['#F43F5E', '#EC4899'],
  },
  {
    id: 'gallery',
    label: 'Gallery',
    icon: 'image-outline',
    tint: ['#0EA5E9', '#38BDF8'],
  },
  {
    id: 'google',
    label: 'Google',
    icon: 'apps-outline',
    tint: ['#FFFFFF', '#F8FAFC'],
    darkIcon: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'logo-whatsapp',
    tint: ['#22C55E', '#16A34A'],
  },
];

const DOCK_APPS = [
  {
    id: 'phone',
    icon: 'call-outline',
    tint: ['#0EA5E9', '#38BDF8'],
  },
  {
    id: 'messages',
    icon: 'chatbubble-outline',
    tint: ['#FFFFFF', '#F8FAFC'],
    darkIcon: true,
  },
  {
    id: 'browser',
    icon: 'aperture-outline',
    tint: ['#FFFFFF', '#F8FAFC'],
    darkIcon: true,
  },
  {
    id: 'camera',
    icon: 'camera-outline',
    tint: ['#14B8A6', '#2DD4BF'],
  },
];

const AppIcon = ({
  label,
  icon,
  tint,
  darkIcon,
  metrics,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string[];
  darkIcon?: boolean;
  metrics: PreviewMetrics;
}) => {
  return (
    <View
      style={[
        styles.appItem,
        {
          width: metrics.appItemWidth,
        },
      ]}
    >
      <LinearGradient
        colors={tint as any}
        style={[
          styles.appIcon,
          {
            width: metrics.appIconSize,
            height: metrics.appIconSize,
            borderRadius: metrics.appIconRadius,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={metrics.appIonSize}
          color={darkIcon ? '#111827' : '#FFFFFF'}
        />
      </LinearGradient>

      <Text
        numberOfLines={1}
        style={[
          styles.appLabel,
          {
            marginTop: metrics.appLabelMarginTop,
            fontSize: metrics.appLabelFontSize,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const DockIcon = ({
  icon,
  tint,
  darkIcon,
  metrics,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string[];
  darkIcon?: boolean;
  metrics: PreviewMetrics;
}) => {
  return (
    <LinearGradient
      colors={tint as any}
      style={[
        styles.dockIcon,
        {
          width: metrics.dockIconSize,
          height: metrics.dockIconSize,
          borderRadius: metrics.dockIconRadius,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={metrics.dockIonSize}
        color={darkIcon ? '#111827' : '#FFFFFF'}
      />
    </LinearGradient>
  );
};

const HomeScreenPreview = ({ width, height }: Props) => {
  const metrics = useMemo(() => buildMetrics(width, height), [width, height]);

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
      <View style={styles.topEmptySpace} />

      <View style={styles.bottomContent}>
        <View
          style={[
            styles.appsGrid,
            {
              marginBottom: metrics.appsMarginBottom,
            },
          ]}
        >
          {HOME_APPS.map(item => (
            <AppIcon
              key={item.id}
              label={item.label}
              icon={item.icon as keyof typeof Ionicons.glyphMap}
              tint={item.tint}
              darkIcon={item.darkIcon}
              metrics={metrics}
            />
          ))}
        </View>

        <View
          style={[
            styles.pageDots,
            {
              marginBottom: metrics.pageDotsMarginBottom,
              gap: metrics.dotGap,
            },
          ]}
        >
          <View
            style={[
              styles.homeDot,
              {
                width: metrics.dotLarge,
                height: metrics.dotLarge,
                borderRadius: metrics.dotLarge / 2,
              },
            ]}
          />

          <View
            style={[
              styles.pageDotActive,
              {
                width: metrics.dotSmall,
                height: metrics.dotSmall,
                borderRadius: metrics.dotSmall / 2,
              },
            ]}
          />

          <View
            style={[
              styles.pageDot,
              {
                width: metrics.dotSmall,
                height: metrics.dotSmall,
                borderRadius: metrics.dotSmall / 2,
              },
            ]}
          />
        </View>

        <View
          style={[
            styles.dock,
            {
              marginBottom: metrics.dockMarginBottom,
            },
          ]}
        >
          {DOCK_APPS.map(item => (
            <DockIcon
              key={item.id}
              icon={item.icon as keyof typeof Ionicons.glyphMap}
              tint={item.tint}
              darkIcon={item.darkIcon}
              metrics={metrics}
            />
          ))}
        </View>

        <View
          style={[
            styles.navBar,
            {
              height: metrics.navBarHeight,
            },
          ]}
        >
          <View
            style={[
              styles.navRecents,
              {
                width: metrics.navShapeSize,
                height: metrics.navShapeSize,
                borderLeftWidth: metrics.navStroke,
                borderRightWidth: metrics.navStroke,
              },
            ]}
          />

          <View
            style={[
              styles.navHome,
              {
                width: metrics.navHomeSize,
                height: metrics.navHomeSize,
                borderRadius: metrics.navHomeSize / 2,
                borderWidth: metrics.navStroke,
              },
            ]}
          />

          <View
            style={[
              styles.navBack,
              {
                width: metrics.navShapeSize,
                height: metrics.navShapeSize,
                borderLeftWidth: metrics.navStroke,
                borderBottomWidth: metrics.navStroke,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

export default HomeScreenPreview;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },

  topEmptySpace: {
    flex: 1,
  },

  bottomContent: {
    paddingBottom: 0,
  },

  appsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  appItem: {
    alignItems: 'center',
  },

  appIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  appLabel: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  pageDots: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },

  homeDot: {
    backgroundColor: 'rgba(255,255,255,0.82)',
  },

  pageDotActive: {
    backgroundColor: 'rgba(255,255,255,0.82)',
  },

  pageDot: {
    backgroundColor: 'rgba(255,255,255,0.34)',
  },

  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dockIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    opacity: 0.82,
  },

  navRecents: {
    borderColor: 'rgba(255,255,255,0.72)',
  },

  navHome: {
    borderColor: 'rgba(255,255,255,0.72)',
  },

  navBack: {
    borderColor: 'rgba(255,255,255,0.72)',
    transform: [{ rotate: '45deg' }],
  },
});