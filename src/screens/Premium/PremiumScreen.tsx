import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ImageBackground,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';

import { colors } from '../../styles/colors';
import { spacing, radius, SCREEN } from '../../utils/constants';

import { getFeaturedWallpapers } from '../../services/wallpaperService';
import { Wallpaper } from '../../services/types';

type Nav = {
  goBack?: () => void;
  navigate?: (name: string) => void;
};

type Feature = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  gradient: readonly [string, string];
};

const premiumLogo = require('../../assets/images/premium-logo.png');
const proButtonIcon = require('../../assets/images/pro-button.png');

const CTA_GRADIENT = ['#EC4899', '#A855F7', '#3B82F6'] as const;

const HERO_AURA_GRADIENT = [
  'rgba(15, 15, 16, 0)',
  'rgba(15, 15, 16, 0.52)',
  'rgba(120, 36, 24, 0.34)',
  'rgba(185, 72, 42, 0.38)',
  'rgba(78, 16, 16, 0.34)',
  'rgba(15, 15, 16, 0)',
] as const;

const HERO_CORE_GRADIENT = [
  'rgba(251, 146, 60, 0.08)',
  'rgba(239, 68, 68, 0.22)',
  'rgba(180, 72, 44, 0.26)',
  'rgba(69, 10, 10, 0.34)',
  'rgba(10, 10, 12, 0.04)',
] as const;

const HERO_TOP_BLEND_GRADIENT = [
  'rgba(15, 15, 16, 0)',
  'rgba(120, 36, 24, 0.18)',
  'rgba(194, 65, 12, 0.26)',
  'rgba(15, 15, 16, 0)',
] as const;

const FEATURES: Feature[] = [
  {
    id: 'ad-free',
    icon: 'ban-outline',
    title: 'Ad-Free Experience',
    gradient: ['#EC4899', '#A855F7'],
  },
  {
    id: 'exclusive',
    icon: 'diamond-outline',
    title: 'Exclusive Wallpapers',
    gradient: ['#8B5CF6', '#EC4899'],
  },
  {
    id: '8k',
    icon: 'sparkles-outline',
    title: '8K Quality Downloads',
    gradient: ['#3B82F6', '#6366F1'],
  },
  {
    id: 'early',
    icon: 'flash-outline',
    title: 'Early Access',
    gradient: ['#14B8A6', '#22D3EE'],
  },
];

const FEATURE_ROWS: Feature[][] = [
  FEATURES.slice(0, 2),
  FEATURES.slice(2, 4),
];

const LOCK_GAP = spacing.md;
const LOCK_W = (SCREEN.width - spacing.xl * 2 - LOCK_GAP * 2) / 3;

const BENEFIT_GAP = spacing.md;

const FALLBACK_PREMIUM_WALLPAPERS = Array.from({
  length: 6,
}).map((_, index) => ({
  id: `premium-placeholder-${index + 1}`,
  title: `Premium ${index + 1}`,
  imageUrl: `https://picsum.photos/seed/flexiwalls-premium-${index + 1}/500/800`,
  thumbnailUrl: `https://picsum.photos/seed/flexiwalls-premium-thumb-${
    index + 1
  }/400/600`,
})) as Wallpaper[];

