import React, { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Alert } from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import MeshBackground from '../../components/MeshBackground';
import { colors } from '../../styles/colors';
import { radius, SCREEN, spacing } from '../../utils/constants';

import {
  getSubscriptionPlans,
  createOrder,
} from '../../services/subscriptionService';

type PremiumReturnRoute =
  | 'Home'
  | 'Category'
  | 'Trending'
  | 'Favorites'
  | 'Profile'
  | 'Settings';

type PurchasePlan = 'MONTHLY' | 'YEARLY' | 'LIFETIME';

export interface RazorpayOrder {
  keyId: string;

  orderId: string;

  amount: number;

  currency: string;

  receipt: string;

  plan: PurchasePlan;

  title: string;
}

type PaymentParams = {
  order: RazorpayOrder;
};

type Navigation = {
  navigate?: (name: string, params?: Record<string, unknown>) => void;
  getParent?: () => Navigation | undefined;
  canGoBack?: () => boolean;
  goBack?: () => void;
};

type PremiumScreenProps = {
  navigation?: Navigation;
  route?: {
    params?: {
      returnTo?: PremiumReturnRoute;
    };
  };
};

type Feature = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  gradient: readonly [string, string];
};

type BillingPlanId = 'lifetime' | 'yearly' | 'monthly';

type BillingPlan = {
  id: BillingPlanId;
  title: string;
  subtitle: string;
  price: string;
  amount: number;
  period?: string;
  badge?: string;
  accent: string;
  badgeTone?: 'gold' | 'green' | 'purple' | 'blue';
};

const TAB_RETURN_ROUTES: PremiumReturnRoute[] = [
  'Home',
  'Category',
  'Trending',
  'Favorites',
  'Profile',
];

const premiumLogo = require('../../assets/images/premium-logo.png');
const proButtonIcon = require('../../assets/images/pro-button.png');

const CTA_GRADIENT = ['#EC4899', '#A855F7', '#3B82F6'] as const;

const PLAN_MAP: Record<BillingPlanId, PurchasePlan> = {
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
  lifetime: 'LIFETIME',
};

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

const FEATURE_ROWS: Feature[][] = [FEATURES.slice(0, 2), FEATURES.slice(2, 4)];

const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'lifetime',
    title: 'Lifetime PRO',
    subtitle: 'Pay once. Enjoy forever',
    price: '₹799.00',
    amount: 799,
    badge: 'BEST VALUE',
    accent: '#FACC15',
    badgeTone: 'gold',
  },
  {
    id: 'yearly',
    title: 'Yearly',
    subtitle: 'Smart Upgrade',
    price: '₹399.00',
    amount: 399,
    period: '/ YEAR',
    badge: '₹33/month',
    accent: '#4ADE80',
    badgeTone: 'green',
  },
  {
    id: 'monthly',
    title: 'Monthly',
    subtitle: 'Starter Pack',
    price: '₹149.00',
    amount: 149,
    period: '/ MONTH',
    accent: '#A855F7',
    badgeTone: 'purple',
  },
];

const BENEFIT_GAP = spacing.md;

const getBackendPlansArray = (response: any) => {
  const payload = response?.data?.data ?? response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.plans)) return payload.plans;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.subscriptions)) return payload.subscriptions;

  return [];
};

const normalizePlanId = (plan: any): BillingPlanId | null => {
  const value = String(
    plan?.id ??
    plan?.planId ??
    plan?.plan_id ??
    plan?.type ??
    plan?.plan ??
    plan?.name ??
    plan?.title ??
    plan?.interval ??
    plan?.billingPeriod ??
    '',
  ).toLowerCase();

  if (value.includes('life')) return 'lifetime';
  if (value.includes('year') || value.includes('annual')) return 'yearly';
  if (value.includes('month')) return 'monthly';

  return null;
};

const getPlanAmount = (plan: any, fallback: BillingPlan) => {
  const rawAmount =
    plan?.amount ??
    plan?.price ??
    plan?.priceAmount ??
    plan?.price_amount ??
    plan?.amountInr ??
    plan?.amount_inr;

  const amount = Number(String(rawAmount ?? '').replace(/[^\d.]/g, ''));

  return Number.isFinite(amount) && amount > 0 ? amount : fallback.amount;
};

const getPlanPrice = (plan: any, fallback: BillingPlan) => {
  const displayPrice =
    plan?.displayPrice ??
    plan?.display_price ??
    plan?.formattedPrice ??
    plan?.formatted_price ??
    plan?.priceText ??
    plan?.price_text;

  if (displayPrice) {
    return String(displayPrice);
  }

  const amount = getPlanAmount(plan, fallback);

  return `₹${amount.toFixed(2)}`;
};

