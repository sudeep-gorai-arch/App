import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors, gradients } from '../../styles/colors';
import { spacing, radius, SCREEN } from '../../utils/constants';
import { RootStackParamList } from '../../navigation/RootStackParamList';

type Props = NativeStackScreenProps<RootStackParamList, 'PremiumAccess'>;

const CTA_GRADIENT = ['#EC4899', '#A855F7', '#3B82F6'] as const;

const BENEFIT_GAP = spacing.md;
const BENEFIT_W = (SCREEN.width - spacing.xl * 2 - BENEFIT_GAP) / 2;

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
type Benefit = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap | 'infinite';
  title: string;
  subtitle: string;
  tint: string;
  color: string;
};

const BENEFITS: Benefit[] = [
  {
    id: 'unlimited',
    icon: 'infinite',
    title: 'Unlimited Downloads',
    subtitle: 'Download as many wallpapers as you want.',
    tint: 'rgba(139,92,246,0.2)',
    color: colors.accent,
  },
  {
    id: 'adfree',
    icon: 'close-circle-outline',
    title: 'Ad-Free Experience',
    subtitle: 'Enjoy the app without any interruptions.',
    tint: 'rgba(236,72,153,0.18)',
    color: colors.accentPink,
  },
  {
    id: 'exclusive',
    icon: 'diamond-outline',
    title: 'Exclusive Content',
    subtitle: "Access premium wallpapers you won't find anywhere else.",
    tint: 'rgba(96,165,250,0.18)',
    color: colors.accentBlue,
  },
  {
    id: 'quality',
    icon: 'ribbon-outline',
    title: 'Premium Quality',
    subtitle: '8K, 4K and high quality wallpapers only for you.',
    tint: 'rgba(52,211,153,0.16)',
    color: '#34D399',
  },
  {
    id: 'early',
    icon: 'lock-closed-outline',
    title: 'Early Access',
    subtitle: 'Be the first to explore new collections and features.',
    tint: 'rgba(249,115,22,0.16)',
    color: '#F59E0B',
  },
  {
    id: 'cloud',
    icon: 'cloud-outline',
    title: 'Cloud Favorites',
    subtitle: 'Save your favorites and access them anywhere.',
    tint: 'rgba(139,92,246,0.2)',
    color: colors.accent,
  },
];

type PlanId = 'monthly' | 'annual' | 'lifetime';

type Plan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  best?: boolean;
  save?: string;
  perks: string[];
};

const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$3.99',
    period: 'per month',
    perks: ['Billed monthly', 'Cancel anytime', 'All premium benefits'],
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$19.99',
    period: 'per year',
    best: true,
    save: 'Save 58%',
    perks: ['Billed yearly', 'Cancel anytime', 'All premium benefits'],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$59.99',
    period: 'one-time payment',
    perks: ['One-time payment', 'Lifetime access', 'All premium benefits'],
  },
];

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
const BenefitCard = ({ item }: { item: Benefit }) => (
  <View style={styles.benefit}>
    <View style={[styles.benefitIcon, { backgroundColor: item.tint }]}>
      {item.icon === 'infinite' ? (
        <MaterialCommunityIcons name="infinity" size={22} color={item.color} />
      ) : (
        <Ionicons name={item.icon} size={22} color={item.color} />
      )}
    </View>
    <Text style={styles.benefitTitle}>{item.title}</Text>
    <Text style={styles.benefitSub}>{item.subtitle}</Text>
  </View>
);