const GlitterProIcon = () => {
  const glitterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(glitterAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [glitterAnim]);

  const glowOpacity = glitterAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.25, 0.9, 0.25],
  });

  const glowScale = glitterAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 1.18, 0.9],
  });

  const sparkleOneOpacity = glitterAnim.interpolate({
    inputRange: [0, 0.18, 0.38, 1],
    outputRange: [0, 1, 0, 0],
  });

  const sparkleTwoOpacity = glitterAnim.interpolate({
    inputRange: [0, 0.42, 0.62, 1],
    outputRange: [0, 0, 1, 0],
  });

  const sparkleThreeOpacity = glitterAnim.interpolate({
    inputRange: [0, 0.66, 0.86, 1],
    outputRange: [0, 0, 1, 0],
  });

  const sparkleScale = glitterAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1.25, 0.6],
  });

  const sparkleRotate = glitterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const shineTranslateX = glitterAnim.interpolate({
    inputRange: [0, 0.35, 0.68, 1],
    outputRange: [-70, -70, 70, 70],
  });

  const shineOpacity = glitterAnim.interpolate({
    inputRange: [0, 0.35, 0.5, 0.68, 1],
    outputRange: [0, 0, 0.9, 0, 0],
  });

  return (
    <View style={styles.proIconWrap}>
      <Animated.View
        style={[
          styles.proIconGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <View style={styles.proImageBox}>
        <Image
          source={proButtonIcon}
          style={styles.proHeroIcon}
          resizeMode="contain"
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.proShine,
            {
              opacity: shineOpacity,
              transform: [{ translateX: shineTranslateX }, { rotate: '18deg' }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.95)',
              'rgba(253,230,138,0.78)',
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.proSparkle,
          styles.proSparkleOne,
          {
            opacity: sparkleOneOpacity,
            transform: [{ scale: sparkleScale }, { rotate: sparkleRotate }],
          },
        ]}
      >
        <Ionicons name="star" size={10} color="#FDE68A" />
      </Animated.View>

      <Animated.View
        style={[
          styles.proSparkle,
          styles.proSparkleTwo,
          {
            opacity: sparkleTwoOpacity,
            transform: [{ scale: sparkleScale }, { rotate: sparkleRotate }],
          },
        ]}
      >
        <Ionicons name="star" size={10} color="#FDE68A" />
      </Animated.View>

      <Animated.View
        style={[
          styles.proSparkle,
          styles.proSparkleThree,
          {
            opacity: sparkleThreeOpacity,
            transform: [{ scale: sparkleScale }, { rotate: sparkleRotate }],
          },
        ]}
      >
        <Ionicons name="star" size={10} color="#FDE68A" />
      </Animated.View>
    </View>
  );
};

const PremiumBenefitCard = ({ item }: { item: Feature }) => {
  return (
    <BlurView intensity={26} tint="dark" style={styles.benefitCard}>
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.14)',
          'rgba(255,255,255,0.055)',
          'rgba(15,15,16,0.7)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.benefitIcon}
      >
        <Ionicons name={item.icon} size={18} color={colors.textPrimary} />
      </LinearGradient>

      <Text
        style={styles.benefitTitle}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {item.title}
      </Text>
    </BlurView>
  );
};

const LockedTile = ({ item, index }: { item: Wallpaper; index: number }) => {
  const source =
    item.thumbnailUrl ||
    item.imageUrl ||
    `https://picsum.photos/seed/flexiwalls-premium-fallback-${index}/500/800`;

  return (
    <View style={styles.lockTile}>
      <ImageBackground source={{ uri: source }} style={styles.lockImage}>
        <LinearGradient
          colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.74)']}
          style={StyleSheet.absoluteFill}
        />

        <BlurView intensity={24} tint="dark" style={styles.lockChip}>
          <Ionicons
            name="lock-closed"
            size={14}
            color={colors.textPrimary}
          />
        </BlurView>
      </ImageBackground>
    </View>
  );
};

