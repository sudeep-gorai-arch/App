import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';

import { colors, gradients } from '../../styles/colors';

import { spacing, radius } from '../../utils/constants';

import { useAuth } from '../../context/AuthContext';

import { getDownloads } from '../../services/downloadService';

import { Wallpaper } from '../../services/types';

type Props = {
  navigation: any;
};

export default function ProfileScreen({ navigation }: Props) {
  const { user, loading, authLoading, signInGoogle } = useAuth();

  const [refreshing, setRefreshing] = useState(false);

  const [downloads, setDownloads] = useState<string[]>([]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good Morning';

    if (hour < 17) return 'Good Afternoon';

    return 'Good Evening';
  }, []);

  const loadDownloads = async () => {
    if (!user) return;

    try {
      const res = await getDownloads();

      const images = (res?.data ?? [])
        .map((wall: Wallpaper) => wall.imageUrl ?? wall.thumbnailUrl)
        .filter(Boolean) as string[];

      setDownloads(images);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    loadDownloads();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    await loadDownloads();

    setRefreshing(false);
  }, [user]);

  const openPremium = () => {
    navigation.navigate('ManagePremium');
  };

  const openSettings = () => {
    navigation.navigate('Settings');
  };

  const openDownloads = () => {
    navigation.navigate('Downloads');
  };

  const openFavorites = () => {
    navigation.navigate('Favorites');
  };

  const openEditProfile = () => {
    navigation.navigate('EditPersonalInfo');
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          contentContainerStyle={styles.content}
        >
          {/* Header */}

          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>

              <Text style={styles.username}>
                {user ? user.username : 'Guest'}
              </Text>
            </View>

            <Pressable style={styles.settingsButton} onPress={openSettings}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Premium Banner */}

          <Pressable onPress={openPremium}>
            <LinearGradient
              colors={gradients.violetMagenta}
              style={styles.premiumCard}
            >
              <View style={styles.premiumLeft}>
                <MaterialCommunityIcons
                  name="crown"
                  size={32}
                  color="#FFD54F"
                />

                <View style={{ marginLeft: 14 }}>
                  <Text style={styles.premiumTitle}>Go Premium</Text>

                  <Text style={styles.premiumSubtitle}>
                    Unlimited downloads • 4K Exclusive Wallpapers
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={22} color="#fff" />
            </LinearGradient>
          </Pressable>

          {/* Guest */}

          {!user && (
            <Card style={styles.card} padding={24} strong>
              <View style={styles.googleHeader}>
                <Ionicons
                  name="cloud-done-outline"
                  size={48}
                  color={colors.accent}
                />

                <Text style={styles.cardTitle}>Sync your Wallpapers</Text>

                <Text style={styles.cardDescription}>
                  Save favourites, downloads and premium access across all your
                  devices.
                </Text>
              </View>

              <Pressable
                style={styles.googleButton}
                disabled={authLoading}
                onPress={signInGoogle}
              >
                {authLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={22} color="#fff" />

                    <Text style={styles.googleText}>Continue with Google</Text>
                  </>
                )}
              </Pressable>
            </Card>
          )}

          {/* Logged User */}

          {user && (
            <>
              <Card style={styles.card} padding={20} strong>
                <View style={styles.profileRow}>
                  <Image
                    source={{
                      uri: user.avatarUrl || 'https://i.pravatar.cc/300',
                    }}
                    style={styles.avatar}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{user.username}</Text>

                    <Text style={styles.profileEmail}>{user.email}</Text>

                    <View style={styles.memberBadge}>
                      <MaterialCommunityIcons
                        name={user.isPremium ? 'crown' : 'account'}
                        size={14}
                        color="#FFD54F"
                      />

                      <Text style={styles.memberText}>
                        {user.isPremium ? 'Premium Member' : 'Free Member'}
                      </Text>
                    </View>
                  </View>

                  <Pressable onPress={openEditProfile}>
                    <Ionicons
                      name="create-outline"
                      size={22}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </Card>

              {/* Quick Actions */}

              <View style={styles.quickRow}>
                <Pressable style={styles.quickCard} onPress={openFavorites}>
                  <Ionicons name="heart" size={28} color="#FF4D6D" />

                  <Text style={styles.quickTitle}>Favorites</Text>
                </Pressable>

                <Pressable style={styles.quickCard} onPress={openDownloads}>
                  <Ionicons name="download" size={28} color="#4FC3F7" />

                  <Text style={styles.quickTitle}>Downloads</Text>
                </Pressable>
              </View>

              {/* Recent Downloads */}

              <Card style={styles.card} padding={20} strong>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Downloads</Text>

                  <Pressable onPress={openDownloads}>
                    <Text style={styles.viewAll}>View All</Text>
                  </Pressable>
                </View>

                {downloads.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons
                      name="download-outline"
                      size={42}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.emptyText}>No downloads yet</Text>
                  </View>
                ) : (
                  <View style={styles.downloadGrid}>
                    {downloads.slice(0, 4).map((img, index) => (
                      <Image
                        key={index}
                        source={{ uri: img }}
                        style={styles.thumb}
                      />
                    ))}
                  </View>
                )}
              </Card>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  safe: {
    flex: 1,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.base,
  },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },

  /* ---------- Header ---------- */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },

  greeting: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },

  username: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  settingsButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---------- Premium ---------- */

  premiumCard: {
    borderRadius: 26,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  premiumTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },

  premiumSubtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },

  /* ---------- Card ---------- */

  card: {
    marginBottom: 22,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 15,
  },

  cardDescription: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
    fontSize: 15,
  },

  googleHeader: {
    alignItems: 'center',
    marginBottom: 22,
  },

  googleButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },

  googleText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  /* ---------- Profile ---------- */

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginRight: 16,
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },

  profileEmail: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 14,
  },

  memberBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  memberText: {
    marginLeft: 6,
    color: '#FFD54F',
    fontWeight: '700',
    fontSize: 13,
  },

  /* ---------- Quick ---------- */

  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  quickCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,.05)',
    borderRadius: 22,
    paddingVertical: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  quickTitle: {
    color: colors.textPrimary,
    marginTop: 12,
    fontWeight: '700',
    fontSize: 15,
  },

  /* ---------- Downloads ---------- */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },

  viewAll: {
    color: colors.accent,
    fontWeight: '700',
  },

  downloadGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  thumb: {
    width: '23%',
    aspectRatio: 0.65,
    borderRadius: 16,
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  emptyText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 15,
  },
});
