import React, { useEffect, useState } from 'react';
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

  return `${hours}:${String(minutes).padStart(2, '0')}`;
};

const useCurrentTime = () => {
  const [time, setTime] = useState(formatCurrentTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatCurrentTime());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return time;
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

const StatusBar = () => {
  const currentTime = useCurrentTime();

  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusTime}>{currentTime}</Text>

      <View style={styles.statusRight}>
        <Ionicons name="notifications-off" size={12} color="#FFFFFF" />
        <Ionicons name="wifi" size={12} color="#FFFFFF" />
        <Ionicons name="cellular" size={12} color="#FFFFFF" />

        <View style={styles.battery}>
          <Text style={styles.batteryText}>98</Text>
        </View>
      </View>
    </View>
  );
};

const AppIcon = ({
  label,
  icon,
  tint,
  darkIcon,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string[];
  darkIcon?: boolean;
}) => {
  return (
    <View style={styles.appItem}>
      <LinearGradient colors={tint as any} style={styles.appIcon}>
        <Ionicons name={icon} size={21} color={darkIcon ? '#111827' : '#FFFFFF'} />
      </LinearGradient>

      <Text numberOfLines={1} style={styles.appLabel}>
        {label}
      </Text>
    </View>
  );
};

const DockIcon = ({
  icon,
  tint,
  darkIcon,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string[];
  darkIcon?: boolean;
}) => {
  return (
    <LinearGradient colors={tint as any} style={styles.dockIcon}>
      <Ionicons name={icon} size={23} color={darkIcon ? '#111827' : '#FFFFFF'} />
    </LinearGradient>
  );
};

const HomeScreenPreview = ({ width, height }: Props) => {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        typeof width === 'number' ? { width } : null,
        typeof height === 'number' ? { height } : null,
      ]}
    >
      <StatusBar />

      <View style={styles.topEmptySpace} />

      <View style={styles.bottomContent}>
        <View style={styles.appsGrid}>
          {HOME_APPS.map(item => (
            <AppIcon
              key={item.id}
              label={item.label}
              icon={item.icon as keyof typeof Ionicons.glyphMap}
              tint={item.tint}
              darkIcon={item.darkIcon}
            />
          ))}
        </View>

        <View style={styles.pageDots}>
          <View style={styles.homeDot} />
          <View style={styles.pageDotActive} />
          <View style={styles.pageDot} />
        </View>

        <View style={styles.dock}>
          {DOCK_APPS.map(item => (
            <DockIcon
              key={item.id}
              icon={item.icon as keyof typeof Ionicons.glyphMap}
              tint={item.tint}
              darkIcon={item.darkIcon}
            />
          ))}
        </View>

        <View style={styles.navBar}>
          <View style={styles.navRecents} />
          <View style={styles.navHome} />
          <View style={styles.navBack} />
        </View>
      </View>
    </View>
  );
};

export default HomeScreenPreview;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    paddingTop: 18,
    paddingHorizontal: 22,
    paddingBottom: 13,
  },

  statusBar: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusTime: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  battery: {
    minWidth: 22,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  batteryText: {
    color: '#111111',
    fontFamily: fontFamily.bold,
    fontSize: 9,
    lineHeight: 11,
  },

  topEmptySpace: {
    flex: 1,
  },

  bottomContent: {
    paddingBottom: 1,
  },

  appsGrid: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  appItem: {
    width: 56,
    alignItems: 'center',
  },

  appIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  appLabel: {
    marginTop: 6,
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  pageDots: {
    alignSelf: 'center',
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  homeDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },

  pageDotActive: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },

  pageDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },

  dock: {
    marginBottom: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dockIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  navBar: {
    height: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  navRecents: {
    width: 17,
    height: 17,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.84)',
  },

  navHome: {
    width: 21,
    height: 21,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.84)',
  },

  navBack: {
    width: 17,
    height: 17,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255,255,255,0.84)',
    transform: [{ rotate: '45deg' }],
  },
});