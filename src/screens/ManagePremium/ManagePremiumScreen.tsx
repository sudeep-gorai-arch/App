import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  Easing,
  Image,
  Pressable,
  RefreshControl,
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { hasRenewingSubscription, isCurrentPremium } from '../../utils/premiumStatus';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';

import { colors, gradients } from '../../styles/colors';

import { spacing } from '../../utils/constants';

import {
  getSubscriptionStatus,
  getSubscriptionPlans,
  cancelSubscription,
  cancelGooglePlaySubscription,
  type GooglePlayCancellationReason,
  SubscriptionPlan,
} from '../../services/subscriptionService';

import { useToast } from '../../components/ui/toast/useToast';

const PRO_BUTTON_IMAGE = require('../../assets/images/pro-button.png');

type Nav = {
  goBack?: () => void;
  navigate?: (screen: string, params?: any) => void;
};

type Props = {
  navigation?: Nav;
  route?: { params?: { fromPremiumScreen?: boolean; returnTo?: string } };
};

type PlanLike = SubscriptionPlan & {
  id?: string;
  plan?: string;
  name?: string;
  title?: string;
  amount?: number;
  price?: number;
  currency?: string;
  validityDays?: number;
  validity_days?: number;
  durationDays?: number;
  duration_days?: number;
};

type SubscriptionLike = {
  id?: string;
  plan?: string;
  platform?: string;
  purchaseToken?: string;
  razorpaySubscriptionId?: string | null;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  status?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
  cancelAtCycleEnd?: boolean;
  cancel_at_cycle_end?: boolean;
  cancelledAt?: string | null;
};

type PaymentLike = {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  orderId?: string;
  paymentId?: string;
  createdAt?: string;
  paidAt?: string;
  notes?: any;
};

type SubscriptionStatus = {
  isPremium?: boolean;
  premiumUntil?: string | null;
  currentPlan?: string;
  plan?: string;
  subscription?: SubscriptionLike | null;
  activeSubscription?: SubscriptionLike | null;
  latestSubscription?: SubscriptionLike | null;
  payment?: PaymentLike | null;
  latestPayment?: PaymentLike | null;
  payments?: PaymentLike[];
  cancellation?: {
    cancelAtCycleEnd?: boolean;
    cancel_at_cycle_end?: boolean;
    cancelledAt?: string | null;
    razorpaySubscriptionId?: string | null;
  };
  user?: {
    isPremium?: boolean;
    premiumUntil?: string | null;
  };
};

const SUCCESS = '#34D399';
const WARNING = '#FBBF24';
const DANGER = '#FF5A6E';
const CANCELLATION_REASONS: ReadonlyArray<{ value: GooglePlayCancellationReason; label: string }> = [
  { value: 'CANCEL_SURVEY_REASON_NOT_ENOUGH_USAGE', label: 'I do not use Premium enough' },
  { value: 'CANCEL_SURVEY_REASON_TECHNICAL_ISSUES', label: 'Technical issues' },
  { value: 'CANCEL_SURVEY_REASON_COST_RELATED', label: 'It costs too much' },
  { value: 'CANCEL_SURVEY_REASON_FOUND_BETTER_APP', label: 'I found a better app' },
  { value: 'CANCEL_SURVEY_REASON_OTHERS', label: 'Other reasons' },
];

const unwrapData = <T,>(payload: any): T => {
  if (payload?.data?.data !== undefined) return payload.data.data as T;
  if (payload?.data !== undefined) return payload.data as T;
  return payload as T;
};

const normalizePlanKey = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const toTitleCase = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const formatPlanDisplayName = (
  value?: string | null,
  isPremiumPlan = false,
) => {
  const raw = String(value ?? '').trim();

  if (!raw) return isPremiumPlan ? 'Premium' : 'Free';

  const normalized = normalizePlanKey(raw);

  let displayName = toTitleCase(raw);

  if (normalized === 'monthly') displayName = 'Monthly';
  if (normalized === 'quarterly') displayName = 'Quarterly';
  if (normalized === 'yearly') displayName = 'Yearly';
  if (normalized === 'annual') displayName = 'Yearly';
  if (normalized === 'lifetime') displayName = 'Lifetime';
  if (normalized === 'free') displayName = 'Free';

  if (
    isPremiumPlan &&
    displayName.toLowerCase() !== 'free' &&
    !displayName.toLowerCase().includes('premium')
  ) {
    return `${displayName} Premium`;
  }

  return displayName;
};