const PremiumScreen = ({ navigation }: { navigation?: Nav }) => {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const previewWallpapers = useMemo(() => {
    const data = wallpapers?.length ? wallpapers : FALLBACK_PREMIUM_WALLPAPERS;
    return data.slice(0, 6);
  }, [wallpapers]);

  const loadData = async () => {
    try {
      const res = await getFeaturedWallpapers();

      setWallpapers(res.data ?? []);
    } catch (e) {
      console.log('PREMIUM ERROR', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MeshBackground variant="category" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.homeHeader}>
            <View style={styles.homeActionRow}>
              <Image
                source={premiumLogo}
                style={styles.homeLogoLeft}
                resizeMode="contain"
              />

              <View style={styles.homeRightActions}>
                <Pressable
                  onPress={() => navigation?.navigate?.('Search')}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.homeRightButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <BlurView
                    intensity={30}
                    tint="dark"
                    style={styles.homeRoundButton}
                  >
                    <Ionicons
                      name="search"
                      size={20}
                      color={colors.textPrimary}
                    />
                  </BlurView>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.heroCard}>
            <LinearGradient
              colors={HERO_AURA_GRADIENT}
              locations={[0, 0.14, 0.34, 0.56, 0.78, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.heroAura}
            />

            <LinearGradient
              colors={HERO_CORE_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.heroCore}
            />

            <LinearGradient
              colors={HERO_TOP_BLEND_GRADIENT}
              locations={[0, 0.38, 0.72, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.heroTopBlend}
            />

            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />
            <View style={styles.heroGlowThree} />

            <View style={styles.heroTitleRow}>
              <GlitterProIcon />

              <Text
                style={styles.heroTitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                Get Unlimited Access
              </Text>
            </View>

            <View style={styles.benefitGrid}>
              {FEATURE_ROWS.map((row, rowIndex) => (
                <View key={`benefit-row-${rowIndex}`} style={styles.benefitRow}>
                  {row.map(item => (
                    <PremiumBenefitCard key={item.id} item={item} />
                  ))}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.sectionTitle}>Premium Preview</Text>

              <Text style={styles.sectionSubtitle}>
                Exclusive wallpapers waiting for you
              </Text>
            </View>

            <BlurView intensity={26} tint="dark" style={styles.lockedBadge}>
              <Ionicons
                name="lock-closed"
                size={13}
                color={colors.textPrimary}
              />

              <Text style={styles.lockedBadgeText}>Locked</Text>
            </BlurView>
          </View>

          <View style={styles.lockGrid}>
            {previewWallpapers.map((item, index) => (
              <LockedTile
                key={item.id ?? `premium-wallpaper-${index}`}
                item={item}
                index={index}
              />
            ))}
          </View>

          <Pressable
            onPress={() => navigation?.navigate?.('PremiumAccess')}
            style={({ pressed }) => [
              styles.ctaWrap,
              { transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <View style={styles.ctaCenter}>
                <MaterialCommunityIcons
                  name="crown"
                  size={22}
                  color={colors.textPrimary}
                />

                <Text style={styles.ctaText}>Get Premium Access</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textPrimary}
              />
            </LinearGradient>
          </Pressable>

          <View style={styles.secureRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={colors.textSecondary}
            />

            <Text style={styles.secureText}>
              Secure payment • Cancel anytime
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },
  safeArea: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 130,
  },

  homeHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 0,
  },
  homeActionRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'visible',
    marginBottom: -8,
  },
  homeLogoLeft: {
    width: 175,
    height: 120,
    marginLeft: -18,
    marginTop: 8,
  },
  homeRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },
  homeRightButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  homeRoundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },

  heroCard: {
    width: '100%',
    marginTop: spacing.xs,
    overflow: 'visible',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  heroAura: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: -76,
  },
  heroCore: {
    position: 'absolute',
    left: -42,
    right: -42,
    top: 10,
    bottom: -48,
    opacity: 0.95,
  },
  heroTopBlend: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 120,
  },
  heroGlowOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: 10,
    right: -90,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    bottom: -112,
    left: -92,
    backgroundColor: 'rgba(194, 65, 12, 0.22)',
  },
  heroGlowThree: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    top: 38,
    left: SCREEN.width * 0.22,
    backgroundColor: 'rgba(251, 146, 60, 0.09)',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  proIconWrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proIconGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(251, 191, 36, 0.32)',
  },
  proImageBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proHeroIcon: {
    width: 50,
    height: 50,
  },
  proShine: {
    position: 'absolute',
    top: -12,
    bottom: -12,
    width: 18,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  proSparkle: {
    position: 'absolute',
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FDE68A',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  proSparkleOne: {
    top: 3,
    right: 4,
  },
  proSparkleTwo: {
    bottom: 8,
    right: 0,
  },
  proSparkleThree: {
    top: 10,
    left: 0,
  },

  heroTitle: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  benefitGrid: {
    marginTop: spacing.xl,
    gap: BENEFIT_GAP,
  },
  benefitRow: {
    flexDirection: 'row',
    gap: BENEFIT_GAP,
  },
  benefitCard: {
    flex: 1,
    minHeight: 68,
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  benefitIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  benefitTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    marginTop: 2,
  },

  previewHeader: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedBadge: {
    height: 34,
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  lockedBadgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },

  lockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LOCK_GAP,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  lockTile: {
    width: LOCK_W,
    height: LOCK_W * 1.2,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  lockImage: {
    flex: 1,
  },
  lockChip: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  ctaWrap: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    borderRadius: radius.pill,
    shadowColor: colors.accentPink,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 14,
  },
  cta: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  ctaCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  ctaText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  secureText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});