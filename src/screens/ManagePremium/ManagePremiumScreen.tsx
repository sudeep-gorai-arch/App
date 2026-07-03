import React, { useEffect, useMemo, useState } from 'react';

import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';

import { colors, gradients } from '../../styles/colors';

import { spacing, radius } from '../../utils/constants';

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

const DANGER = '#FF5A6E';

interface Props {
  navigation?: Nav;
}

const ManagePremiumScreen = ({ navigation }: Props) => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const [status, setStatus] = useState<any>(null);

  const [autoRenew, setAutoRenew] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [planResponse, statusResponse] = await Promise.all([
        getSubscriptionPlans(),
        getSubscriptionStatus(),
      ]);

      setPlans(planResponse.data);

      setStatus(statusResponse.data);
    } catch (e) {
      console.log(e);

      toast.error('Unable to load subscription.');
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = useMemo(() => {
    if (!status?.isPremium) return null;

    return plans.find(p => p.plan === status.subscription?.plan) ?? null;
  }, [plans, status]);

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
        <ActivityIndicator size="large" color={colors.accent} />

        <Text
          style={{
            color: colors.textSecondary,
            marginTop: 16,
          }}
        >
          Loading Subscription...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: spacing.xxl,
          }}
        >
          {/* ===========================
              HEADER
          =========================== */}

          <View style={styles.header}>
            <RoundButton
              icon="chevron-back"
              onPress={() => navigation?.goBack?.()}
            />

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Manage Premium</Text>

              <Text style={styles.headerSub}>
                View and manage your Premium subscription.
              </Text>
            </View>

            <View style={{ width: 46 }} />
          </View>

          {/* ===========================
              CURRENT PLAN
          =========================== */}

          <Card style={styles.block} padding={spacing.lg} glowBorder strong>
            <View style={styles.planTop}>
              <LinearGradient
                colors={gradients.violetMagenta}
                style={styles.crownChip}
              >
                <MaterialCommunityIcons
                  name="crown"
                  size={34}
                  color={colors.textPrimary}
                />
              </LinearGradient>

              <View
                style={{
                  flex: 1,
                  marginLeft: spacing.lg,
                }}
              >
                <Text style={styles.planLabel}>Current Plan</Text>

                <View style={styles.planNameRow}>
                  <Text style={styles.planName}>
                    {currentPlan ? currentPlan.title : 'Free'}
                  </Text>

                  <View
                    style={[
                      styles.activeBadge,
                      !status?.isPremium && {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      },
                    ]}
                  >
                    <Text style={styles.activeText}>
                      {status?.isPremium ? 'ACTIVE' : 'FREE'}
                    </Text>
                  </View>
                </View>

                <View style={styles.enjoyRow}>
                  <Text style={styles.enjoy}>
                    {status?.isPremium
                      ? 'Enjoying all Premium benefits'
                      : 'Upgrade to unlock Premium'}
                  </Text>

                  {status?.isPremium && (
                    <Ionicons
                      name="shield-checkmark"
                      size={14}
                      color="#34D399"
                    />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.hr} />

            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Member Since</Text>

                <Text style={styles.metaValue}>
                  {status?.subscription?.startDate
                    ? new Date(
                        status.subscription.startDate,
                      ).toLocaleDateString()
                    : '--'}
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Premium Until</Text>

                <Text style={styles.metaValue}>
                  {status?.premiumUntil
                    ? new Date(status.premiumUntil).toLocaleDateString()
                    : '--'}
                </Text>
              </View>
            </View>
          </Card>

          {/* ===========================
              SUBSCRIPTION DETAILS
          =========================== */}

          <Card style={styles.block} padding={spacing.lg} strong>
            <Text style={styles.sectionTitle}>Subscription Details</Text>

            {/* Plan */}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="diamond-outline"
                  size={20}
                  color={colors.accent}
                />
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: spacing.md,
                }}
              >
                <Text style={styles.detailTitle}>Current Plan</Text>

                <Text style={styles.detailValue}>
                  {currentPlan?.title ?? 'Free'}
                </Text>
              </View>

              {status?.isPremium && (
                <View style={styles.bestValue}>
                  <Text style={styles.bestValueText}>ACTIVE</Text>
                </View>
              )}
            </View>

            {/* Billing */}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="card-outline" size={20} color={colors.accent} />
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: spacing.md,
                }}
              >
                <Text style={styles.detailTitle}>Billing</Text>

                <Text style={styles.detailValue}>
                  {currentPlan
                    ? `${currentPlan.amount} ${currentPlan.currency}`
                    : '--'}
                </Text>
              </View>

              <Text style={styles.detailRight}>{currentPlan?.plan ?? ''}</Text>
            </View>

            {/* Validity */}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.accent}
                />
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: spacing.md,
                }}
              >
                <Text style={styles.detailTitle}>Validity</Text>

                <Text style={styles.detailValue}>
                  {currentPlan ? `${currentPlan.validityDays} Days` : '--'}
                </Text>
              </View>
            </View>

            {/* Premium Until */}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="time-outline" size={20} color={colors.accent} />
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: spacing.md,
                }}
              >
                <Text style={styles.detailTitle}>Premium Until</Text>

                <Text style={styles.detailValue}>
                  {status?.premiumUntil
                    ? new Date(status.premiumUntil).toLocaleDateString()
                    : '--'}
                </Text>
              </View>
            </View>

            {/* Auto Renewal */}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="sync-outline" size={20} color={colors.accent} />
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: spacing.md,
                }}
              >
                <Text style={styles.detailTitle}>Auto Renewal</Text>

                <Text style={styles.detailValue}>
                  {autoRenew ? 'Enabled' : 'Disabled'}
                </Text>
              </View>

              <Pressable onPress={() => setAutoRenew(!autoRenew)}>
                {autoRenew ? (
                  <LinearGradient
                    colors={gradients.blueViolet}
                    style={[
                      styles.track,
                      {
                        alignItems: 'flex-end',
                      },
                    ]}
                  >
                    <View style={styles.knob} />
                  </LinearGradient>
                ) : (
                  <View style={[styles.track, styles.trackOff]}>
                    <View style={styles.knob} />
                  </View>
                )}
              </Pressable>
            </View>
          </Card>

          {/* ===========================
              MANAGE SUBSCRIPTION
          =========================== */}

          <Card style={styles.block} padding={spacing.lg} strong>
            <Text style={styles.sectionTitle}>Manage Subscription</Text>

            {/* Payment Method */}

            <Pressable
              style={({ pressed }) => [
                styles.manageRow,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => toast.info('Coming Soon')}
            >
              <View style={styles.detailIcon}>
                <Ionicons name="card-outline" size={20} color={colors.accent} />
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: spacing.md,
                }}
              >
                <Text style={styles.detailTitle}>Payment Method</Text>

                <Text style={styles.detailValue}>Razorpay Secure Payment</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>

            {/* Billing History */}

            <Pressable
              style={({ pressed }) => [
                styles.manageRow,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => toast.info('Billing history coming soon.')}
            >
              <View style={styles.detailIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={20}
                  color={colors.accent}
                />
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: spacing.md,
                }}
              >
                <Text style={styles.detailTitle}>Billing History</Text>

                <Text style={styles.detailValue}>View all your payments</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>

            {/* Upgrade */}

            {!status?.isPremium && (
              <Pressable
                style={({ pressed }) => [
                  styles.manageRow,
                  pressed && {
                    opacity: 0.7,
                  },
                ]}
                onPress={() => navigation?.navigate?.('Premium')}
              >
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="rocket-outline"
                    size={20}
                    color={colors.accent}
                  />
                </View>

                <View
                  style={{
                    flex: 1,
                    marginLeft: spacing.md,
                  }}
                >
                  <Text style={styles.detailTitle}>Upgrade Plan</Text>

                  <Text style={styles.detailValue}>
                    Unlock Premium Wallpapers
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}

            {/* Restore Purchase */}

            <Pressable
              style={({ pressed }) => [
                styles.manageRow,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() =>
                toast.info('Restore purchase is not required for Razorpay.')
              }
            >
              <View style={styles.detailIcon}>
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={colors.accent}
                />
              </View>

              <View
                style={{
                  flex: 1,
                  marginLeft: spacing.md,
                }}
              >
                <Text style={styles.detailTitle}>Restore Purchase</Text>

                <Text style={styles.detailValue}>Sync your subscription</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>

            {/* Cancel */}

            {status?.isPremium && (
              <Pressable
                style={({ pressed }) => [
                  styles.manageRow,
                  pressed && {
                    opacity: 0.7,
                  },
                ]}
                onPress={() => navigation?.navigate?.('CancelPremium')}
              >
                <View
                  style={[
                    styles.detailIcon,
                    {
                      backgroundColor: 'rgba(255,90,110,0.15)',
                    },
                  ]}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color={DANGER}
                  />
                </View>

                <View
                  style={{
                    flex: 1,
                    marginLeft: spacing.md,
                  }}
                >
                  <Text
                    style={[
                      styles.detailTitle,
                      {
                        color: DANGER,
                      },
                    ]}
                  >
                    Cancel Subscription
                  </Text>

                  <Text style={styles.detailValue}>
                    Premium remains active until expiry.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          </Card>

          {/* ===========================
              PREMIUM BENEFITS
          =========================== */}

          <Card style={styles.block} padding={spacing.lg} strong>
            <Text style={styles.sectionTitle}>Premium Benefits</Text>

            {[
              'Unlimited 4K & 8K Downloads',
              'Exclusive Premium Wallpapers',
              'No Ads Experience',
              'Early Access to New Collections',
              'Faster Download Speeds',
            ].map(benefit => (
              <View key={benefit} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>

                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </Card>

          {/* ===========================
              SECURITY
          =========================== */}

          <Card style={styles.block} padding={spacing.lg} strong>
            <View style={styles.securityRow}>
              <View style={styles.securityIcon}>
                <Ionicons name="shield-checkmark" size={30} color="#34D399" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.securityTitle}>Secure Payments</Text>

                <Text style={styles.securityText}>
                  Your subscription is processed securely through Razorpay using
                  encrypted payment gateways.
                </Text>
              </View>
            </View>
          </Card>

          {/* ===========================
              SUPPORT
          =========================== */}

          <Pressable
            style={({ pressed }) => [
              styles.supportButton,
              pressed && {
                opacity: 0.8,
              },
            ]}
            onPress={() => toast.info('Support screen coming soon.')}
          >
            <LinearGradient
              colors={gradients.blueViolet}
              style={styles.supportGradient}
            >
              <Ionicons name="headset" size={22} color="#FFF" />

              <Text style={styles.supportText}>Contact Support</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ManagePremiumScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
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

  block: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.lg,
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
  },

  activeBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  activeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  enjoyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  enjoy: {
    color: colors.textSecondary,
    marginRight: 6,
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

  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },

  bestValue: {
    backgroundColor: 'rgba(168,85,247,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  bestValueText: {
    color: '#A855F7',
    fontSize: 11,
    fontWeight: '700',
  },

  track: {
    width: 52,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  trackOff: {
    backgroundColor: '#3A3A42',
    alignItems: 'flex-start',
  },

  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },

  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },

  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  benefitIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  benefitText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  securityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34,197,94,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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

  supportButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xxxl,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },

  supportGradient: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  supportText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  disabledButton: {
    opacity: 0.45,
  },

  dangerText: {
    color: '#FF5A6E',
  },

  successText: {
    color: '#34D399',
  },

  warningText: {
    color: '#FBBF24',
  },

  valueText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },

  caption: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: spacing.lg,
  },

  footerSpace: {
    height: spacing.xxxl,
  },
});
