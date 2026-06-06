import React from 'react';
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

type Nav = { navigate: (name: string) => void };

const StatItem = ({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) => (
  <View style={styles.stat}>
    <View style={styles.statIcon}>
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
  images,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  images: string[];
  tint: string;
}) => (
  <Card style={{ marginHorizontal: spacing.xl, marginTop: spacing.lg }} padding={16}>
    <View style={styles.mediaHeader}>
      <View style={[styles.mediaIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={20} color={colors.textPrimary} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.mediaTitle}>{title}</Text>
        <Text style={styles.mediaSubtitle}>{subtitle}</Text>
      </View>
      <Pressable style={styles.viewAll} hitSlop={8}>
        <Text style={styles.viewAllText}>View all</Text>
        <Ionicons name="chevron-forward" size={15} color={colors.textPrimary} />
      </Pressable>
    </View>
    <View style={styles.thumbRow}>
      {images.map((uri, i) => (
        <Image key={i} source={{ uri }} style={styles.thumb} />
      ))}
    </View>
  </Card>
);

const ProfileScreen = ({ navigation }: { navigation: Nav }) => {
  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
        >
          {/* settings button */}
          <View style={styles.topBar}>
            <RoundButton icon="settings-outline" />
          </View>

          {/* avatar with glow ring */}
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={gradients.violetMagenta}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                <Image source={{ uri: PROFILE.avatar }} style={styles.avatar} />
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.name}>{PROFILE.name}</Text>
          <LinearGradient
            colors={gradients.violetMagenta}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badge}
          >
            <MaterialCommunityIcons name="crown" size={14} color={colors.textPrimary} />
            <Text style={styles.badgeText}>{PROFILE.badge}</Text>
          </LinearGradient>
          <Text style={styles.bio}>{PROFILE.bio}</Text>

          {/* stats */}
          <View style={styles.statsRow}>
            {PROFILE.stats.map((s) => (
              <StatItem
                key={s.id}
                icon={s.icon as keyof typeof Ionicons.glyphMap}
                value={s.value}
                label={s.label}
              />
            ))}
          </View>

          <MediaCard
            icon="heart"
            title="My Favorites"
            subtitle="Your favorite wallpapers"
            images={PROFILE.favorites}
            tint={colors.chipPink}
          />
          <MediaCard
            icon="download-outline"
            title="Recent Downloads"
            subtitle="Your recently downloaded wallpapers"
            images={PROFILE.downloads}
            tint={colors.chipBlue}
          />

          {/* Settings */}
          <Card style={{ marginHorizontal: spacing.xl, marginTop: spacing.lg }} padding={0}>
            <View style={styles.settingsHeader}>
              <LinearGradient colors={gradients.blueViolet} style={styles.mediaIcon}>
                <Ionicons name="settings-sharp" size={20} color={colors.textPrimary} />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.mediaTitle}>Settings</Text>
                <Text style={styles.mediaSubtitle}>Customize your experience</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>

            <View style={styles.divider} />

            {PROFILE.settings.map((row, i) => (
              <Pressable
                key={row.id}
                style={styles.settingRow}
                onPress={() => {
                  if (row.label === 'About WallpaperX') navigation.navigate('About');
                }}
              >
                <Ionicons
                  name={row.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.settingLabel}>{row.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            ))}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ProfileScreen;

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
  bio: { color: colors.textSecondary, textAlign: 'center', fontSize: 15, marginTop: spacing.md },

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
    backgroundColor: colors.glassFillSoft,
    marginBottom: spacing.sm,
  },
  statValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },

  // media cards
  mediaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  mediaIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '800' },
  mediaSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  thumbRow: { flexDirection: 'row', justifyContent: 'space-between' },
  thumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: colors.glassFillSoft },

  // settings
  settingsHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginHorizontal: spacing.lg },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
  },
  settingLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', flex: 1 },
});