const mergeBackendPlanWithDesign = (
  backendPlan: any,
  fallback: BillingPlan,
): BillingPlan => {
  return {
    ...fallback,

    title:
      backendPlan?.title ??
      backendPlan?.name ??
      backendPlan?.label ??
      fallback.title,

    subtitle:
      backendPlan?.subtitle ?? backendPlan?.description ?? fallback.subtitle,

    price: getPlanPrice(backendPlan, fallback),

    amount: getPlanAmount(backendPlan, fallback),

    period: fallback.period,

    badge: fallback.badge,

    accent: fallback.accent,

    badgeTone: fallback.badgeTone,
  };
};

const normalizeBackendPlansForPremiumUI = (backendPlans: any[]) => {
  if (!backendPlans.length) {
    return BILLING_PLANS;
  }

  return BILLING_PLANS.map(defaultPlan => {
    const backendMatch = backendPlans.find(
      plan => normalizePlanId(plan) === defaultPlan.id,
    );

    if (!backendMatch) {
      return defaultPlan;
    }

    return mergeBackendPlanWithDesign(backendMatch, defaultPlan);
  });
};

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

const getPlanGradient = (selected: boolean) => {
  if (selected) {
    return [
      'rgba(255,255,255,0.12)',
      'rgba(255,255,255,0.055)',
      'rgba(15,15,16,0.82)',
    ] as const;
  }

  return [
    'rgba(255,255,255,0.09)',
    'rgba(255,255,255,0.04)',
    'rgba(15,15,16,0.76)',
  ] as const;
};

