import React, { useState } from 'react';

import {
Alert,
KeyboardAvoidingView,
Platform,
Pressable,
ScrollView,
StyleSheet,
Text,
TextInput,
View,
} from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

type MethodId = 'card' | 'upi' | 'google' | 'netbanking';

type Method = {
id: MethodId;
title: string;
subtitle: string;
icon: keyof typeof Ionicons.glyphMap;
};

const PAY_GRADIENT = ['#EC4899', '#A855F7', '#3B82F6'] as const;

const METHODS: Method[] = [
{
id: 'card',
title: 'Credit / Debit Card',
subtitle: 'Visa, Mastercard and RuPay',
icon: 'card-outline',
},
{
id: 'upi',
title: 'UPI',
subtitle: 'Pay using any UPI application',
icon: 'phone-portrait-outline',
},
{
id: 'google',
title: 'Google Pay',
subtitle: 'Pay using your Google Pay account',
icon: 'logo-google',
},
{
id: 'netbanking',
title: 'Net Banking',
subtitle: 'Pay directly from your bank account',
icon: 'business-outline',
},
];

const BRANDS = ['VISA', 'MC', 'RUPAY'];

const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

const getPlanDescription = (planLabel: string) => {
switch (planLabel) {
case 'Lifetime PRO':
return 'One-time purchase';


case 'Monthly':
  return '1 Month Subscription';

case 'Yearly':
  return '1 Year Subscription';

default:
  return 'FlexiWalls Premium';


}
};

