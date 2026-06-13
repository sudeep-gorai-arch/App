import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors, gradients } from '../../styles/colors';
import { spacing, radius } from '../../utils/constants';
import { RootStackParamList } from '../../navigation/RootStackParamList';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

const PAY_GRADIENT = ['#EC4899', '#A855F7', '#3B82F6'] as const;

type Method = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const METHODS: Method[] = [
  { id: 'card', title: 'Credit / Debit Card', subtitle: 'Visa, MasterCard, American Express', icon: 'card-outline' },
  { id: 'paypal', title: 'PayPal', subtitle: 'Pay securely with your PayPal account', icon: 'logo-paypal' },
  { id: 'apple', title: 'Apple Pay', subtitle: 'Pay with your Apple Wallet', icon: 'logo-apple' },
  { id: 'google', title: 'Google Pay', subtitle: 'Pay with your Google Account', icon: 'logo-google' },
];

const BRANDS = ['VISA', 'MC', 'AMEX'];

const PaymentScreen = ({ navigation, route }: Props) => {
  const planLabel = route.params?.planLabel ?? 'Annual';
  const subtotal = route.params?.price ?? 19.99;
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const [method, setMethod] = useState('card');
  const [saveCard, setSaveCard] = useState(true);
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holder, setHolder] = useState('');

  const onPay = () => {
    Alert.alert(
      'Payment successful',
      `Your ${planLabel} subscription is now active.`,
      [{ text: 'Done', onPress: () => navigation.popToTop() }],
    );
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="category" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RoundButton icon="chevron-back" onPress={() => navigation.goBack()} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Payment</Text>
            <View style={styles.headerSubRow}>
              <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
              <Text style={styles.headerSub}>Secure and encrypted payment</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          >
            {/* Order summary */}
            <Card style={styles.section} padding={spacing.lg} strong>
              <Text style={styles.cardHeading}>Order Summary</Text>

              <View style={styles.summaryTop}>
                <LinearGradient colors={gradients.violetMagenta} style={styles.planIcon}>
                  <MaterialCommunityIcons name="crown" size={24} color={colors.textPrimary} />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.planTitle}>Premium Access – {planLabel}</Text>
                  <Text style={styles.planSub}>1 Year Subscription</Text>
                </View>
                <Text style={styles.planPrice}>${subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.lineRow}>
                <Text style={styles.lineLabel}>Subtotal</Text>
                <Text style={styles.lineValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.lineRow}>
                <Text style={styles.lineLabel}>Tax (10%)</Text>
                <Text style={styles.lineValue}>${tax.toFixed(2)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.lineRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </Card>

            {/* Payment methods */}
            <Text style={styles.sectionTitle}>Choose Payment Method</Text>
            <View style={styles.section}>
              {METHODS.map(m => {
                const active = m.id === method;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setMethod(m.id)}
                    style={[styles.method, active && styles.methodActive]}
                  >
                    <View style={styles.methodIcon}>
                      <Ionicons name={m.icon} size={22} color={colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={styles.methodTitle}>{m.title}</Text>
                      <Text style={styles.methodSub}>{m.subtitle}</Text>
                    </View>
                    {active ? (
                      <View style={styles.radioOn}>
                        <View style={styles.radioDot} />
                      </View>
                    ) : (
                      <View style={styles.radioOff} />
                    )}
                  </Pressable>
                );
              })}

              <Pressable style={styles.method}>
                <View style={styles.methodIcon}>
                  <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.methodTitle}>More Options</Text>
                  <Text style={styles.methodSub}>Other payment methods</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Card details */}
            {method === 'card' ? (
              <>
                <Text style={styles.sectionTitle}>Card Details</Text>
                <Card style={styles.section} padding={spacing.lg} strong>
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>Card Number</Text>
                    <View style={styles.brandRow}>
                      {BRANDS.map(b => (
                        <View key={b} style={styles.brandChip}>
                          <Text style={styles.brandText}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    value={card}
                    onChangeText={setCard}
                    selectionColor={colors.accent}
                  />

                  <View style={styles.twoCol}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Expiry Date</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="MM / YY"
                        placeholderTextColor={colors.textTertiary}
                        value={expiry}
                        onChangeText={setExpiry}
                        selectionColor={colors.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>CVV</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="number-pad"
                        secureTextEntry
                        value={cvv}
                        onChangeText={setCvv}
                        selectionColor={colors.accent}
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Cardholder Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Name on card"
                    placeholderTextColor={colors.textTertiary}
                    value={holder}
                    onChangeText={setHolder}
                    autoCapitalize="words"
                    selectionColor={colors.accent}
                  />
                </Card>

                <Pressable
                  style={styles.saveRow}
                  onPress={() => setSaveCard(s => !s)}
                  hitSlop={6}
                >
                  {saveCard ? (
                    <LinearGradient colors={gradients.violetMagenta} style={styles.checkbox}>
                      <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.checkbox, styles.checkboxOff]} />
                  )}
                  <Text style={styles.saveText}>Save card for faster payments</Text>
                </Pressable>
              </>
            ) : null}

            {/* Pay CTA */}
            <Pressable
              onPress={onPay}
              style={({ pressed }) => [
                styles.payWrap,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={PAY_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pay}
              >
                <Ionicons name="lock-closed" size={20} color={colors.textPrimary} />
                <Text style={styles.payText}>Pay ${total.toFixed(2)}</Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.secureRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.secureText}>Your payment is secure and encrypted</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default PaymentScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },

  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  headerLeft: { position: 'absolute', left: spacing.xl, top: 4 },
  headerTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 2 },
  headerSub: { color: colors.textSecondary, fontSize: 13 },

  section: { marginHorizontal: spacing.xl, marginTop: spacing.lg },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
  },

  // order summary
  cardHeading: { color: colors.textPrimary, fontSize: 19, fontWeight: '800', marginBottom: spacing.lg },
  summaryTop: { flexDirection: 'row', alignItems: 'center' },
  planIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  planSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  planPrice: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: spacing.md },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  lineLabel: { color: colors.textSecondary, fontSize: 15 },
  lineValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  totalLabel: { color: colors.textPrimary, fontSize: 19, fontWeight: '800' },
  totalValue: { color: colors.accent, fontSize: 22, fontWeight: '800' },

  // methods
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    backgroundColor: colors.glassFillSoft,
  },
  methodActive: {
    borderColor: colors.accentStrong,
    borderWidth: 1.5,
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  methodTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  methodSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  radioOn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textPrimary },
  radioOff: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.glassBorder },

  // card details
  fieldHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.md, marginBottom: 6 },
  brandRow: { flexDirection: 'row', gap: 6, marginTop: spacing.md },
  brandChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  brandText: { color: colors.textPrimary, fontSize: 10, fontWeight: '800' },
  input: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  twoCol: { flexDirection: 'row', gap: spacing.md },

  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  checkbox: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkboxOff: { borderWidth: 1.5, borderColor: colors.glassBorder, backgroundColor: 'transparent' },
  saveText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },

  // pay
  payWrap: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    borderRadius: radius.pill,
    shadowColor: colors.accentPink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
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
  payText: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  secureText: { color: colors.textSecondary, fontSize: 13 },
});
