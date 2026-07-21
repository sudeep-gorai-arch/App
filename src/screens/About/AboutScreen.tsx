import React from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors, gradients } from '../../styles/colors';
import { radius, spacing } from '../../utils/constants';

type Nav = {
  goBack?: () => void;
  navigate?: (screen: string) => void;
};

type Feature = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Action = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Developer = {
  id: string;
  name: string;
  role: string;
  description: string;
  initials: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  instagramUrl: string;
};

const appIcon = require('../../assets/images/app-icon.png');

const ABOUT_DATA = {
  appName: 'FlexiWalls',
  tagline: 'Premium wallpapers crafted for every screen.',
  version: '1.0.0',
  packageName: 'com.flexiwalls.app',
  copyright: '© 2026 FlexiWalls. All rights reserved.',
};

const FEATURES: Feature[] = [
  {
    id: 'quality',
    title: '4K Quality',
    subtitle: 'Sharp mobile-first wallpapers',
    icon: 'sparkles-outline',
  },
  {
    id: 'speed',
    title: 'Fast Downloads',
    subtitle: 'Save wallpapers quickly',
    icon: 'flash-outline',
  },
  {
    id: 'curated',
    title: 'Curated Picks',
    subtitle: 'Fresh categories and styles',
    icon: 'albums-outline',
  },
  {
    id: 'premium',
    title: 'Premium Feel',
    subtitle: 'Clean, dark and polished UI',
    icon: 'diamond-outline',
  },
];

const STATS = [
  { id: 'categories', value: '9+', label: 'Categories' },
  { id: 'quality', value: '4K', label: 'Wallpapers' },
  { id: 'access', value: 'Free', label: 'Guest Access' },
];

const DEVELOPERS: Developer[] = [
  {
    id: 'sudeep',
    name: 'Sudeep Gorai',
    role: 'UI/UX Design',
    description:
      'Designed the visual language, product experience and polished interface of FlexiWalls.',
    initials: 'SG',
    icon: 'color-palette-outline',
    gradient: ['#8B5CF6', '#D946EF'],
    instagramUrl: 'https://www.instagram.com/sudeep_gorain_?igsh=eXoydW00cWlndDR5',
  },
  {
    id: 'shubham',
    name: 'Shubham Dey',
    role: 'Backend, API Integration & DB Management',
    description:
      'Built and managed the backend services, API integrations and database systems powering the app.',
    initials: 'SD',
    icon: 'server-outline',
    gradient: ['#4F46E5', '#06B6D4'],
    instagramUrl: 'https://www.instagram.com/mr_shubham0623?igsh=MWg2YTBkb3h2dmE3dA==',
  },
];

const FeatureCard = ({ item }: { item: Feature }) => (
  <Card style={styles.featureCard} padding={spacing.md} borderRadius={radius.lg} strong>
    <View style={styles.featureIcon}>
      <Ionicons name={item.icon} size={24} color={colors.accent} />
    </View>

    <Text style={styles.featureTitle}>{item.title}</Text>
    <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
  </Card>
);

