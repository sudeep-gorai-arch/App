import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';

import { colors, gradients } from '../../styles/colors';
import { spacing, radius, PROFILE } from '../../utils/constants';

import { getFavorites } from '../../services/favoriteService';
import { getDownloads } from '../../services/downloadService';

import { Wallpaper } from '../../services/types';

type Nav = { navigate: (name: string) => void };

// Display profile (matches the mockup). Thumbnails fall back to the bundled
// placeholders so the screen looks complete with or without a live backend.
const USER = {
  name: 'Ethan Hunt',
  tier: 'Premium',
  bio: 'Wallpaper lover and explorer \u2728',
  avatar: 'https://picsum.photos/seed/acct-ethan/400/400',
};

const STATS = [
  { id: 'fav', icon: 'image-outline', value: '1,248', label: 'Favorites', tint: colors.chipPink },
  { id: 'dl', icon: 'download-outline', value: '342', label: 'Downloads', tint: colors.glassFillSoft },
  { id: 'col', icon: 'heart-outline', value: '28', label: 'Collections', tint: colors.chipPink },
] as const;

const SETTINGS_ROWS: {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}[] = [
  { id: 'account', label: 'Account Settings', icon: 'person-outline', route: 'AccountSettings' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'shield-checkmark-outline', route: 'PrivacyPolicy' },
  { id: 'help', label: 'Help & Support', icon: 'help-circle-outline', route: 'HelpSupport' },
  { id: 'about', label: 'About WallpaperX', icon: 'information-circle-outline', route: 'About' },
];

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
const StatItem = ({
  icon,
  value,
  label,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tint: string;
}) => (
  <View style={styles.stat}>
    <View style={[styles.statIcon, { backgroundColor: tint }]}>
      <Ionicons name={icon} size={18} color={colors.textPrimary} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MediaCard = ({
  icon,
  title,
  subtitle,
  tint,
  images,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tint: string;
  images: string[];
}) => (
  <Card style={styles.mediaCard} padding={spacing.lg} strong>
    <View style={styles.mediaHeader}>
      <View style={[styles.mediaIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={20} color={colors.textPrimary} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.mediaTitle}>{title}</Text>
        <Text style={styles.mediaSub}>{subtitle}</Text>
      </View>
      <Pressable style={styles.viewAll} hitSlop={6}>
        <Text style={styles.viewAllText}>View all</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
      </Pressable>
    </View>

    <View style={styles.thumbRow}>
      {images.slice(0, 5).map((uri, i) => (
        <Image key={i} source={{ uri }} style={styles.thumb} />
      ))}
    </View>
  </Card>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const ProfileScreen = ({ navigation }: { navigation: Nav }) => {
  const [favorites, setFavorites] = useState<string[]>(PROFILE.favorites);
  const [downloads, setDownloads] = useState<string[]>(PROFILE.downloads);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [fav, down] = await Promise.all([getFavorites(), getDownloads()]);

      const favImgs = (fav?.data ?? [])
        .map((x: Wallpaper) => x.imageUrl ?? x.thumbnailUrl)
        .filter(Boolean) as string[];
      const downImgs = (down?.data ?? [])
        .map((x: Wallpaper) => x.imageUrl ?? x.thumbnailUrl)
        .filter(Boolean) as string[];

      if (favImgs.length) setFavorites(favImgs);
      if (downImgs.length) setDownloads(downImgs);
    } catch (error) {
      // Keep the bundled placeholders if the backend isn't reachable.
      console.log('PROFILE ERROR', error);
    }
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
        >
          {/* settings gear */}
          <View style={styles.topBar}>
            <RoundButton
              icon="settings-outline"
              onPress={() => navigation.navigate('AccountSettings')}
            />
          </View>

          {/* avatar */}
          <View style={styles.avatarWrap}>
            <LinearGradient colors={gradients.violetMagenta} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Image source={{ uri: USER.avatar }} style={styles.avatar} />
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.name}>{USER.name}</Text>

          <LinearGradient colors={gradients.violetMagenta} style={styles.badge}>
            <MaterialCommunityIcons name="crown" size={14} color={colors.textPrimary} />
            <Text style={styles.badgeText}>{USER.tier}</Text>
          </LinearGradient>

          <Text style={styles.bio}>{USER.bio}</Text>

          {/* stats */}
          <View style={styles.statsRow}>
            {STATS.map(s => (
              <StatItem
                key={s.id}
                icon={s.icon}
                value={s.value}
                label={s.label}
                tint={s.tint}
              />
            ))}
          </View>

          {/* media cards */}
          <MediaCard
            icon="heart"
            title="My Favorites"
            subtitle="Your favorite wallpapers"
            tint={colors.chipPink}
            images={favorites}
          />
          <MediaCard
            icon="download-outline"
            title="Recent Downloads"
            subtitle="Your recently downloaded wallpapers"
            tint={colors.chipBlue}
            images={downloads}
          />

          {/* settings */}
          <Card style={styles.mediaCard} padding={0} strong>
            <Pressable
              style={styles.settingsHeader}
              onPress={() => navigation.navigate('AccountSettings')}
            >
              <LinearGradient colors={gradients.blueViolet} style={styles.settingsIcon}>
                <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.settingsTitle}>Settings</Text>
                <Text style={styles.settingsSub}>Customize your experience</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>

            <View style={styles.divider} />

            {SETTINGS_ROWS.map((row, i) => (
              <View key={row.id}>
                <Pressable
                  style={styles.settingRow}
                  onPress={() => navigation.navigate(row.route)}
                >
                  <Ionicons name={row.icon} size={20} color={colors.textSecondary} />
                  <Text style={styles.settingLabel}>{row.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
                {i < SETTINGS_ROWS.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ProfileScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },

  // avatar
  avatarWrap: { alignItems: 'center', marginTop: spacing.xs },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 22,
    elevation: 12,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 62,
    padding: 4,
    backgroundColor: colors.base,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 58 },

  name: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  badgeText: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  bio: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    marginTop: spacing.md,
  },

  // stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  stat: { alignItems: 'center', flex: 1 },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    marginBottom: spacing.sm,
  },
  statValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },

  // media cards
  mediaCard: { marginHorizontal: spacing.xl, marginTop: spacing.lg },
  mediaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  mediaIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  mediaSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  thumbRow: { flexDirection: 'row', gap: spacing.sm },
  thumb: {
    flex: 1,
    aspectRatio: 0.82,
    borderRadius: 12,
    backgroundColor: colors.glassFillSoft,
  },

  // settings
  settingsHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '800' },
  settingsSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
  },
  settingLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', flex: 1 },
});
