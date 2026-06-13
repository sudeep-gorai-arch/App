import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors, gradients } from '../../styles/colors';
import { spacing, radius } from '../../utils/constants';

type Nav = { goBack?: () => void };

const CTA = ['#F472B6', '#A855F7', '#3B82F6'];

const METHODS = [
  { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, MasterCard, American Express', icon: 'card-outline' },
  { id: 'paypal', label: 'PayPal', desc: 'Pay securely with your PayPal account', icon: 'logo-paypal' },
  { id: 'apple', label: 'Apple Pay', desc: 'Pay with your Apple Wallet', icon: 'logo-apple' },
  { id: 'google', label: 'Google Pay', desc: 'Pay with your Google Account', icon: 'logo-google' },
] as const;

const Radio = ({ on }: { on: boolean }) => (
  <View style={[styles.radio, on && styles.radioOn]}>
    {on ? <View style={styles.radioDot} /> : null}
  </View>
);

const PaymentScreen = ({ navigation }: { navigation?: Nav }) => {
  const [method, setMethod] = useState<string>('card');
  const [saveCard, setSaveCard] = useState(true);
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const set = (k: keyof typeof card) => (v: string) => setCard(c => ({ ...c, [k]: v }));

  return (
    <View style={styles.root}>
      <MeshBackground variant="about" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <RoundButton icon="chevron-back" onPress={() => navigation?.goBack?.()} />
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Payment</Text>
                <View style={styles.secureRow}>
                  <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
                  <Text style={styles.secureText}>Secure and encrypted payment</Text>
                </View>
              </View>
              <View style={{ width: 46 }} />
            </View>

            {/* Order summary */}
            <Card style={styles.block} padding={spacing.lg} strong>
              <Text style={styles.blockTitle}>Order Summary</Text>
              <View style={styles.orderRow}>
                <LinearGradient colors={gradients.violetMagenta} style={styles.crownChip}>
                  <MaterialCommunityIcons name="crown" size={20} color={colors.textPrimary} />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.planName}>Premium Access – Annual</Text>
                  <Text style={styles.planSub}>1 Year Subscription</Text>
                </View>
                <Text style={styles.planPrice}>$19.99</Text>
              </View>
              <View style={styles.hr} />
              <Row label="Subtotal" value="$19.99" />
              <Row label="Tax (10%)" value="$2.00" />
              <View style={styles.hr} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>$21.99</Text>
              </View>
            </Card>

            {/* Payment method */}
            <Text style={styles.sectionTitle}>Choose Payment Method</Text>
            <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
              {METHODS.map(m => {
                const active = method === m.id;
                return (
                  <Pressable key={m.id} onPress={() => setMethod(m.id)}>
                    <Card
                      padding={spacing.lg}
                      glowBorder={active}
                      strong={active}
                    >
                      <View style={styles.methodRow}>
                        <View style={styles.methodIcon}>
                          <Ionicons name={m.icon as any} size={20} color={colors.textPrimary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <Text style={styles.methodLabel}>{m.label}</Text>
                          <Text style={styles.methodDesc}>{m.desc}</Text>
                        </View>
                        <Radio on={active} />
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
              <Pressable>
                <Card padding={spacing.lg}>
                  <View style={styles.methodRow}>
                    <View style={styles.methodIcon}>
                      <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={styles.methodLabel}>More Options</Text>
                      <Text style={styles.methodDesc}>Other payment methods</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </Card>
              </Pressable>
            </View>

            {/* Card details */}
            <Text style={styles.sectionTitle}>Card Details</Text>
            <Card style={styles.block} padding={spacing.lg}>
              <Text style={styles.fieldLabel}>Card Number</Text>
              <TextInput
                style={styles.field}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={card.number}
                onChangeText={set('number')}
                selectionColor={colors.accent}
              />
              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.field}
                    placeholder="MM / YY"
                    placeholderTextColor={colors.textTertiary}
                    value={card.expiry}
                    onChangeText={set('expiry')}
                    selectionColor={colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>CVV</Text>
                  <TextInput
                    style={styles.field}
                    placeholder="123"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    secureTextEntry
                    value={card.cvv}
                    onChangeText={set('cvv')}
                    selectionColor={colors.accent}
                  />
                </View>
              </View>
              <Text style={styles.fieldLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.field}
                placeholder="Name on card"
                placeholderTextColor={colors.textTertiary}
                value={card.name}
                onChangeText={set('name')}
                selectionColor={colors.accent}
              />
            </Card>

            {/* Save card */}
            <Pressable
              style={styles.saveRow}
              onPress={() => setSaveCard(s => !s)}
            >
              <View style={[styles.checkbox, saveCard && styles.checkboxOn]}>
                {saveCard ? <Ionicons name="checkmark" size={16} color={colors.textPrimary} /> : null}
              </View>
              <Text style={styles.saveText}>Save card for faster payments</Text>
            </Pressable>

            {/* Pay CTA */}
            <Pressable style={({ pressed }) => [styles.ctaWrap, pressed && { opacity: 0.85 }]}>
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                <Ionicons name="lock-closed" size={18} color={colors.textPrimary} />
                <Text style={styles.ctaText}>Pay $21.99</Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.footer}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.footerText}>Your payment is secure and encrypted</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryLine}>
    <Text style={styles.summaryLineLabel}>{label}</Text>
    <Text style={styles.summaryLineValue}>{value}</Text>
  </View>
);

export default PaymentScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  secureText: { color: colors.textSecondary, fontSize: 13 },
  block: { marginHorizontal: spacing.xl, marginTop: spacing.xl },
  blockTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: spacing.md },
  orderRow: { flexDirection: 'row', alignItems: 'center' },
  crownChip: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  planSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  planPrice: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: spacing.md },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLineLabel: { color: colors.textSecondary, fontSize: 15 },
  summaryLineValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  totalValue: { color: colors.accentPink, fontSize: 22, fontWeight: '800' },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  methodRow: { flexDirection: 'row', alignItems: 'center' },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
  },
  methodLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  methodDesc: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.accentStrong },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.textPrimary },
  fieldLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: spacing.md },
  field: {
    color: colors.textPrimary,
    fontSize: 16,
    height: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  fieldRow: { flexDirection: 'row', gap: spacing.md },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.accentStrong, borderColor: colors.accentStrong },
  saveText: { color: colors.textPrimary, fontSize: 15 },
  ctaWrap: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 58,
    borderRadius: radius.pill,
    shadowColor: colors.accentStrong,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  ctaText: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  footerText: { color: colors.textTertiary, fontSize: 13 },
});