const PlanCard = ({
  plan,
  selected,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
}) => {
  const body = (
    <View style={[styles.planInner, plan.best && { paddingTop: spacing.xl }]}>
      {plan.best ? (
        <LinearGradient colors={gradients.violetMagenta} style={styles.bestBadge}>
          <Text style={styles.bestBadgeText}>BEST VALUE</Text>
        </LinearGradient>
      ) : null}

      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.planPrice}>{plan.price}</Text>
      <Text style={styles.planPeriod}>{plan.period}</Text>

      {plan.save ? (
        <View style={styles.savePill}>
          <Text style={styles.saveText}>{plan.save}</Text>
        </View>
      ) : null}

      <View style={styles.perks}>
        {plan.perks.map(p => (
          <View key={p} style={styles.perkRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.accentPink} />
            <Text style={styles.perkText}>{p}</Text>
          </View>
        ))}
      </View>

      <View style={styles.radioWrap}>
        {selected ? (
          <View style={styles.radioOn}>
            <View style={styles.radioDot} />
          </View>
        ) : (
          <View style={styles.radioOff} />
        )}
      </View>
    </View>
  );

  return (
    <Pressable onPress={onPress} style={styles.planTouch}>
      {selected && plan.best ? (
        <LinearGradient
          colors={gradients.violetMagenta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.planBorder, styles.planGlow]}
        >
          <View style={styles.planFill}>{body}</View>
        </LinearGradient>
      ) : (
        <View style={[styles.planBorder, styles.planBorderPlain]}>
          <View style={styles.planFill}>{body}</View>
        </View>
      )}
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const PremiumAccessScreen = ({ navigation }: Props) => {
  const [selected, setSelected] = useState<PlanId>('annual');

  const goToPayment = () => {
    const plan = PLANS.find(p => p.id === selected)!;
    const price = parseFloat(plan.price.replace('$', ''));
    navigation.navigate('Payment', { planLabel: plan.name, price });
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="category" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        >
          <View style={styles.topBar}>
            <RoundButton icon="chevron-back" onPress={() => navigation.goBack()} />
          </View>

          <View style={styles.crownWrap}>
            <MaterialCommunityIcons
              name="crown-outline"
              size={36}
              color={colors.accent}
            />
          </View>
          <Text style={styles.title}>Premium Access</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited access to the best wallpapers
          </Text>

          {/* Hero banner */}
          <Card
            style={{ marginHorizontal: spacing.xl, marginTop: spacing.xl }}
            padding={spacing.xl}
            glowBorder
          >
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Go Premium.</Text>
                <Text style={styles.heroTitle}>Elevate your experience.</Text>
                <Text style={styles.heroSub}>
                  Get unlimited downloads, exclusive content and a truly ad-free
                  experience.
                </Text>
              </View>
              <MaterialCommunityIcons
                name="crown"
                size={66}
                color={colors.accent}
                style={styles.heroCrown}
              />
            </View>
          </Card>

          {/* Benefits */}
          <Text style={styles.sectionTitle}>Premium Benefits</Text>
          <View style={styles.benefitGrid}>
            {BENEFITS.map(b => (
              <BenefitCard key={b.id} item={b} />
            ))}
          </View>

          {/* Plans */}
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          <View style={styles.plansRow}>
            {PLANS.map(p => (
              <PlanCard
                key={p.id}
                plan={p}
                selected={selected === p.id}
                onPress={() => setSelected(p.id)}
              />
            ))}
          </View>

          {/* Guarantee */}
          <Card
            style={{ marginHorizontal: spacing.xl, marginTop: spacing.xl }}
            padding={spacing.lg}
          >
            <View style={styles.guaranteeRow}>
              <View style={styles.guaranteeIcon}>
                <Ionicons name="shield-checkmark" size={22} color={colors.accentBlue} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.guaranteeTitle}>7-Day Money Back Guarantee</Text>
                <Text style={styles.guaranteeSub}>
                  Not satisfied? Get a full refund within 7 days of purchase.
                </Text>
              </View>
            </View>
          </Card>

          {/* CTA */}
          <Pressable
            onPress={goToPayment}
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
                <MaterialCommunityIcons name="crown" size={22} color={colors.textPrimary} />
                <Text style={styles.ctaText}>Continue to Payment</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
            </LinearGradient>
          </Pressable>

          <View style={styles.secureRow}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.secureText}>Secure payment. Cancel anytime.</Text>
          </View>

          {/* Footer links */}
          <View style={styles.footerRow}>
            <Pressable hitSlop={6}>
              <Text style={styles.footerLink}>Restore Purchases</Text>
            </Pressable>
            <View style={styles.footerRight}>
              <Pressable hitSlop={6}>
                <Text style={styles.footerLink}>Terms of Service</Text>
              </Pressable>
              <Text style={styles.footerDot}>•</Text>
              <Pressable hitSlop={6}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PremiumAccessScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  topBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

  crownWrap: { alignItems: 'center', marginTop: spacing.xs },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },

  // hero
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  heroSub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  heroCrown: {
    marginLeft: spacing.md,
    textShadowColor: colors.accentStrong,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },

  // section
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    letterSpacing: -0.3,
  },

  // benefits
  benefitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BENEFIT_GAP,
    paddingHorizontal: spacing.xl,
  },
  benefit: {
    width: BENEFIT_W,
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  benefitTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  benefitSub: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  // plans
  plansRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  planTouch: { flex: 1 },
  planBorder: { borderRadius: radius.lg + 2, padding: 1.5 },
  planBorderPlain: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: 'transparent',
  },
  planGlow: {
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  planFill: {
    borderRadius: radius.lg,
    backgroundColor: colors.baseElevated,
    overflow: 'hidden',
  },
  planInner: { padding: spacing.md, alignItems: 'center', minHeight: 230 },
  bestBadge: {
    position: 'absolute',
    top: -11,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  bestBadgeText: { color: colors.textPrimary, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  planName: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  planPrice: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 4 },
  planPeriod: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  savePill: {
    backgroundColor: 'rgba(236,72,153,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  saveText: { color: colors.accentPink, fontSize: 10, fontWeight: '800' },
  perks: { alignSelf: 'stretch', marginTop: spacing.md, gap: 6 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  perkText: { color: colors.textSecondary, fontSize: 10, flex: 1 },
  radioWrap: { marginTop: spacing.md },
  radioOn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textPrimary },
  radioOff: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },

  // guarantee
  guaranteeRow: { flexDirection: 'row', alignItems: 'center' },
  guaranteeIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipBlue,
  },
  guaranteeTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  guaranteeSub: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 },

  // CTA
  ctaWrap: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    borderRadius: radius.pill,
    shadowColor: colors.accentPink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
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

  // footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLink: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  footerDot: { color: colors.textTertiary, fontSize: 13 },
});