const PaymentScreen = ({ navigation, route }: Props) => {
const planLabel = route.params?.planLabel ?? 'Lifetime PRO';
const subtotal = route.params?.price ?? 799;
const total = subtotal;
const planDescription = getPlanDescription(planLabel);

const [method, setMethod] = useState<MethodId>('card');
const [saveCard, setSaveCard] = useState(true);
const [card, setCard] = useState('');
const [expiry, setExpiry] = useState('');
const [cvv, setCvv] = useState('');
const [holder, setHolder] = useState('');

const onPay = () => {
if (
method === 'card' &&
(!card.trim() || !expiry.trim() || !cvv.trim() || !holder.trim())
) {
Alert.alert(
'Card details required',
'Please complete all card fields.',
);
return;
}


Alert.alert(
  'Payment successful',
  `Your ${planLabel} plan is now active.`,
  [
    {
      text: 'Done',
      onPress: () => navigation.popToTop(),
    },
  ],
);


};

return ( <View style={styles.root}> <MeshBackground variant="category" />

```
  <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <RoundButton
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
      </View>

      <View>
        <Text style={styles.headerTitle}>Payment</Text>

        <View style={styles.headerSubRow}>
          <Ionicons
            name="lock-closed"
            size={12}
            color={colors.textSecondary}
          />

          <Text style={styles.headerSub}>
            Secure and encrypted payment
          </Text>
        </View>
      </View>
    </View>

    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <Card
          style={styles.section}
          padding={spacing.lg}
          strong
        >
          <Text style={styles.cardHeading}>Order Summary</Text>

          <View style={styles.summaryTop}>
            <LinearGradient
              colors={gradients.violetMagenta}
              style={styles.planIcon}
            >
              <MaterialCommunityIcons
                name="crown"
                size={24}
                color={colors.textPrimary}
              />
            </LinearGradient>

            <View style={styles.planTextWrap}>
              <Text style={styles.planTitle} numberOfLines={1}>
                FlexiWalls {planLabel}
              </Text>

              <Text style={styles.planSub}>
                {planDescription}
              </Text>
            </View>

            <Text style={styles.planPrice}>
              {formatCurrency(subtotal)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>Plan price</Text>

            <Text style={styles.lineValue}>
              {formatCurrency(subtotal)}
            </Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>Taxes</Text>

            <Text style={styles.includedText}>Included</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.lineRow}>
            <Text style={styles.totalLabel}>Total</Text>

            <Text style={styles.totalValue}>
              {formatCurrency(total)}
            </Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>
          Choose Payment Method
        </Text>

        <View style={styles.section}>
          {METHODS.map(item => {
            const active = item.id === method;

            return (
              <Pressable
                key={item.id}
                onPress={() => setMethod(item.id)}
                style={[
                  styles.method,
                  active && styles.methodActive,
                ]}
              >
                <View style={styles.methodIcon}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={colors.textPrimary}
                  />
                </View>

                <View style={styles.methodTextWrap}>
                  <Text style={styles.methodTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.methodSub}>
                    {item.subtitle}
                  </Text>
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
        </View>

        {method === 'card' ? (
          <>
            <Text style={styles.sectionTitle}>
              Card Details
            </Text>

            <Card
              style={styles.section}
              padding={spacing.lg}
              strong
            >
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.fieldLabel}>
                  Card Number
                </Text>

                <View style={styles.brandRow}>
                  {BRANDS.map(brand => (
                    <View key={brand} style={styles.brandChip}>
                      <Text style={styles.brandText}>
                        {brand}
                      </Text>
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
                maxLength={19}
              />

              <View style={styles.twoCol}>
                <View style={styles.flexOne}>
                  <Text style={styles.fieldLabel}>
                    Expiry Date
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="MM / YY"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    value={expiry}
                    onChangeText={setExpiry}
                    selectionColor={colors.accent}
                    maxLength={7}
                  />
                </View>

                <View style={styles.flexOne}>
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
                    maxLength={4}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>
                Cardholder Name
              </Text>

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
              onPress={() => setSaveCard(current => !current)}
              hitSlop={6}
            >
              {saveCard ? (
                <LinearGradient
                  colors={gradients.violetMagenta}
                  style={styles.checkbox}
                >
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={colors.textPrimary}
                  />
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.checkbox,
                    styles.checkboxOff,
                  ]}
                />
              )}

              <Text style={styles.saveText}>
                Save card for faster payments
              </Text>
            </Pressable>
          </>
        ) : null}

        <Pressable
          onPress={onPay}
          style={({ pressed }) => [
            styles.payWrap,
            {
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
            <Ionicons
              name="lock-closed"
              size={20}
              color={colors.textPrimary}
            />

            <Text style={styles.payText}>
              Pay {formatCurrency(total)}
            </Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.secureRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={colors.textSecondary}
          />

          <Text style={styles.secureText}>
            Your payment is secure and encrypted
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

keyboardView: {
flex: 1,
},

scrollContent: {
paddingBottom: spacing.xxxl,
},

flexOne: {
flex: 1,
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

sectionTitle: {
color: colors.textPrimary,
fontSize: 18,
fontWeight: '800',
marginTop: spacing.xl,
marginHorizontal: spacing.xl,
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
width: 52,
height: 52,
borderRadius: 14,
alignItems: 'center',
justifyContent: 'center',
},

planTextWrap: {
flex: 1,
marginLeft: spacing.md,
marginRight: spacing.sm,
},

planTitle: {
color: colors.textPrimary,
fontSize: 16,
fontWeight: '700',
},

planSub: {
color: colors.textSecondary,
fontSize: 13,
marginTop: 2,
},

planPrice: {
color: colors.textPrimary,
fontSize: 18,
fontWeight: '800',
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
paddingVertical: 3,
},

lineLabel: {
color: colors.textSecondary,
fontSize: 15,
},

lineValue: {
color: colors.textPrimary,
fontSize: 15,
fontWeight: '600',
},

includedText: {
color: '#4ADE80',
fontSize: 14,
fontWeight: '700',
},

totalLabel: {
color: colors.textPrimary,
fontSize: 19,
fontWeight: '800',
},

totalValue: {
color: colors.accent,
fontSize: 22,
fontWeight: '800',
},

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

methodTextWrap: {
flex: 1,
marginLeft: spacing.md,
},

methodTitle: {
color: colors.textPrimary,
fontSize: 16,
fontWeight: '700',
},

methodSub: {
color: colors.textSecondary,
fontSize: 13,
marginTop: 2,
},

radioOn: {
width: 22,
height: 22,
borderRadius: 11,
backgroundColor: colors.accentStrong,
alignItems: 'center',
justifyContent: 'center',
},

radioDot: {
width: 8,
height: 8,
borderRadius: 4,
backgroundColor: colors.textPrimary,
},

radioOff: {
width: 22,
height: 22,
borderRadius: 11,
borderWidth: 2,
borderColor: colors.glassBorder,
},

fieldHeaderRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},

fieldLabel: {
color: colors.textSecondary,
fontSize: 13,
marginTop: spacing.md,
marginBottom: 6,
},

brandRow: {
flexDirection: 'row',
gap: 6,
marginTop: spacing.md,
},

brandChip: {
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 6,
backgroundColor: colors.glassFill,
borderWidth: StyleSheet.hairlineWidth,
borderColor: colors.glassBorderSoft,
},

brandText: {
color: colors.textPrimary,
fontSize: 10,
fontWeight: '800',
},

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

twoCol: {
flexDirection: 'row',
gap: spacing.md,
},

saveRow: {
flexDirection: 'row',
alignItems: 'center',
gap: spacing.md,
marginHorizontal: spacing.xl,
marginTop: spacing.lg,
},

checkbox: {
width: 26,
height: 26,
borderRadius: 8,
alignItems: 'center',
justifyContent: 'center',
},

checkboxOff: {
borderWidth: 1.5,
borderColor: colors.glassBorder,
backgroundColor: 'transparent',
},

saveText: {
color: colors.textPrimary,
fontSize: 15,
fontWeight: '600',
},

payWrap: {
marginHorizontal: spacing.xl,
marginTop: spacing.xxl,
borderRadius: radius.pill,
shadowColor: colors.accentPink,
shadowOffset: {
width: 0,
height: 8,
},
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

payText: {
color: colors.textPrimary,
fontSize: 18,
fontWeight: '800',
},

secureRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 6,
marginTop: spacing.lg,
},

secureText: {
color: colors.textSecondary,
fontSize: 13,
},
});
