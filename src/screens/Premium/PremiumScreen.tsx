import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ImageBackground,
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

type Nav = { goBack?: () => void };

// Gold accent for the "Best Value" plan (kept local — not in the shared tokens).
const GOLD = '#F5C451';
const GOLD_GRADIENT = ['#F7D072', '#E0852B'] as const;
const CTA_GRADIENT = ['#EC4899', '#A855F7', '#3B82F6'] as const;

// ---------------------------------------------------------------------------
// Dummy data (local so the folder is self-contained)
// ---------------------------------------------------------------------------
const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`;

type Feature = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap | '8K';
  title: string;
  subtitle: string;
  gradient: readonly [string, string];
};

const FEATURES: Feature[] = [
  { id: 'p1', icon: 'ban', title: 'Ad-Free', subtitle: 'Enjoy an uninterrupted experience', gradient: ['#EC4899', '#A855F7'] },
  { id: 'p2', icon: '8K', title: '8K Downloads', subtitle: 'Access ultra high-resolution wallpapers', gradient: ['#3B82F6', '#6366F1'] },
  { id: 'p3', icon: 'star', title: 'Exclusive Creator Content', subtitle: "Unique wallpapers you won't find anywhere else", gradient: ['#8B5CF6', '#EC4899'] },
  { id: 'p4', icon: 'flash', title: 'Priority Feature Access', subtitle: 'Get early access to new features and tools', gradient: ['#2563EB', '#22D3EE'] },
];

type Plan = 'monthly' | 'annual';

const LOCKED = ['pl-lion', 'pl-cyber', 'pl-tiger', 'pl-saiyan', 'pl-wolf', 'pl-ronin'];
const LOCK_GAP = spacing.md;
const LOCK_W = (SCREEN.width - spacing.xl * 2 - LOCK_GAP * 2) / 3;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const FeatureRow = ({ item, last }: { item: Feature; last: boolean }) => (
  <View>
    <View style={styles.featureRow}>
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureIcon}
      >
        {item.icon === '8K' ? (
          <Text style={styles.featureIcon8k}>8K</Text>
        ) : (
          <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
        )}
      </LinearGradient>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.featureTitle}>{item.title}</Text>
        <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </View>
    {!last && <View style={styles.divider} />}
  </View>
);

const PlanCard = ({
  plan,
  selected,
  onSelect,
  title,
  price,
  period,
  note,
  bestValue,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: (p: Plan) => void;
  title: string;
  price: string;
  period: string;
  note: string;
  bestValue?: boolean;
}) => {
  const borderColors = selected
    ? bestValue
      ? GOLD_GRADIENT
      : gradients.blueViolet
    : (['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.05)'] as const);

  return (
    <Pressable
      style={[styles.planWrap, selected && (bestValue ? styles.glowGold : styles.glowViolet)]}
      onPress={() => onSelect(plan)}
    >
      <LinearGradient
        colors={borderColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.planBorder}
      >
        <BlurView intensity={32} tint="dark" style={styles.planGlass}>
          {bestValue && (
            <LinearGradient colors={GOLD_GRADIENT} style={styles.bestBadge}>
              <Text style={styles.bestBadgeText}>BEST VALUE</Text>
            </LinearGradient>
          )}

          {/* selection indicator */}
          <View style={styles.indicatorWrap}>
            {selected ? (
              <View
                style={[
                  styles.indicatorOn,
                  { backgroundColor: bestValue ? GOLD : colors.accentStrong },
                ]}
              >
                <Ionicons name="checkmark" size={14} color={colors.baseDeep} />
              </View>
            ) : (
              <View style={styles.indicatorOff} />
            )}
          </View>

          <Text style={styles.planTitle}>{title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>₹</Text>
            <Text style={styles.priceValue}>{price}</Text>
            <Text style={styles.pricePeriod}> / {period}</Text>
          </View>
          <Text style={[styles.planNote, bestValue && { color: GOLD }]}>{note}</Text>
        </BlurView>
      </LinearGradient>
    </Pressable>
  );
};

const LockedTile = ({ seed }: { seed: string }) => (
  <View style={styles.lockTile}>
    <ImageBackground
      source={{ uri: img(seed) }}
      style={{ flex: 1 }}
      imageStyle={{ borderRadius: radius.md }}
    >
      <LinearGradient
        colors={['rgba(8,6,20,0.1)', 'rgba(8,6,20,0.55)']}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
      />
      <BlurView intensity={24} tint="dark" style={styles.lockChip}>
        <Ionicons name="lock-closed" size={14} color={colors.textPrimary} />
      </BlurView>
    </ImageBackground>
  </View>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const PremiumScreen = ({ navigation }: { navigation?: Nav }) => {
  const [plan, setPlan] = useState<Plan>('annual');

  return (
    <View style={styles.root}>
      <MeshBackground variant="category" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
        >
          {/* back */}
          <View style={styles.topBar}>
            <RoundButton icon="chevron-back" onPress={() => navigation?.goBack?.()} />
          </View>

          {/* crown + title */}
          <View style={styles.crownWrap}>
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.crownHalo}
            >
              <MaterialCommunityIcons name="crown" size={48} color={colors.textPrimary} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>
            WallpaperX <Text style={styles.titleAccent}>Premium</Text>
          </Text>
          <Text style={styles.subtitle}>Elevate your screen. Experience the best.</Text>

          {/* features */}
          <Card style={{ marginHorizontal: spacing.xl, marginTop: spacing.xxl }} padding={spacing.lg}>
            {FEATURES.map((f, i) => (
              <FeatureRow key={f.id} item={f} last={i === FEATURES.length - 1} />
            ))}
          </Card>

          {/* plans */}
          <View style={styles.plansRow}>
            <PlanCard
              plan="monthly"
              selected={plan === 'monthly'}
              onSelect={setPlan}
              title="Monthly"
              price="49"
              period="month"
              note="Billed monthly"
            />
            <PlanCard
              plan="annual"
              selected={plan === 'annual'}
              onSelect={setPlan}
              title="Annual"
              price="329"
              period="year"
              note="Save 44% · Billed yearly"
              bestValue
            />
          </View>

          {/* locked preview grid */}
          <View style={styles.lockGrid}>
            {LOCKED.map((seed) => (
              <LockedTile key={seed} seed={seed} />
            ))}
          </View>

          {/* CTA */}
          <Pressable
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
              <MaterialCommunityIcons name="crown" size={22} color={colors.textPrimary} />
              <Text style={styles.ctaText}>Get Premium Access</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
            </LinearGradient>
          </Pressable>

          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.secureText}>Secure payment · Cancel anytime</Text>
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
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
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
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },

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
  bestBadgeText: { color: colors.baseDeep, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
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
  planTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 'auto' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  priceCurrency: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  priceValue: { color: colors.textPrimary, fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  pricePeriod: { color: colors.textSecondary, fontSize: 14, marginBottom: 6 },
  planNote: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: spacing.sm },

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
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: 18,
    borderRadius: radius.pill,
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
