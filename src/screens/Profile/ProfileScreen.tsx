import React, { useEffect, useState } from 'react';

import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';

import { colors, gradients } from '../../styles/colors';

import { spacing, radius } from '../../utils/constants';

import { getFavorites } from '../../services/favoriteService';

import { getDownloads } from '../../services/downloadService';

import { Wallpaper } from '../../services/types';

type Nav = {
  navigate: (name: string) => void;
};

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
  <Card
    style={{
      marginHorizontal: spacing.xl,
      marginTop: spacing.lg,
    }}
    padding={16}
  >
    <View style={styles.mediaHeader}>
      <View
        style={[
          styles.mediaIcon,
          {
            backgroundColor: tint,
          },
        ]}
      >
        <Ionicons name={icon} size={20} color={colors.textPrimary} />
      </View>

      <View
        style={{
          flex: 1,
          marginLeft: spacing.md,
        }}
      >
        <Text style={styles.mediaTitle}>{title}</Text>

        <Text style={styles.mediaSubtitle}>{subtitle}</Text>
      </View>
    </View>

    <View style={styles.thumbRow}>
      {images.map((uri, i) => (
        <Image
          key={i}
          source={{
            uri,
          }}
          style={styles.thumb}
        />
      ))}
    </View>
  </Card>
);

const ProfileScreen = ({ navigation }: { navigation: Nav }) => {
  const [favorites, setFavorites] = useState<Wallpaper[]>([]);

  const [downloads, setDownloads] = useState<Wallpaper[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const fav = await getFavorites();

      const down = await getDownloads();

      setFavorites(fav.data ?? []);

      setDownloads(down.data ?? []);
    } catch (error) {
      console.log('PROFILE ERROR', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.root,
          {
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 130,
          }}
        >
          <View style={styles.topBar}>
            <RoundButton
              icon="settings-outline"
              onPress={() => navigation.navigate('AccountSettings')}
            />
          </View>

          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={gradients.violetMagenta}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                <Image
                  source={{
                    uri: 'https://ui-avatars.com/api/?name=User',
                  }}
                  style={styles.avatar}
                />
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.name}>User</Text>

          <LinearGradient colors={gradients.violetMagenta} style={styles.badge}>
            <MaterialCommunityIcons
              name="crown"
              size={14}
              color={colors.textPrimary}
            />

            <Text style={styles.badgeText}>Free Member</Text>
          </LinearGradient>

          <Text style={styles.bio}>Premium Wallpaper Lover</Text>

          <View style={styles.statsRow}>
            <StatItem
              icon="heart"
              value={`${favorites.length}`}
              label="Favorites"
            />

            <StatItem
              icon="download-outline"
              value={`${downloads.length}`}
              label="Downloads"
            />

            <StatItem icon="images-outline" value="4K" label="Quality" />
          </View>

          <MediaCard
            icon="heart"
            title="My Favorites"
            subtitle="Saved wallpapers"
            images={favorites
              .slice(0, 4)
              .map(x => x.imageUrl ?? 'https://picsum.photos/200')}
            tint={colors.chipPink}
          />

          <MediaCard
            icon="download-outline"
            title="Recent Downloads"
            subtitle="Downloaded wallpapers"
            images={downloads
              .slice(0, 4)
              .map(x => x.imageUrl ?? 'https://picsum.photos/200')}
            tint={colors.chipBlue}
          />

          <Card
            style={{
              marginHorizontal: spacing.xl,
              marginTop: spacing.lg,
            }}
            padding={0}
          >
            <Pressable
              style={styles.settingRow}
              onPress={() => navigation.navigate('About')}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.textSecondary}
              />

              <Text style={styles.settingLabel}>About VividWalls</Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </Pressable>
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
    backgroundColor: colors.glassFillSoft,
    marginBottom: spacing.sm,
  },
  statValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },

  // media cards
  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
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
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.glassFillSoft,
  },

  // settings
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});