const BillingPlanCard = ({
  plan,
  selected,
  onPress,
}: {
  plan: BillingPlan;
  selected: boolean;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planPressable,
        {
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <BlurView
        intensity={selected ? 34 : 24}
        tint="dark"
        style={[
          styles.planCard,
          selected && styles.planCardSelected,
          selected && { borderColor: plan.accent },
        ]}
      >
        <LinearGradient
          colors={getPlanGradient(selected)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {selected ? (
          <View
            style={[
              styles.selectedAccentLine,
              { backgroundColor: plan.accent },
            ]}
          />
        ) : null}

        <View
          style={[
            styles.radioOuter,
            selected && {
              borderColor: plan.accent,
              backgroundColor: `${plan.accent}24`,
            },
          ]}
        >
          {selected ? (
            <View
              style={[styles.radioInner, { backgroundColor: plan.accent }]}
            />
          ) : null}
        </View>

        <View style={styles.planMain}>
          <View style={styles.planTextWrap}>
            <Text style={styles.planTitle} numberOfLines={1}>
              {plan.title}
            </Text>

            <Text style={styles.planSubtitle} numberOfLines={1}>
              {plan.subtitle}
            </Text>
          </View>

          <View style={styles.planRightWrap}>
            <Text style={styles.planPriceLine} numberOfLines={1}>
              <Text style={styles.planPrice}>{plan.price}</Text>

              {plan.period ? (
                <Text style={styles.planPeriod}> {plan.period}</Text>
              ) : null}
            </Text>

            {plan.badge ? (
              <View
                style={[
                  styles.planBadge,
                  plan.badgeTone === 'green' && styles.planBadgeGreen,
                  plan.badgeTone === 'gold' && styles.planBadgeGold,
                  plan.badgeTone === 'purple' && styles.planBadgePurple,
                  plan.badgeTone === 'blue' && styles.planBadgeBlue,
                ]}
              >
                <Text
                  style={[
                    styles.planBadgeText,
                    plan.badgeTone === 'green' && styles.planBadgeTextDark,
                  ]}
                  numberOfLines={1}
                >
                  {plan.badge}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </BlurView>
    </Pressable>
  );
};

const PremiumScreen = ({ navigation, route }: PremiumScreenProps) => {
  const [plans, setPlans] = useState<BillingPlan[]>(BILLING_PLANS);

  const [selectedPlan, setSelectedPlan] = useState<BillingPlanId>('lifetime');

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      const response = await getSubscriptionPlans();

      const backendPlans = getBackendPlansArray(response);

      const normalizedPlans = normalizeBackendPlansForPremiumUI(backendPlans);

      setPlans(normalizedPlans);

      setSelectedPlan(current =>
        normalizedPlans.some(p => p.id === current) ? current : 'lifetime',
      );
    } catch (err) {
      console.log('PREMIUM PLANS LOAD ERROR', err);

      setPlans(BILLING_PLANS);

      setSelectedPlan('lifetime');
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await loadPlans(true);
  };

  const handleClose = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack?.();
      return;
    }

    const returnTo = route?.params?.returnTo ?? 'Home';

    if (TAB_RETURN_ROUTES.includes(returnTo)) {
      navigation?.navigate?.('MainTabs', {
        screen: returnTo,
      });

      return;
    }

    navigation?.navigate?.(returnTo);
  };

  const handleContinue = async () => {
    if (!selectedPlanData || loading) {
      return;
    }

    try {
      setLoading(true);

      const order = await createOrder(PLAN_MAP[selectedPlanData.id]);

      console.log('CREATE ORDER RESPONSE');
      console.log(JSON.stringify(order, null, 2));

      const parent = navigation?.getParent?.();

      if (parent) {
        parent.navigate?.('Payment', {
          order: order as RazorpayOrder,
        });

        return;
      }

      navigation?.navigate?.('Payment', {
        order: order as RazorpayOrder,
      });
    } catch (error: any) {
      console.error('CREATE RAZORPAY ORDER ERROR', error);

      const message =
        error?.response?.status === 401
          ? 'Please login to continue with premium.'
          : error?.response?.data?.message ??
          error?.message ??
          'Unable to create payment order.';

      Alert.alert('Payment', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="category" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textPrimary}
            />
          }
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
                  onPress={handleClose}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Close premium page"
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
                      name="close"
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

          <View style={styles.billingSection}>
            <View style={styles.plansWrap}>
              {plans.map(plan => (
                <BillingPlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan === plan.id}
                  onPress={() => setSelectedPlan(plan.id)}
                />
              ))}
            </View>
          </View>

          <Pressable
            disabled={loading}
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.ctaWrap,
              {
                opacity: loading ? 0.72 : 1,
                transform: [{ scale: pressed && !loading ? 0.98 : 1 }],
              },
            ]}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <View style={styles.ctaCenter}>
                {loading ? (
                  <ActivityIndicator color={colors.textPrimary} size="small" />
                ) : (
                  <MaterialCommunityIcons
                    name="crown"
                    size={19}
                    color={colors.textPrimary}
                  />
                )}

                <Text style={styles.ctaText}>
                  {loading ? 'Creating Order...' : 'Continue'}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textPrimary}
              />
            </LinearGradient>
          </Pressable>

          <View style={styles.paymentInfoWrap}>
            <View style={styles.paymentInfoRow}>
              <Ionicons
                name="checkmark"
                size={12}
                color={colors.textSecondary}
              />

              <Text style={styles.paymentInfoText}>
                {selectedPlanData?.id === 'lifetime'
                  ? 'One-time payment, no recurring fees'
                  : 'Manual renewal, no hidden auto-renewal'}
              </Text>
            </View>

            <View style={styles.paymentInfoRow}>
              <Ionicons
                name="lock-closed"
                size={11}
                color={colors.textSecondary}
              />

              <Text style={styles.paymentInfoText}>
                Secured with Razorpay Checkout
              </Text>
            </View>
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

  scrollContent: {
    paddingBottom: 18,
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

  billingSection: {
    paddingHorizontal: spacing.xl,
    marginTop: -18,
  },

  plansWrap: {
    gap: 8,
  },

  planPressable: {
    borderRadius: 20,
  },

  planCard: {
    minHeight: 62,
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },

  planCardSelected: {
    borderWidth: 1.5,
    elevation: 0,
  },

  selectedAccentLine: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },

  radioOuter: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },

  planMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  planTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },

  planTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  planSubtitle: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '800',
    marginTop: 1,
  },

  planRightWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 95,
  },

  planPriceLine: {
    color: colors.textPrimary,
    includeFontPadding: false,
  },

  planPrice: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  planPeriod: {
    color: colors.textSecondary,
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '900',
  },

  planBadge: {
    minHeight: 18,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },

  planBadgeGold: {
    backgroundColor: '#FACC15',
  },

  planBadgeGreen: {
    backgroundColor: '#4ADE80',
  },

  planBadgePurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.34)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(216, 180, 254,0.45)',
  },

  planBadgeBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.34)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(147, 197, 253,0.45)',
  },

  planBadgeText: {
    color: '#1A1207',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.1,
  },

  planBadgeTextDark: {
    color: '#06220F',
  },

  ctaWrap: {
    marginHorizontal: spacing.xl,
    marginTop: 13,
    borderRadius: radius.pill,
    shadowColor: colors.accentPink,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 7,
  },

  cta: {
    minHeight: 49,
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
    gap: spacing.sm,
  },

  ctaText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },

  paymentInfoWrap: {
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },

  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  paymentInfoText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },
});