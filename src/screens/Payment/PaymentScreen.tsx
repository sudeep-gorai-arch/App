import React, { useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import RazorpayCheckout from 'react-native-razorpay';

import { useToast } from '../../components/ui/toast/useToast';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { LinearGradient } from 'expo-linear-gradient';

import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import MeshBackground from '../../components/MeshBackground';

import { RootStackParamList } from '../../navigation/RootStackParamList';

import { colors, gradients } from '../../styles/colors';
import { radius, spacing } from '../../utils/constants';

import { verifyPayment } from '../../services/subscriptionService';

import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

const PAY_GRADIENT = ['#EC4899', '#A855F7', '#3B82F6'] as const;

const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

const getPlanDescription = (plan: string) => {
  switch (plan) {
    case 'MONTHLY':
      return '1 Month Premium';

    case 'QUARTERLY':
      return '3 Months Premium';

    case 'YEARLY':
      return '1 Year Premium';

    case 'LIFETIME':
      return 'Lifetime Premium';

    default:
      return 'FlexiWalls Premium';
  }
};

const PaymentScreen = ({ navigation, route }: Props) => {
  const { refreshProfile } = useAuth();

  const toast = useToast();

  const order = route.params?.order;

  if (!order) {
    return null;
  }

  const [loading, setLoading] = useState(false);

  const total = useMemo(() => order.amount / 100, [order.amount]);

  const planDescription = getPlanDescription(order.plan);

  const handlePayment = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const options = {
        key: order.keyId,

        amount: order.amount,

        currency: order.currency,

        order_id: order.orderId,

        name: 'FlexiWalls',

        description: order.title,

        theme: {
          color: '#A855F7',
        },

        notes: {
          plan: order.plan,
          receipt: order.receipt,
        },

        prefill: {},
      };

      console.log('========== RAZORPAY OPTIONS ==========');
      console.log(JSON.stringify(options, null, 2));

      const payment = await RazorpayCheckout.open({
        key: order.keyId,

        amount: order.amount,

        currency: order.currency,

        order_id: order.orderId,

        name: 'FlexiWalls',

        description: order.title,

        theme: {
          color: '#A855F7',
        },

        notes: {
          plan: order.plan,
          receipt: order.receipt,
        },

        prefill: {},
      });

      await verifyPayment({
        plan: order.plan,

        razorpay_order_id: payment.razorpay_order_id,

        razorpay_payment_id: payment.razorpay_payment_id,

        razorpay_signature: payment.razorpay_signature,
      });

      try {
        await refreshProfile();
      } catch {
        // Premium is already activated on backend.
      }
      toast.success('Premium activated successfully.');

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
          },
        ],
      });
    } catch (error: any) {
      console.log('RAZORPAY ERROR', error);

      /**
       * User closed Razorpay.
       */
      if (error?.code === 0 || error?.description === 'Payment Cancelled') {
        toast.info('Payment cancelled.');

        return;
      }

      /**
       * Payment failed.
       */
      toast.error(error?.description ?? 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="category" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* =========================
                HEADER
            ========================== */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RoundButton
              icon="chevron-back"
              onPress={() => {
                if (loading) {
                  return;
                }

                navigation.goBack();
              }}
            />
          </View>

          <View>
            <Text style={styles.headerTitle}>Secure Payment</Text>

            <View style={styles.headerSubRow}>
              <Ionicons
                name="shield-checkmark"
                size={13}
                color={colors.textSecondary}
              />

              <Text style={styles.headerSub}>Powered by Razorpay</Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* =========================
                    ORDER SUMMARY
                ========================== */}

          <Card style={styles.section} padding={spacing.lg} strong>
            <Text style={styles.cardHeading}>Order Summary</Text>

            <View style={styles.summaryTop}>
              <LinearGradient
                colors={gradients.violetMagenta}
                style={styles.planIcon}
              >
                <MaterialCommunityIcons
                  name="crown"
                  size={26}
                  color={colors.textPrimary}
                />
              </LinearGradient>

              <View style={styles.planTextWrap}>
                <Text style={styles.planTitle}>FlexiWalls Premium</Text>

                <Text style={styles.planSub}>{planDescription}</Text>
              </View>

              <Text style={styles.planPrice}>{formatCurrency(total)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Subscription</Text>

              <Text style={styles.lineValue}>{order.title}</Text>
            </View>

            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Currency</Text>

              <Text style={styles.lineValue}>{order.currency}</Text>
            </View>

            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Taxes</Text>

              <Text style={styles.includedText}>Included</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.lineRow}>
              <Text style={styles.totalLabel}>Total</Text>

              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </Card>

          {/* =========================
                    PAYMENT INFO
                ========================== */}

          <Card style={styles.section} padding={spacing.lg} strong>
            <View style={styles.infoRow}>
              <Ionicons name="lock-closed" size={22} color={colors.accent} />

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Secure Checkout</Text>

                <Text style={styles.infoText}>
                  Your payment will be processed securely using Razorpay. Card
                  details, UPI, Wallets, Net Banking and more are handled
                  entirely by Razorpay.
                </Text>
              </View>
            </View>
          </Card>

          {/* =========================
                    BENEFITS
                ========================== */}

          <Card style={styles.section} padding={spacing.lg} strong>
            <Text style={styles.cardHeading}>Premium Benefits</Text>

            {[
              'Unlimited 4K & 8K Downloads',
              'No Advertisements',
              'Exclusive Premium Wallpapers',
              'Priority Updates',
              'Highest Download Speed',
            ].map(item => (
              <View key={item} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />

                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </Card>

          {/* =========================
                    PAY BUTTON
                ========================== */}

          <Pressable
            disabled={loading}
            onPress={handlePayment}
            style={({ pressed }) => [
              styles.payWrap,
              {
                opacity: loading ? 0.7 : 1,
                transform: [
                  {
                    scale: pressed ? 0.98 : 1,
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={PAY_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pay}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Ionicons name="shield-checkmark" size={20} color="#FFF" />
              )}

              <Text style={styles.payText}>
                {loading
                  ? 'Verifying Payment...'
                  : `Pay ${formatCurrency(total)}`}
              </Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.secureRow}>
            <Ionicons
              name="lock-closed"
              size={15}
              color={colors.textSecondary}
            />

            <Text style={styles.secureText}>
              Payments are securely processed by Razorpay. FlexiWalls never
              stores your card details.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: spacing.xxxl,
  },

  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },

  headerLeft: {
    position: 'absolute',
    left: spacing.xl,
    top: 4,
  },

  headerTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },

  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 2,
  },

  headerSub: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  section: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },

  cardHeading: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },

  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  planIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  planTextWrap: {
    flex: 1,
    marginHorizontal: spacing.md,
  },

  planTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },

  planSub: {
    color: colors.textSecondary,
    marginTop: 3,
    fontSize: 13,
  },

  planPrice: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 22,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },

  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },

  lineLabel: {
    color: colors.textSecondary,
    fontSize: 15,
  },

  lineValue: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },

  includedText: {
    color: '#4ADE80',
    fontWeight: '700',
    fontSize: 15,
  },

  totalLabel: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 19,
  },

  totalValue: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 24,
  },

  /* ===================================
       PAYMENT INFO
    =================================== */

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  infoTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 6,
  },

  infoText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },

  /* ===================================
       BENEFITS
    =================================== */

  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  benefitText: {
    marginLeft: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },

  /* ===================================
       PAY BUTTON
    =================================== */

  payWrap: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    borderRadius: radius.pill,
    shadowColor: colors.accentPink,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },

  pay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: 18,
    borderRadius: radius.pill,
  },

  payText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },

  /* ===================================
       FOOTER
    =================================== */

  secureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginHorizontal: spacing.xl,
    gap: 6,
  },

  secureText: {
    flex: 1,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
});
