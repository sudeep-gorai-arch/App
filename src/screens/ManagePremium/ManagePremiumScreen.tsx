import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';

import { colors, gradients } from '../../styles/colors';

import { spacing } from '../../utils/constants';

import {
  getSubscriptionStatus,
  getSubscriptionPlans,
  SubscriptionPlan,
} from '../../services/subscriptionService';

import { useToast } from '../../components/ui/toast/useToast';

type Nav = {
  goBack?: () => void;
  navigate?: (screen: string, params?: any) => void;
};

type Props = {
  navigation?: Nav;
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
  user?: {
    isPremium?: boolean;
    premiumUntil?: string | null;
  };
};

const SUCCESS = '#34D399';
const WARNING = '#FBBF24';
const MUTED = 'rgba(255,255,255,0.56)';

const unwrapData = <T,>(payload: any): T => {
  if (payload?.data?.data !== undefined) return payload.data.data as T;
  if (payload?.data !== undefined) return payload.data as T;
  return payload as T;
};

const normalizePlanKey = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

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

const shortId = (value?: string | null) => {
  if (!value) return '--';
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
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

const ManagePremiumScreen = ({ navigation }: Props) => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState<PlanLike[]>([]);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  const loadData = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);

        const [planResponse, statusResponse] = await Promise.all([
          getSubscriptionPlans(),
          getSubscriptionStatus(),
        ]);

        const planData = unwrapData<PlanLike[]>(planResponse);
        const statusData = unwrapData<SubscriptionStatus>(statusResponse);

        setPlans(Array.isArray(planData) ? planData : []);
        setStatus(statusData ?? null);
      } catch (e) {
        console.log(e);
        toast.error('Unable to load premium details.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeSubscription = useMemo(() => {
    return (
      status?.activeSubscription ??
      status?.subscription ??
      status?.latestSubscription ??
      null
    );
  }, [status]);

  const latestPayment = useMemo(() => getLatestPayment(status), [status]);

  const isPremium = Boolean(
    status?.isPremium ?? status?.user?.isPremium ?? activeSubscription?.active,
  );

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

  const planCurrency =
    getPlanCurrency(currentPlan, activeSubscription?.currency ?? latestPayment?.currency ?? 'INR');

  const validityDays = getPlanValidityDays(currentPlan);

  const daysLeft = getDaysLeft(premiumUntil);

  const activeStatusText = isPremium ? 'ACTIVE' : 'FREE';
  const planTitle = isPremium
    ? getPlanTitle(currentPlan, activeSubscription?.plan ?? 'Premium')
    : 'Free';

  const expiryText = isPremium
    ? daysLeft !== null && daysLeft > 0
      ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
      : 'Expired'
    : 'Upgrade anytime';

  const paymentId =
    latestPayment?.razorpayPaymentId ??
    latestPayment?.paymentId ??
    activeSubscription?.razorpayPaymentId ??
    activeSubscription?.purchaseToken;

  const orderId =
    latestPayment?.razorpayOrderId ??
    latestPayment?.orderId ??
    activeSubscription?.razorpayOrderId;

  const paymentStatus =
    latestPayment?.status ?? activeSubscription?.status ?? (isPremium ? 'PAID' : '--');

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

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <MeshBackground variant="profile" />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading premium details...</Text>
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
              onPress={() => navigation?.goBack?.()}
            />

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Manage Premium</Text>
              <Text style={styles.headerSub}>
                Your plan and Razorpay payment details
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

          <Card style={styles.block} padding={spacing.lg} glowBorder strong>
            <View style={styles.planTop}>
              <LinearGradient
                colors={isPremium ? gradients.violetMagenta : gradients.blueViolet}
                style={styles.crownChip}
              >
                <MaterialCommunityIcons
                  name={isPremium ? 'crown' : 'crown-outline'}
                  size={32}
                  color={colors.textPrimary}
                />
              </LinearGradient>

              <View style={styles.planInfo}>
                <Text style={styles.planLabel}>Current Plan</Text>

                <View style={styles.planNameRow}>
                  <Text style={styles.planName} numberOfLines={1}>
                    {planTitle}
                  </Text>

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

                <View style={styles.enjoyRow}>
                  <Ionicons
                    name={isPremium ? 'shield-checkmark' : 'lock-open-outline'}
                    size={14}
                    color={isPremium ? SUCCESS : colors.textSecondary}
                  />
                  <Text style={styles.enjoy}>{expiryText}</Text>
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
                <Text style={styles.metaValue}>{formatDate(premiumUntil)}</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.block} padding={spacing.lg} strong>
            <Text style={styles.sectionTitle}>Plan Details</Text>

            <InfoRow
              icon="diamond-outline"
              title="Plan"
              value={planTitle}
              rightText={isPremium ? 'Premium' : 'Free'}
            />

            <InfoRow
              icon="wallet-outline"
              title="Amount"
              value={formatMoney(planAmount, planCurrency)}
              rightText={planCurrency}
            />

            <InfoRow
              icon="calendar-outline"
              title="Validity"
              value={validityDays ? `${validityDays} days` : formatDate(premiumUntil)}
            />

            <InfoRow
              icon="shield-checkmark-outline"
              title="Payment Gateway"
              value="Razorpay Secure Checkout"
              rightText="Verified"
              rightTone="success"
            />
          </Card>

          <Card style={styles.block} padding={spacing.lg} strong>
            <Text style={styles.sectionTitle}>Latest Payment</Text>

            <InfoRow
              icon="receipt-outline"
              title="Payment Status"
              value={String(paymentStatus).toUpperCase()}
              rightText={isPremium ? 'Synced' : undefined}
              rightTone={isPremium ? 'success' : 'muted'}
            />

            <InfoRow
              icon="card-outline"
              title="Payment ID"
              value={shortId(paymentId)}
            />

            <InfoRow
              icon="document-text-outline"
              title="Order ID"
              value={shortId(orderId)}
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
              title={isPremium ? 'Renew Premium' : 'Upgrade Premium'}
              value={
                isPremium
                  ? 'Choose a plan and extend access'
                  : 'Unlock premium wallpapers'
              }
              onPress={goToPremium}
            />

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
                <Text style={styles.securityTitle}>Secure Razorpay Payment</Text>
                <Text style={styles.securityText}>
                  Your payment is handled by Razorpay. FlexiWalls only stores
                  the verified order and payment status from our backend.
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  rightText?: string;
  rightTone?: 'success' | 'warning' | 'muted';
  isLast?: boolean;
};

