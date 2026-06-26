import React, { useEffect, useMemo, useState, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
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

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
};

const MenuItem = ({ icon, title, subtitle, onPress }: MenuItemProps) => (
  <Pressable
    style={styles.menuItem}
    android_ripple={{
      color: 'rgba(255,255,255,.05)',
    }}
    onPress={onPress}
  >
    <View style={styles.menuIcon}>
      <Ionicons name={icon} size={22} color={colors.accent} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={styles.menuTitle}>{title}</Text>

      {!!subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>

    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
  </Pressable>
);

const QuickAction = ({ icon, title, onPress }: QuickActionProps) => (
  <Pressable style={styles.quickCard} onPress={onPress}>
    <View style={styles.quickIcon}>
      <Ionicons name={icon} size={26} color={colors.accent} />
    </View>

    <Text style={styles.quickTitle}>{title}</Text>
  </Pressable>
);

export default function ProfileScreen({ navigation }: Props) {
  const { user, loading, authLoading, signInGoogle, logout } = useAuth();

  const [downloads, setDownloads] = useState<string[]>([]);

  const [refreshing, setRefreshing] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good Morning';

    if (hour < 17) return 'Good Afternoon';

    return 'Good Evening';
  }, []);

  useEffect(() => {
    if (user) {
      loadDownloads();
    }
  }, [user]);

  const loadDownloads = async () => {
    try {
      const res = await getDownloads();

      const images = (res?.data ?? [])
        .map((x: Wallpaper) => x.imageUrl ?? x.thumbnailUrl)
        .filter(Boolean) as string[];

      setDownloads(images);
    } catch (err) {
      console.log(err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    if (user) {
      await loadDownloads();
    }

    setRefreshing(false);
  }, [user]);

  const openSettings = () => navigation.navigate('Settings');

  const openFavorites = () => navigation.navigate('Favorites');

  const openDownloads = () => navigation.navigate('Downloads');

  const openPremium = () => navigation.navigate('Subscription');

  const openEditProfile = () => navigation.navigate('EditProfile');

  const openHelp = () => navigation.navigate('HelpSupport');

  const openPrivacy = () => navigation.navigate('PrivacyPolicy');

  const openAbout = () => navigation.navigate('About');

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

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        >
          {/* ================= HEADER ================= */}

          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>

              <Text style={styles.username}>
                {user ? user.username : 'Guest'}
              </Text>
            </View>

            <Pressable style={styles.settingsBtn} onPress={openSettings}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* ================= PREMIUM BANNER ================= */}

          {!user?.isPremium && (
            <LinearGradient
              colors={gradients.violetMagenta}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={styles.premiumBanner}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>👑 Upgrade to Premium</Text>

                <Text style={styles.premiumSubtitle}>
                  Unlimited downloads, exclusive wallpapers, zero ads and early
                  access.
                </Text>

                <Pressable style={styles.upgradeButton} onPress={openPremium}>
                  <Text style={styles.upgradeText}>Upgrade Now</Text>
                </Pressable>
              </View>

              <MaterialCommunityIcons
                name="crown"
                size={70}
                color="rgba(255,255,255,.18)"
              />
            </LinearGradient>
          )}

          {/* ================= GUEST CARD ================= */}

          {!user && (
            <Card style={styles.card} padding={24} strong>
              <View
                style={{
                  alignItems: 'center',
                }}
              >
                <LinearGradient
                  colors={gradients.violetMagenta}
                  style={styles.googleIconWrap}
                >
                  <Ionicons name="person" size={48} color="#fff" />
                </LinearGradient>

                <Text style={styles.cardTitle}>Create your account</Text>

                <Text style={styles.cardSubtitle}>
                  Save favorites, synchronize downloads and access premium
                  features across all your devices.
                </Text>

                <Pressable
                  disabled={authLoading}
                  style={styles.googleButton}
                  onPress={signInGoogle}
                >
                  {authLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={22} color="#fff" />

                      <Text style={styles.googleText}>
                        Continue with Google
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </Card>
          )}

          {/* ================= PROFILE CARD ================= */}

          {user && (
            <Card style={styles.card} padding={20} strong>
              <Pressable onPress={openEditProfile}>
                <View style={styles.profileRow}>
                  <Image
                    source={{
                      uri:
                        user.avatarUrl ||
                        `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(
                          user.username,
                        )}`,
                    }}
                    style={styles.avatar}
                  />

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text style={styles.profileName}>{user.username}</Text>

                    <Text style={styles.profileEmail}>{user.email}</Text>

                    <View style={styles.memberBadge}>
                      <MaterialCommunityIcons
                        name="crown"
                        size={14}
                        color="#FFD54F"
                      />

                      <Text style={styles.memberText}>
                        {user.isPremium ? 'Premium Member' : 'Free Member'}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            </Card>
          )}

          {/* ================= QUICK ACTIONS ================= */}

          {user && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <View style={styles.quickGrid}>
                  <QuickAction
                    icon="heart-outline"
                    title="Favorites"
                    onPress={openFavorites}
                  />

                  <QuickAction
                    icon="download-outline"
                    title="Downloads"
                    onPress={openDownloads}
                  />

                  <QuickAction
                    icon="diamond-outline"
                    title="Premium"
                    onPress={openPremium}
                  />

                  <QuickAction
                    icon="settings-outline"
                    title="Settings"
                    onPress={openSettings}
                  />
                </View>
              </View>

              {/* ================= RECENT DOWNLOADS ================= */}

              <Card style={styles.card} padding={20} strong>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Recent Downloads</Text>

                    <Text style={styles.downloadCount}>
                      {downloads.length} Wallpaper
                      {downloads.length !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <Pressable onPress={openDownloads}>
                    <Text style={styles.viewAll}>View All</Text>
                  </Pressable>
                </View>

                {downloads.length === 0 ? (
                  <View style={styles.emptyDownloads}>
                    <Ionicons
                      name="download-outline"
                      size={55}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.emptyTitle}>No Downloads Yet</Text>

                    <Text style={styles.emptySubtitle}>
                      Wallpapers you download will appear here.
                    </Text>

                    <Pressable
                      style={styles.browseButton}
                      onPress={() => navigation.navigate('MainTabs')}
                    >
                      <Text style={styles.browseText}>Browse Wallpapers</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View style={styles.downloadGrid}>
                      {downloads.slice(0, 4).map((image, index) => (
                        <Image
                          key={index}
                          source={{
                            uri: image,
                          }}
                          style={styles.wallpaper}
                        />
                      ))}
                    </View>

                    {downloads.length > 4 && (
                      <Pressable
                        style={styles.moreDownloads}
                        onPress={openDownloads}
                      >
                        <Text style={styles.moreText}>
                          +{downloads.length - 4} More Wallpapers
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </Card>
            </>
          )}

          {/* ================= MENU ================= */}

          <Card style={styles.card} padding={0} strong>
            <MenuItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="FAQs, Contact us"
              onPress={openHelp}
            />

            <MenuItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              subtitle="Terms & Privacy"
              onPress={openPrivacy}
            />

            <MenuItem
              icon="information-circle-outline"
              title="About FlexiWalls"
              subtitle="Version, Licenses"
              onPress={openAbout}
            />

            {user && (
              <MenuItem
                icon="log-out-outline"
                title="Logout"
                subtitle="Sign out from this device"
                onPress={logout}
              />
            )}
          </Card>

          {/* ================= VERSION ================= */}

          <View style={styles.footer}>
            <Image
              source={require('../../assets/icons/profileicon.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />

            <Text style={styles.footerTitle}>FlexiWalls</Text>

            <Text style={styles.footerVersion}>Version 1.0.0</Text>

            <Text style={styles.footerCopyright}>© 2026 FlexiWalls</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ================= Root ================= */

  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  loader: {
    flex: 1,
    backgroundColor: colors.base,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ================= Header ================= */

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  greeting: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  username: {
    marginTop: 6,

    color: '#fff',

    fontSize: 34,

    fontWeight: '900',

    letterSpacing: 0.3,
  },

  settingsBtn: {
    width: 56,

    height: 56,

    borderRadius: 28,

    backgroundColor: 'rgba(255,255,255,.08)',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,.08)',
  },

  /* ================= Common ================= */

  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },

  /* ================= Premium Banner ================= */

  premiumBanner: {
    marginHorizontal: spacing.xl,

    marginTop: spacing.lg,

    borderRadius: 26,

    padding: 24,

    flexDirection: 'row',

    alignItems: 'center',

    overflow: 'hidden',
  },

  premiumTitle: {
    color: '#fff',

    fontSize: 22,

    fontWeight: '900',
  },

  premiumSubtitle: {
    color: 'rgba(255,255,255,.92)',

    marginTop: 10,

    lineHeight: 22,

    width: '88%',
  },

  upgradeButton: {
    alignSelf: 'flex-start',

    marginTop: 18,

    backgroundColor: '#fff',

    paddingHorizontal: 18,

    height: 42,

    borderRadius: 21,

    alignItems: 'center',

    justifyContent: 'center',
  },

  upgradeText: {
    color: colors.accent,

    fontWeight: '800',

    fontSize: 14,
  },

  /* ================= Guest Card ================= */

  googleIconWrap: {
    width: 90,

    height: 90,

    borderRadius: 45,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 18,
  },

  cardTitle: {
    color: '#fff',

    fontSize: 24,

    fontWeight: '900',

    textAlign: 'center',
  },

  cardSubtitle: {
    color: colors.textSecondary,

    textAlign: 'center',

    marginTop: 12,

    lineHeight: 22,

    fontSize: 15,

    marginBottom: 24,
  },

  googleButton: {
    width: '100%',

    height: 56,

    borderRadius: 18,

    backgroundColor: '#111827',

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,.08)',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 12,
  },

  googleText: {
    color: '#fff',

    fontSize: 16,

    fontWeight: '800',
  },

  /* ================= PROFILE CARD ================= */

  profileRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  avatar: {
    width: 76,

    height: 76,

    borderRadius: 38,

    backgroundColor: '#222',
  },

  profileName: {
    color: '#fff',

    fontSize: 22,

    fontWeight: '900',

    marginLeft: 16,
  },

  profileEmail: {
    color: colors.textSecondary,

    marginTop: 5,

    marginLeft: 16,

    fontSize: 14,
  },

  memberBadge: {
    marginTop: 12,

    marginLeft: 16,

    alignSelf: 'flex-start',

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,.08)',

    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 30,
  },

  memberText: {
    marginLeft: 6,

    color: '#FFD54F',

    fontWeight: '700',

    fontSize: 13,
  },

  /* ================= SECTION ================= */

  section: {
    marginTop: spacing.xl,

    paddingHorizontal: spacing.xl,
  },

  sectionTitle: {
    color: '#fff',

    fontSize: 22,

    fontWeight: '900',

    marginBottom: 18,
  },

  /* ================= QUICK ACTIONS ================= */

  quickGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',
  },

  quickCard: {
    width: '48%',

    height: 120,

    marginBottom: 16,

    borderRadius: 22,

    backgroundColor: 'rgba(255,255,255,.05)',

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,.06)',

    alignItems: 'center',

    justifyContent: 'center',
  },

  quickIcon: {
    width: 56,

    height: 56,

    borderRadius: 18,

    backgroundColor: 'rgba(255,255,255,.08)',

    alignItems: 'center',

    justifyContent: 'center',
  },

  quickTitle: {
    marginTop: 12,

    color: '#fff',

    fontWeight: '700',

    fontSize: 15,
  },

  /* ================= DOWNLOADS ================= */

  sectionHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

  downloadCount: {
    color: colors.textSecondary,

    marginTop: 4,

    fontSize: 13,
  },

  viewAll: {
    color: colors.accent,

    fontWeight: '800',

    fontSize: 15,
  },

  downloadGrid: {
    marginTop: 20,

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',
  },

  wallpaper: {
    width: '48%',

    aspectRatio: 0.68,

    borderRadius: 18,

    marginBottom: 14,

    backgroundColor: '#1d1d1d',
  },

  moreDownloads: {
    marginTop: 5,

    alignItems: 'center',
  },

  moreText: {
    color: colors.accent,

    fontWeight: '700',
  },

  /* ================= EMPTY DOWNLOAD ================= */

  emptyDownloads: {
    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 30,
  },

  emptyTitle: {
    marginTop: 15,

    color: '#fff',

    fontWeight: '800',

    fontSize: 18,
  },

  emptySubtitle: {
    marginTop: 10,

    color: colors.textSecondary,

    textAlign: 'center',

    lineHeight: 22,

    marginBottom: 22,
  },

  browseButton: {
    backgroundColor: colors.accent,

    paddingHorizontal: 24,

    height: 46,

    borderRadius: 23,

    alignItems: 'center',

    justifyContent: 'center',
  },

  browseText: {
    color: '#fff',

    fontWeight: '800',
  },

  /* ================= MENU ================= */

  menuItem: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 20,

    paddingVertical: 18,

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: 'rgba(255,255,255,.06)',
  },

  menuIcon: {
    width: 46,

    height: 46,

    borderRadius: 23,

    backgroundColor: 'rgba(255,255,255,.06)',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 16,
  },

  menuTitle: {
    color: '#fff',

    fontSize: 16,

    fontWeight: '700',
  },

  menuSubtitle: {
    color: colors.textSecondary,

    fontSize: 13,

    marginTop: 4,
  },

  /* ================= FOOTER ================= */

  footer: {
    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 45,

    paddingHorizontal: 30,
  },

  footerLogo: {
    width: 70,

    height: 70,

    borderRadius: 20,

    marginBottom: 14,
  },

  footerTitle: {
    color: '#fff',

    fontSize: 22,

    fontWeight: '900',

    letterSpacing: 0.5,
  },

  footerVersion: {
    marginTop: 8,

    color: colors.textSecondary,

    fontSize: 14,
  },

  footerCopyright: {
    marginTop: 6,

    color: colors.textSecondary,

    fontSize: 12,

    opacity: 0.7,
  },
});