const StatCard = ({
  value,
  label,
  last,
}: {
  value: string;
  label: string;
  last: boolean;
}) => (
  <View style={[styles.statCard, !last && styles.statCardSpacing]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

const DeveloperCard = ({
  item,
  onInstagramPress,
}: {
  item: Developer;
  onInstagramPress: (url: string) => void;
}) => (
  <Card style={styles.developerCard} padding={0} borderRadius={radius.xl} strong>
    <LinearGradient
      colors={item.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.developerAccent}
    />

    <View style={styles.developerContent}>
      <View style={styles.developerTopRow}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.developerAvatar}
        >
          <Text style={styles.developerInitials}>{item.initials}</Text>
        </LinearGradient>

        <View style={styles.developerIdentity}>
          <Text style={styles.developerName}>{item.name}</Text>

          <View style={styles.roleRow}>
            <Ionicons name={item.icon} size={15} color={colors.accent} />
            <Text style={styles.developerRole}>{item.role}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.developerDescription}>{item.description}</Text>

      <Pressable
        onPress={() => onInstagramPress(item.instagramUrl)}
        android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
        style={({ pressed }) => [
          styles.instagramButton,
          { opacity: pressed ? 0.82 : 1 },
        ]}
      >
        <LinearGradient
          colors={['rgba(225,48,108,0.16)', 'rgba(131,58,180,0.16)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.instagramGradient}
        >
          <View style={styles.instagramIconWrap}>
            <Ionicons name="logo-instagram" size={21} color="#F472B6" />
          </View>

          <View style={styles.instagramCopy}>
            <Text style={styles.instagramTitle}>Instagram account</Text>
            <Text style={styles.instagramSubtitle}>View profile on Instagram</Text>
          </View>

          <Ionicons name="open-outline" size={19} color={colors.textSecondary} />
        </LinearGradient>
      </Pressable>
    </View>
  </Card>
);

const ActionRow = ({ item, last }: { item: Action; last: boolean }) => (
  <Pressable
    onPress={item.onPress}
    android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
    style={({ pressed }) => [styles.actionPress, { opacity: pressed ? 0.82 : 1 }]}
  >
    <View style={styles.actionRow}>
      <View style={styles.actionIcon}>
        <Ionicons name={item.icon} size={22} color={colors.accent} />
      </View>

      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{item.title}</Text>
        <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </View>

    {!last && <View style={styles.divider} />}
  </Pressable>
);

const AboutScreen = ({ navigation }: { navigation: Nav }) => {
  const shareApp = async () => {
    try {
      await Share.share({
        title: ABOUT_DATA.appName,
        message:
          'Check out FlexiWalls — a premium wallpaper app for beautiful Android screens.',
      });
    } catch (error) {
      console.log('Unable to share app:', error);
    }
  };

  const rateApp = async () => {
    const storeUrl = `https://play.google.com/store/apps/details?id=${ABOUT_DATA.packageName}`;
    const marketUrl = `market://details?id=${ABOUT_DATA.packageName}`;

    try {
      if (Platform.OS === 'android') {
        const canOpenMarket = await Linking.canOpenURL(marketUrl);
        await Linking.openURL(canOpenMarket ? marketUrl : storeUrl);
        return;
      }

      await Linking.openURL(storeUrl);
    } catch (error) {
      console.log('Unable to open store page:', error);
    }
  };

  const openInstagram = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('Unable to open Instagram:', error);
    }
  };

  const actions: Action[] = [
    {
      id: 'share',
      title: 'Share FlexiWalls',
      subtitle: 'Recommend the app to your friends',
      icon: 'share-social-outline',
      onPress: shareApp,
    },
    {
      id: 'rate',
      title: 'Rate App',
      subtitle: 'Support us with a Play Store rating',
      icon: 'star-outline',
      onPress: rateApp,
    },
  ];

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <RoundButton icon="chevron-back" onPress={() => navigation?.goBack?.()} />
          <Text style={styles.headerTitle}>About FlexiWalls</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Card style={styles.brandCard} padding={spacing.lg} borderRadius={radius.xl} strong>
            <View style={styles.brandSection}>
              <View style={styles.logoRing}>
                <Image source={appIcon} style={styles.appIcon} resizeMode="cover" />
              </View>

              <View style={styles.brandRight}>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.appName}>{ABOUT_DATA.appName}</Text>
                  <View style={styles.versionBadge}>
                    <Text style={styles.versionBadgeText}>v{ABOUT_DATA.version}</Text>
                  </View>
                </View>

                <Text style={styles.tagline}>{ABOUT_DATA.tagline}</Text>
              </View>
            </View>
          </Card>

          <View style={styles.statsRow}>
            {STATS.map((item, index) => (
              <StatCard
                key={item.id}
                value={item.value}
                label={item.label}
                last={index === STATS.length - 1}
              />
            ))}
          </View>

          <SectionHeader
            title="Built for wallpaper lovers"
            subtitle="Everything focused on a clean wallpaper browsing experience."
          />

          <View style={styles.featureGrid}>
            {FEATURES.map((item) => (
              <FeatureCard key={item.id} item={item} />
            ))}
          </View>

          <Card style={styles.storyCard} padding={spacing.lg} borderRadius={radius.xl} strong>
            <View style={styles.storyHeader}>
              <LinearGradient colors={gradients.violetMagenta} style={styles.storyIcon}>
                <Ionicons name="heart" size={22} color="#fff" />
              </LinearGradient>

              <View style={styles.storyTitleWrap}>
                <Text style={styles.storyTitle}>Our mission</Text>
                <Text style={styles.storySubtitle}>Simple. Premium. Personal.</Text>
              </View>
            </View>

            <Text style={styles.storyText}>
              FlexiWalls is designed to make your phone feel fresh every day with
              high-quality wallpapers, smooth browsing, easy downloads, favorites,
              trending picks and premium collections.
            </Text>
          </Card>

          <SectionHeader
            title="Know the developers"
            subtitle="The people shaping the experience and technology behind FlexiWalls."
          />

          <View style={styles.developerList}>
            {DEVELOPERS.map((item) => (
              <DeveloperCard
                key={item.id}
                item={item}
                onInstagramPress={openInstagram}
              />
            ))}
          </View>

          <SectionHeader title="More" />

          <Card style={styles.actionCard} padding={0} borderRadius={radius.xl} strong>
            {actions.map((item, index) => (
              <ActionRow
                key={item.id}
                item={item}
                last={index === actions.length - 1}
              />
            ))}
          </Card>

          <View style={styles.footer}>
            <Image source={appIcon} style={styles.footerIcon} resizeMode="cover" />
            <Text style={styles.footerName}>{ABOUT_DATA.appName}</Text>
            <Text style={styles.footerVersion}>Version {ABOUT_DATA.version}</Text>
            <Text style={styles.copyright}>{ABOUT_DATA.copyright}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  safe: {
    flex: 1,
  },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  headerSpacer: {
    width: 46,
    height: 46,
  },

  scrollContent: {
    paddingBottom: 130,
  },

  brandCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },

  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoRing: {
    width: 82,
    height: 82,
    borderRadius: 26,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },

  appIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },

  brandRight: {
    flex: 1,
    marginLeft: spacing.lg,
  },

  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  appName: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
  },

  versionBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
  },

  versionBadgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  tagline: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
    maxWidth: 250,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },

  statCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: radius.lg,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statCardSpacing: {
    marginRight: spacing.sm,
  },

  statValue: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '900',
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },

  sectionHeader: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },

  featureCard: {
    width: '48%',
    minHeight: 150,
    marginBottom: spacing.md,
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.20)',
  },

  featureTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.md,
  },

  featureSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  storyCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },

  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  storyIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  storyTitleWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },

  storyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },

  storySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },

  storyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 23,
    marginTop: spacing.lg,
  },

  developerList: {
    paddingHorizontal: spacing.xl,
  },

  developerCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },

  developerAccent: {
    height: 3,
    width: '100%',
  },

  developerContent: {
    padding: spacing.lg,
  },

  developerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  developerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },

  developerInitials: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  developerIdentity: {
    flex: 1,
    marginLeft: spacing.md,
  },

  developerName: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  developerRole: {
    flex: 1,
    color: colors.accent,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginLeft: 6,
  },

  developerDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    marginTop: spacing.lg,
  },

  instagramButton: {
    marginTop: spacing.lg,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244,114,182,0.18)',
  },

  instagramGradient: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  instagramIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },

  instagramCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },

  instagramTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },

  instagramSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  actionCard: {
    marginHorizontal: spacing.xl,
  },

  actionPress: {
    overflow: 'hidden',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },

  actionCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },

  actionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },

  actionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 78,
    backgroundColor: colors.divider,
  },

  footer: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },

  footerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },

  footerName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginTop: spacing.md,
  },

  footerVersion: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  copyright: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});