const InfoRow = ({
  icon,
  title,
  value,
  rightText,
  rightTone = 'muted',
  isLast,
}: InfoRowProps) => (
  <View style={[styles.detailRow, isLast && styles.noBorder]}>
    <View style={styles.detailIcon}>
      <Ionicons name={icon} size={20} color={colors.accent} />
    </View>

    <View style={styles.detailTextWrap}>
      <Text style={styles.detailTitle}>{title}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value || '--'}
      </Text>
    </View>

    {rightText ? (
      <Text
        style={[
          styles.detailRight,
          rightTone === 'success' && styles.successText,
          rightTone === 'warning' && styles.warningText,
        ]}
      >
        {rightText}
      </Text>
    ) : null}
  </View>
);

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  onPress: () => void;
  isLast?: boolean;
};

const ActionRow = ({ icon, title, value, onPress, isLast }: ActionRowProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.manageRow,
      isLast && styles.noBorder,
      pressed && { opacity: 0.72 },
    ]}
    onPress={onPress}
  >
    <View style={styles.detailIcon}>
      <Ionicons name={icon} size={20} color={colors.accent} />
    </View>

    <View style={styles.detailTextWrap}>
      <Text style={styles.detailTitle}>{title}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>

    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
  </Pressable>
);

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

  crownChip: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  planInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },

  planLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  planName: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    flex: 1,
    marginRight: spacing.sm,
  },

  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgePremium: {
    backgroundColor: 'rgba(52,211,153,0.15)',
  },

  badgeFree: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  activeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  enjoyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  enjoy: {
    color: colors.textSecondary,
    marginLeft: 6,
    fontSize: 13,
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

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },

  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
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

  detailValue: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  detailRight: {
    color: MUTED,
    fontWeight: '800',
    fontSize: 12,
  },

  successText: {
    color: SUCCESS,
  },

  warningText: {
    color: WARNING,
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