const getPlanKey = (plan?: PlanLike | null) =>
  plan?.plan ?? plan?.id ?? plan?.name ?? plan?.title ?? '';

const getPlanTitle = (plan?: PlanLike | null, fallback = 'Free') =>
  plan?.title ?? plan?.name ?? plan?.plan ?? plan?.id ?? fallback;

const getPlanAmount = (plan?: PlanLike | null) => {
  const value = plan?.amount ?? plan?.price;
  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
};

const getPlanCurrency = (plan?: PlanLike | null, fallback = 'INR') =>
  String(plan?.currency ?? fallback).toUpperCase();

const getPlanValidityDays = (plan?: PlanLike | null) => {
  const value =
    plan?.validityDays ??
    plan?.validity_days ??
    plan?.durationDays ??
    plan?.duration_days;

  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
};

const formatDate = (date?: string | null) => {
  if (!date) return '--';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '--';

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getDaysLeft = (date?: string | null) => {
  if (!date) return null;

  const expiry = new Date(date).getTime();
  if (Number.isNaN(expiry)) return null;

  const diff = expiry - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatMoney = (amount?: number | null, currency = 'INR') => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '--';

  if (currency.toUpperCase() === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  return `${amount.toLocaleString('en-IN')} ${currency.toUpperCase()}`;
};

const getLatestPayment = (status?: SubscriptionStatus | null) => {
  if (!status) return null;

  if (status.latestPayment) return status.latestPayment;
  if (status.payment) return status.payment;
  if (Array.isArray(status.payments) && status.payments.length > 0) {
    return status.payments[0];
  }

  return null;
};

const getCancellationFromPayment = (payment?: PaymentLike | null) => {
  const cancellation = payment?.notes?.cancellation;

  return {
    cancelAtCycleEnd: Boolean(
      cancellation?.cancelAtCycleEnd ?? cancellation?.cancel_at_cycle_end,
    ),
    cancelledAt: cancellation?.cancelledAt ?? cancellation?.cancelled_at ?? null,
  };
};

const ManagePremiumScreen = ({ navigation, route }: Props) => {
  const handleBack = () => {
    if (route?.params?.fromPremiumScreen) {
      // A restored purchase from Premium should return to Premium, never
      // jump to the Profile tab. The explicit marker survives navigation.
      if (navigation?.goBack) {
        navigation.goBack();
      } else {
        navigation?.navigate?.('Premium', { returnTo: route.params.returnTo });
      }
      return;
    }
    if (navigation?.goBack) navigation.goBack();
    else navigation?.navigate?.('MainTabs', { screen: route?.params?.returnTo ?? 'Profile' });
  };

  const toast = useToast();
  const { refreshProfile, syncGooglePlayPurchases } = useAuth();

  const shineAnim = useRef(new Animated.Value(0)).current;
  const glitterAnim = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [plans, setPlans] = useState<PlanLike[]>([]);
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<GooglePlayCancellationReason | null>(null);
  const [cancelConfirmStep, setCancelConfirmStep] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    const shineLoop = Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );

    const glitterLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glitterAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glitterAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    shineLoop.start();
    glitterLoop.start();

    return () => {
      shineLoop.stop();
      glitterLoop.stop();
    };
  }, [glitterAnim, shineAnim]);

  const shineTranslateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 90],
  });

  const shineOpacity = shineAnim.interpolate({
    inputRange: [0, 0.35, 0.65, 1],
    outputRange: [0, 0.6, 0.55, 0],
  });

  const glitterScale = glitterAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1.25, 0.6],
  });

  const glitterOpacity = glitterAnim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.2, 1, 0.25],
  });

  const showSuccess = useCallback(
    (message: string) => {
      const anyToast = toast as any;

      if (typeof anyToast?.success === 'function') {
        anyToast.success(message);
        return;
      }

      if (typeof anyToast?.show === 'function') {
        anyToast.show(message);
      }
    },
    [toast],
  );

  const loadData = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);

        // Show the critical entitlement as soon as the backend verifies it.
        // Plans and profile refresh are secondary and must not block this page.
        // Ask Play for owned items before reading the authoritative backend
        // status. This also repairs purchases missed while temporarily offline.
        try {
          await syncGooglePlayPurchases();
        } catch {
          // Store unavailable: retain the backend status path and permit retry.
          console.warn('Google Play refresh unavailable; loading server subscription status.');
        }
        const statusData = unwrapData<SubscriptionStatus>(await getSubscriptionStatus());
        setStatus(statusData ?? null);
        setLoading(false);
        void refreshProfile().catch(() => undefined);
        void getSubscriptionPlans()
          .then(planResponse => {
            const planData = unwrapData<PlanLike[]>(planResponse);
            setPlans(Array.isArray(planData) ? planData : []);
          })
          .catch(() => undefined);
      } catch (e) {
        console.log(e);
        toast.error('Unable to load premium details.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast, refreshProfile, syncGooglePlayPurchases],
  );

  useFocusEffect(useCallback(() => {
    void loadData(false);
  }, [loadData]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void loadData(false);
    });
    return () => subscription.remove();
  }, [loadData]);

  const activeSubscription = useMemo(() => {
    return status?.activeSubscription ?? status?.subscription ?? null;
  }, [status]);

  const latestPayment = useMemo(() => getLatestPayment(status), [status]);

  const isPremium = isCurrentPremium(status ?? null);

  const premiumUntil =
    status?.premiumUntil ?? status?.user?.premiumUntil ?? activeSubscription?.endDate;

  const currentPlan = useMemo(() => {
    const statusPlan = normalizePlanKey(
      activeSubscription?.plan ?? status?.currentPlan ?? status?.plan,
    );

    if (!statusPlan) return null;

    return (
      plans.find(plan => normalizePlanKey(getPlanKey(plan)) === statusPlan) ?? null
    );
  }, [activeSubscription?.plan, plans, status?.currentPlan, status?.plan]);

  const planAmount =
    getPlanAmount(currentPlan) ?? activeSubscription?.amount ?? latestPayment?.amount;

  const planCurrency = getPlanCurrency(
    currentPlan,
    activeSubscription?.currency ?? latestPayment?.currency ?? 'INR',
  );

  const validityDays = getPlanValidityDays(currentPlan);

  const daysLeft = getDaysLeft(premiumUntil);

  const activeStatusText = isPremium ? 'ACTIVE' : 'FREE';

  const rawPlanName = getPlanTitle(
    currentPlan,
    activeSubscription?.plan ?? status?.currentPlan ?? 'Premium',
  );

  const planTitle = isPremium
    ? formatPlanDisplayName(rawPlanName, true)
    : 'Free';

  const isLifetimePlan =
    normalizePlanKey(activeSubscription?.plan ?? status?.currentPlan) === 'lifetime';

  const expiryText = isPremium
    ? isLifetimePlan
      ? 'Lifetime Premium — no auto-renewal'
      : daysLeft !== null && daysLeft > 0
        ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
        : 'Expires today'
    : 'Upgrade anytime';

  const paymentCancellation = getCancellationFromPayment(latestPayment);

  const isCancelScheduled = Boolean(
    activeSubscription?.cancelAtCycleEnd ??
      activeSubscription?.cancel_at_cycle_end ??
      status?.cancellation?.cancelAtCycleEnd ??
      status?.cancellation?.cancel_at_cycle_end ??
      paymentCancellation.cancelAtCycleEnd,
  );

  const paymentStatus =
    latestPayment?.status ?? activeSubscription?.status ?? (isPremium ? 'PAID' : '--');


  const isGooglePlaySubscription =
    String(activeSubscription?.platform ?? '').toUpperCase() === 'GOOGLE';

  const canCancelSubscription =
    !isLifetimePlan &&
    hasRenewingSubscription(activeSubscription?.plan, activeSubscription?.platform,
      activeSubscription?.razorpaySubscriptionId) &&
    Boolean(activeSubscription?.active || isPremium);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const goToPremium = () => {
    navigation?.navigate?.('MainTabs', {
      screen: 'Premium',
      params: { returnTo: 'Profile' },
    });
  };

  const goToSupport = () => {
    navigation?.navigate?.('HelpSupport');
  };

  const confirmCancelSubscription = useCallback(async () => {
    try {
      setCanceling(true);

      if (isGooglePlaySubscription) {
        if (!selectedCancelReason) {
          toast.info('Select a cancellation reason first.');
          return;
        }
        const updated = await cancelGooglePlaySubscription(selectedCancelReason);
        setStatus(updated as SubscriptionStatus);
        setCancelSheetVisible(false);
        setCancelConfirmStep(false);
        setSelectedCancelReason(null);
        showSuccess('Auto-renewal cancelled. Premium remains active until the paid period ends.');
        void refreshProfile().catch(() => undefined);
        return;
      }

      const cancelledStatus = await cancelSubscription(true);

      setStatus(cancelledStatus as SubscriptionStatus);
      showSuccess('Subscription cancellation scheduled.');
    } catch (e: any) {
      console.log(e);

      const message =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        'Unable to cancel subscription. Please try again.';

      toast.error(message);
    } finally {
      setCanceling(false);
    }
  }, [
    activeSubscription?.plan,
    isGooglePlaySubscription,
    showSuccess,
    status?.currentPlan,
    toast,
    selectedCancelReason,
    refreshProfile,
  ]);

  const onCancelSubscription = useCallback(() => {
    if (!canCancelSubscription || canceling || (isCancelScheduled && !isGooglePlaySubscription)) return;

    if (isGooglePlaySubscription) {
      setSelectedCancelReason(null);
      setCancelConfirmStep(false);
      setCancelSheetVisible(true);
      return;
    }
    Alert.alert(
      'Cancel Subscription',
      `Your Premium access will remain active until ${formatDate(premiumUntil)}. Do you want to cancel auto-renewal?`,
      [
        { text: 'Keep Premium', style: 'cancel' },
        { text: 'Cancel Subscription', style: 'destructive', onPress: confirmCancelSubscription },
      ],
    );
  }, [
    canCancelSubscription,
    canceling,
    confirmCancelSubscription,
    isCancelScheduled,
    isGooglePlaySubscription,
    premiumUntil,
  ]);

  if (loading) {
    return (
      <View style={styles.root}>
        <MeshBackground variant="profile" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <RoundButton icon="chevron-back" onPress={handleBack} />
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Manage Premium</Text>
                <Text style={styles.headerSub}>Checking your plan and payment details</Text>
              </View>
              <View style={styles.refreshButton}>
                <Ionicons name="refresh" size={20} color={colors.textSecondary} />
              </View>
            </View>

            <Card style={styles.heroCard} padding={spacing.lg} glowBorder strong>
              <View style={styles.skeletonHeroHeading}>
                <View style={styles.skeletonProIcon}>
                  <Ionicons name="diamond-outline" size={30} color="rgba(200,190,240,0.38)" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[styles.skeletonBar, { width: '48%', height: 12 }]} />
                  <View style={[styles.skeletonBar, { width: '85%', height: 25, marginTop: 12 }]} />
                  <View style={[styles.skeletonBar, { width: '62%', marginTop: 12 }]} />
                </View>
              </View>
              <View style={styles.skeletonDivider} />
              <View style={styles.skeletonHeroHeading}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.skeletonBar, { width: '55%' }]} />
                  <View style={[styles.skeletonBar, { width: '75%', marginTop: 12 }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[styles.skeletonBar, { width: '62%' }]} />
                  <View style={[styles.skeletonBar, { width: '80%', marginTop: 12 }]} />
                </View>
              </View>
            </Card>
            {['Plan Details', 'Latest Payment', 'Actions'].map((heading, index) => (
              <Card key={heading} style={styles.block} padding={spacing.lg} strong>
                <Text style={styles.sectionTitle}>{heading}</Text>
                {(index === 2 ? [0, 1] : [0, 1, 2]).map(item => (
                  <View key={item} style={styles.skeletonInfoRow}>
                    <View style={styles.skeletonRowIcon} />
                    <View style={[styles.skeletonBar, { width: '40%' }]} />
                    <View style={[styles.skeletonBar, { width: '24%', marginLeft: 'auto' }]} />
                  </View>
                ))}
              </Card>
            ))}
            <Text style={[styles.loadingText, { textAlign: 'center' }]}>
              Syncing your subscription with Google Play...
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <RoundButton
              icon="chevron-back"
              onPress={handleBack}
            />

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Manage Premium</Text>
              <Text style={styles.headerSub}>
                Your plan and latest payment details
              </Text>
            </View>

            <Pressable
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="refresh" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <Card style={styles.heroCard} padding={0} glowBorder strong>
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.10)',
                'rgba(168,85,247,0.12)',
                'rgba(255,255,255,0.04)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroGlowOne} />
              <View style={styles.heroGlowTwo} />

              <View style={styles.planTop}>
                <View style={styles.proIconOuter}>
                  <LinearGradient
                    colors={
                      isPremium
                        ? ['rgba(255,214,102,0.48)', 'rgba(168,85,247,0.20)']
                        : ['rgba(168,85,247,0.30)', 'rgba(59,130,246,0.16)']
                    }
                    style={styles.proIconHalo}
                  />

                  <View style={styles.proIconClip}>
                    <Image
                      source={PRO_BUTTON_IMAGE}
                      style={styles.proIconImage}
                      resizeMode="contain"
                    />

                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.shineSweep,
                        {
                          opacity: shineOpacity,
                          transform: [
                            { translateX: shineTranslateX },
                            { rotate: '18deg' },
                          ],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={[
                          'rgba(255,255,255,0)',
                          'rgba(255,255,255,0.78)',
                          'rgba(255,255,255,0)',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                  </View>

                  <Animated.View
                    style={[
                      styles.glitterDot,
                      styles.glitterDotOne,
                      {
                        opacity: glitterOpacity,
                        transform: [{ scale: glitterScale }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.glitterDot,
                      styles.glitterDotTwo,
                      {
                        opacity: glitterOpacity,
                        transform: [{ scale: glitterScale }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.glitterDot,
                      styles.glitterDotThree,
                      {
                        opacity: glitterOpacity,
                        transform: [{ scale: glitterScale }],
                      },
                    ]}
                  />
                </View>

                <View style={styles.planInfo}>
                  <Text style={styles.planLabel}>Current Plan</Text>

                  <Text
                    style={styles.planName}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    {planTitle}
                  </Text>

                  <View style={styles.planStatusRow}>
                    <View style={styles.enjoyRow}>
                      <Ionicons
                        name={
                          isCancelScheduled
                            ? 'time-outline'
                            : isPremium
                              ? 'shield-checkmark'
                              : 'lock-open-outline'
                        }
                        size={14}
                        color={
                          isCancelScheduled
                            ? WARNING
                            : isPremium
                              ? SUCCESS
                              : colors.textSecondary
                        }
                      />
                      <Text style={styles.enjoy}>
                        {isCancelScheduled ? 'Cancellation scheduled' : expiryText}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.activeBadge,
                        isPremium ? styles.badgePremium : styles.badgeFree,
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeText,
                          { color: isPremium ? SUCCESS : colors.textSecondary },
                        ]}
                      >
                        {activeStatusText}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.hr} />

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Started On</Text>
                  <Text style={styles.metaValue}>
                    {formatDate(activeSubscription?.startDate)}
                  </Text>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Valid Until</Text>
                  <Text style={styles.metaValue}>{isLifetimePlan && isPremium ? 'Lifetime' : formatDate(premiumUntil)}</Text>
                </View>
              </View>
            </LinearGradient>
          </Card>

          <Card style={styles.block} padding={spacing.lg} strong>
            <Text style={styles.sectionTitle}>Plan Details</Text>

            <InfoRow
              icon="diamond-outline"
              title="Plan"
              value={planTitle}
            />

            <InfoRow
              icon="wallet-outline"
              title="Amount"
              value={formatMoney(planAmount, planCurrency)}
            />

            <InfoRow
              icon="calendar-outline"
              title="Validity"
              value={isLifetimePlan && isPremium ? 'Lifetime access' : validityDays ? `${validityDays} days` : formatDate(premiumUntil)}
              isLast
            />
          </Card>

          <Card style={styles.block} padding={spacing.lg} strong>
            <Text style={styles.sectionTitle}>Latest Payment</Text>

            <InfoRow
              icon="receipt-outline"
              title="Payment Status"
              value={String(paymentStatus).toUpperCase()}
            />

            <InfoRow
              icon="time-outline"
              title="Payment Date"
              value={formatDate(
                latestPayment?.paidAt ??
                  latestPayment?.createdAt ??
                  activeSubscription?.createdAt,
              )}
              isLast
            />
          </Card>

          <Card style={styles.block} padding={spacing.lg} strong>
            <Text style={styles.sectionTitle}>Actions</Text>

            <ActionRow
              icon={isPremium ? 'refresh-circle-outline' : 'rocket-outline'}
              title={isPremium ? 'Explore Premium Plans' : 'Upgrade Premium'}
              value={
                isPremium
                  ? 'Choose a plan and extend access'
                  : 'Unlock premium wallpapers'
              }
              onPress={goToPremium}
            />

            {canCancelSubscription ? (
              <ActionRow
                icon={isCancelScheduled ? 'time-outline' : 'close-circle-outline'}
                title={
                  isCancelScheduled
                    ? 'Auto-Renewal Off'
                    : 'Cancel Subscription'
                }
                value={
                  isCancelScheduled
                    ? `Premium remains active until ${formatDate(premiumUntil)}`
                    : `Stop auto-renewal. Access stays until ${formatDate(
                        premiumUntil,
                      )}`
                }
                onPress={onCancelSubscription}
                tone="danger"
                loading={canceling}
                disabled={canceling || (isCancelScheduled && !isGooglePlaySubscription)}
              />
            ) : null}

            <ActionRow
              icon="sync-outline"
              title="Refresh Payment Status"
              value="Sync latest details from backend"
              onPress={onRefresh}
            />

            <ActionRow
              icon="headset-outline"
              title="Need Help?"
              value="Contact FlexiWalls support"
              onPress={goToSupport}
              isLast
            />
          </Card>

          <Card style={[styles.block, styles.securityCard]} padding={spacing.lg} strong>
            <View style={styles.securityRow}>
              <View style={styles.securityIcon}>
                <Ionicons name="lock-closed" size={24} color={SUCCESS} />
              </View>

              <View style={styles.securityTextWrap}>
                <Text style={styles.securityTitle}>Secure Google Play Payment</Text>
                <Text style={styles.securityText}>
                  Your payment is handled by Google Play. FlexiWalls only stores
                  the verified order and payment status from our backend.
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
      <Modal
        visible={cancelSheetVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => { if (!canceling) setCancelSheetVisible(false); }}
      >
        <View style={styles.cancelOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => { if (!canceling) setCancelSheetVisible(false); }}
          />
          <View style={styles.cancelSheet}>
            <Text style={styles.cancelHeading}>
              {cancelConfirmStep ? 'Confirm cancellation' : 'Why are you leaving Premium?'}
            </Text>
            {cancelConfirmStep ? (
              <Text style={styles.cancelDescription}>
                Cancel upcoming Google Play renewals? Premium access continues until {formatDate(premiumUntil)}.
                Cancelling does not automatically refund the current paid period.
              </Text>
            ) : (
              <>
                <Text style={styles.cancelDescription}>
                  Your answer is FlexiWalls feedback, not Google's official cancellation survey.
                </Text>
                {CANCELLATION_REASONS.map(reason => (
                  <Pressable
                    key={reason.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedCancelReason === reason.value }}
                    onPress={() => setSelectedCancelReason(reason.value)}
                    style={[
                      styles.cancelChoice,
                      selectedCancelReason === reason.value && styles.cancelChoiceActive,
                    ]}
                  >
                    <Ionicons
                      name={selectedCancelReason === reason.value ? 'radio-button-on' : 'radio-button-off'}
                      color={colors.accent}
                      size={21}
                    />
                    <Text style={styles.cancelChoiceText}>{reason.label}</Text>
                  </Pressable>
                ))}
              </>
            )}
            <View style={styles.cancelButtons}>
              <Pressable
                disabled={canceling}
                style={styles.cancelSecondary}
                onPress={() => {
                  if (cancelConfirmStep) setCancelConfirmStep(false);
                  else setCancelSheetVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>{cancelConfirmStep ? 'Back' : 'Keep Premium'}</Text>
              </Pressable>
              <Pressable
                disabled={canceling || (!cancelConfirmStep && !selectedCancelReason)}
                style={[
                  styles.cancelPrimary,
                  (canceling || (!cancelConfirmStep && !selectedCancelReason)) && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (cancelConfirmStep) void confirmCancelSubscription();
                  else setCancelConfirmStep(true);
                }}
              >
                {canceling
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.cancelButtonText}>{cancelConfirmStep ? 'Stop Renewals' : 'Continue'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  isLast?: boolean;
};

const InfoRow = ({ icon, title, value, isLast }: InfoRowProps) => (
  <View style={[styles.infoRow, isLast && styles.noBorder]}>
    <View style={styles.infoLeft}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>

      <Text style={styles.infoTitle}>{title}</Text>
    </View>

    <Text style={styles.infoValue} numberOfLines={2}>
      {value || '--'}
    </Text>
  </View>
);

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  isLast?: boolean;
};

const ActionRow = ({
  icon,
  title,
  value,
  onPress,
  tone = 'default',
  loading,
  disabled,
  isLast,
}: ActionRowProps) => {
  const isDanger = tone === 'danger';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.manageRow,
        isLast && styles.noBorder,
        disabled && styles.disabledRow,
        pressed && !disabled && { opacity: 0.72 },
      ]}
      onPress={disabled ? undefined : onPress}
    >
      <View style={[styles.detailIcon, isDanger && styles.detailIconDanger]}>
        <Ionicons name={icon} size={20} color={isDanger ? DANGER : colors.accent} />
      </View>

      <View style={styles.detailTextWrap}>
        <Text style={[styles.detailTitle, isDanger && styles.detailTitleDanger]}>
          {title}
        </Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={DANGER} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </Pressable>
  );
};

export default ManagePremiumScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  safeArea: {
    flex: 1,
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: spacing.lg,
  },
  cancelSheet: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(9,10,24,0.96)',
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.44,
    shadowRadius: 28,
    elevation: 20,
  },
  cancelHeading: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  cancelDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  cancelChoice: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  cancelChoiceActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(168,85,247,0.20)',
  },
  cancelChoiceText: { color: colors.textPrimary, fontSize: 13, flex: 1 },
  cancelButtons: { flexDirection: 'row', gap: 12, marginTop: 14 },
  cancelSecondary: {
    flex: 1, borderRadius: 14, minHeight: 48,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  cancelPrimary: {
    flex: 1, borderRadius: 14, minHeight: 48,
    backgroundColor: '#7C3AED',
    justifyContent: 'center', alignItems: 'center',
  },
  cancelButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  skeletonHeroHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  skeletonProIcon: {
    width: 78, height: 78, borderRadius: 39,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  skeletonDivider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: spacing.lg,
  },
  skeletonInfoRow: {
    minHeight: 62, flexDirection: 'row', alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  skeletonRowIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  premiumSkeleton: {
    width: '90%',
    minHeight: 190,
    borderRadius: 22,
    padding: 24,
    marginBottom: 16,
    backgroundColor: 'rgba(23,18,43,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  skeletonBar: {
    height: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(200,190,240,0.18)',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 14,
  },

  scrollContent: {
    paddingBottom: spacing.xxxl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },

  headerSub: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },

  refreshButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  block: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },

  heroGradient: {
    padding: spacing.lg,
    overflow: 'hidden',
  },

  heroGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -70,
    top: -80,
    backgroundColor: 'rgba(255,214,102,0.12)',
  },

  heroGlowTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    left: -60,
    bottom: -80,
    backgroundColor: 'rgba(168,85,247,0.14)',
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },

  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  proIconOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  proIconHalo: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
  },

  proIconClip: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  proIconImage: {
    width: 52,
    height: 52,
  },

  shineSweep: {
    position: 'absolute',
    width: 28,
    height: 90,
    top: -12,
  },

  glitterDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,230,150,0.95)',
    shadowColor: '#FFD66B',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },

  glitterDotOne: {
    top: 4,
    right: 9,
  },

  glitterDotTwo: {
    left: 7,
    top: 18,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  glitterDotThree: {
    right: 2,
    bottom: 16,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  planInfo: {
    flex: 1,
    minWidth: 0,
  },

  planLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  planName: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 4,
    flexShrink: 1,
  },

  planStatusRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  activeBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    marginLeft: spacing.sm,
  },

  badgePremium: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52,211,153,0.30)',
  },

  badgeFree: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  activeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  enjoyRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  enjoy: {
    color: colors.textSecondary,
    marginLeft: 6,
    fontSize: 13,
    flexShrink: 1,
  },

  hr: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: spacing.lg,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaCol: {
    flex: 1,
  },

  metaDivider: {
    width: 1,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: spacing.md,
  },

  metaLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  metaValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },

  infoRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },

  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.md,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  infoTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },

  infoValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    textAlign: 'right',
  },

  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },

  disabledRow: {
    opacity: 0.72,
  },

  noBorder: {
    borderBottomWidth: 0,
  },

  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  detailIconDanger: {
    backgroundColor: 'rgba(255,90,110,0.14)',
  },

  detailTextWrap: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },

  detailTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },

  detailTitleDanger: {
    color: DANGER,
  },

  detailValue: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  securityCard: {
    marginBottom: spacing.xxxl,
  },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  securityIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(52,211,153,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  securityTextWrap: {
    flex: 1,
  },

  securityTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },

  securityText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});