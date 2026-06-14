import React, { useEffect, useState } from 'react';

import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';

import { colors, gradients } from '../../styles/colors';

import { spacing, radius, SCREEN } from '../../utils/constants';

import { getFeaturedWallpapers } from '../../services/wallpaperService';

import { Wallpaper } from '../../services/types';

// -----------------------------

type Nav = {
  goBack?: () => void;
  navigate?: (name: string) => void;
};

const GOLD = '#F5C451';

const GOLD_GRADIENT = ['#F7D072', '#E0852B'] as const;

const CTA_GRADIENT = ['#EC4899', '#A855F7', '#3B82F6'] as const;

type Feature = {
  id: string;

  icon: keyof typeof Ionicons.glyphMap | '8K';

  title: string;

  subtitle: string;

  gradient: readonly [string, string];
};

const FEATURES: Feature[] = [
  {
    id: '1',
    icon: 'ban',
    title: 'Ad-Free',
    subtitle: 'No interruptions',
    gradient: ['#EC4899', '#A855F7'],
  },

  {
    id: '2',
    icon: '8K',
    title: '8K Downloads',
    subtitle: 'Ultra quality wallpapers',
    gradient: ['#3B82F6', '#6366F1'],
  },

  {
    id: '3',
    icon: 'star',
    title: 'Exclusive Content',
    subtitle: 'Premium creator wallpapers',
    gradient: ['#8B5CF6', '#EC4899'],
  },

  {
    id: '4',
    icon: 'flash',
    title: 'Early Access',
    subtitle: 'Try features first',
    gradient: ['#2563EB', '#22D3EE'],
  },
];

type Plan = 'monthly' | 'annual';

const LOCK_GAP = spacing.md;

const LOCK_W = (SCREEN.width - spacing.xl * 2 - LOCK_GAP * 2) / 3;

// FEATURE ROW

const FeatureRow = ({ item, last }: { item: Feature; last: boolean }) => (
  <View>
    <View style={styles.featureRow}>
      <LinearGradient colors={item.gradient} style={styles.featureIcon}>
        {item.icon === '8K' ? (
          <Text style={styles.featureIcon8k}>8K</Text>
        ) : (
          <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
        )}
      </LinearGradient>

      <View
        style={{
          flex: 1,
          marginLeft: spacing.md,
        }}
      >
        <Text style={styles.featureTitle}>{item.title}</Text>

        <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </View>

    {!last && <View style={styles.divider} />}
  </View>
);

// PLAN CARD

const PlanCard = ({
  selected,
  onPress,
  title,
  price,
  note,
  best,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  note: string;
  best?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.planWrap,
      selected && (best ? styles.glowGold : styles.glowViolet),
    ]}
  >
    <LinearGradient
      colors={
        selected
          ? best
            ? GOLD_GRADIENT
            : gradients.blueViolet
          : ['rgba(255,255,255,.1)', 'rgba(255,255,255,.05)']
      }
      style={styles.planBorder}
    >
      <BlurView intensity={32} tint="dark" style={styles.planGlass}>
        {best && (
          <LinearGradient colors={GOLD_GRADIENT} style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>BEST VALUE</Text>
          </LinearGradient>
        )}

        <Text style={styles.planTitle}>{title}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceCurrency}>₹</Text>

          <Text style={styles.priceValue}>{price}</Text>
        </View>

        <Text style={styles.planNote}>{note}</Text>
      </BlurView>
    </LinearGradient>
  </Pressable>
);

// LOCK TILE API IMAGE

const LockedTile = ({ item }: { item: Wallpaper }) => (
  <View style={styles.lockTile}>
    <ImageBackground
      source={{
        uri: item.imageUrl ?? item.thumbnailUrl ?? 'https://picsum.photos/400',
      }}
      style={{
        flex: 1,
      }}
    >
      <LinearGradient
        colors={['rgba(0,0,0,.1)', 'rgba(0,0,0,.7)']}
        style={StyleSheet.absoluteFill}
      />

      <BlurView intensity={24} tint="dark" style={styles.lockChip}>
        <Ionicons name="lock-closed" size={14} color="white" />
      </BlurView>
    </ImageBackground>
  </View>
);

const PremiumScreen = ({ navigation }: { navigation?: Nav }) => {
  const [plan, setPlan] = useState<Plan>('annual');

  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
      <MeshBackground variant="category" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 130,
          }}
        >
          <View style={styles.topBar}>
            <RoundButton
              icon="chevron-back"
              onPress={() => navigation?.goBack?.()}
            />
          </View>

          <View style={styles.crownWrap}>
            <LinearGradient colors={CTA_GRADIENT} style={styles.crownHalo}>
              <MaterialCommunityIcons name="crown" size={48} color="white" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>VividWalls Premium</Text>

          <Text style={styles.subtitle}>Unlock the best experience</Text>

          <Card
            style={{
              marginHorizontal: spacing.xl,
              marginTop: spacing.xxl,
            }}
            padding={spacing.lg}
          >
            {FEATURES.map((x, i) => (
              <FeatureRow
                key={x.id}
                item={x}
                last={i === FEATURES.length - 1}
              />
            ))}
          </Card>

          <View style={styles.lockGrid}>
            {wallpapers.slice(0, 6).map(x => (
              <LockedTile key={x.id} item={x} />
            ))}
          </View>

          {/* Get Premium Access CTA */}
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  topBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

  // crown + title
  crownWrap: { alignItems: 'center', marginTop: spacing.xs },
  crownHalo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
    elevation: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.lg,
    letterSpacing: -0.5,
  },
  titleAccent: { color: colors.accent },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // features
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon8k: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  featureTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  featureSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },

  // plans
  plansRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  planWrap: { flex: 1, borderRadius: radius.lg + 2 },
  glowGold: {
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  glowViolet: {
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  planBorder: { borderRadius: radius.lg + 2, padding: 1.5 },
  planGlass: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing.lg,
    minHeight: 168,
    backgroundColor: colors.glassFill,
  },
  bestBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  bestBadgeText: {
    color: colors.baseDeep,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  indicatorWrap: { position: 'absolute', top: spacing.lg, right: spacing.lg },
  indicatorOn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorOff: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  planTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 'auto',
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  priceCurrency: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  priceValue: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  pricePeriod: { color: colors.textSecondary, fontSize: 14, marginBottom: 6 },
  planNote: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.sm,
  },

  // locked grid
  lockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LOCK_GAP,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  lockTile: {
    width: LOCK_W,
    height: LOCK_W,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
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

  // CTA
  ctaWrap: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    borderRadius: radius.pill,
    shadowColor: colors.accentPink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 14,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 18,
    borderRadius: radius.pill,
  },
  ctaCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  ctaText: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  secureText: { color: colors.textSecondary, fontSize: 13 },
});
