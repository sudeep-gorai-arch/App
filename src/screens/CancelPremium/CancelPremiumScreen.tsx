import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors, gradients } from '../../styles/colors';
import { spacing, radius } from '../../utils/constants';

type Nav = { goBack?: () => void };

const DANGER = '#FF5A6E';

const LOSE = [
  { id: 'dl', icon: 'cloud-download-outline', tint: colors.chipViolet, color: colors.accent, title: 'Unlimited Downloads', desc: "You'll no longer be able to download premium wallpapers." },
  { id: 'ex', icon: 'diamond-outline', tint: colors.chipPink, color: colors.accentPink, title: 'Exclusive Content', desc: 'Access to premium collections will be removed.' },
  { id: 'ad', icon: 'ribbon-outline', tint: 'rgba(52,211,153,0.18)', color: '#34D399', title: 'Ad-Free Experience', desc: "You'll start seeing ads in the app again." },
  { id: 'cloud', icon: 'cloud-outline', tint: colors.chipBlue, color: colors.accentBlue, title: 'Cloud Favorites', desc: 'Your saved favorites will no longer be accessible.' },
] as const;

const CancelPremiumScreen = ({ navigation }: { navigation?: Nav }) => {
  const [reason, setReason] = useState<string | null>(null);

  return (
    <View style={styles.root}>
      <MeshBackground variant="about" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          {/* Header */}
          <View style={styles.header}>
            <RoundButton icon="chevron-back" onPress={() => navigation?.goBack?.()} />
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Cancel Premium</Text>
            </View>
            <View style={{ width: 46 }} />
          </View>
          <Text style={styles.lead}>
            We're sad to see you go. If you cancel, you'll lose access to all
            Premium benefits at the end of your billing period.
          </Text>

          {/* Current plan */}
          <Card style={styles.block} padding={spacing.lg} strong>
            <View style={styles.planRow}>
              <LinearGradient colors={gradients.violetMagenta} style={styles.crownChip}>
                <MaterialCommunityIcons name="crown" size={26} color={colors.textPrimary} />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.planLabel}>Your Current Plan</Text>
                <Text style={styles.planName}>Premium Access – Annual</Text>
                <Text style={styles.planSub}>Renews on May 28, 2025</Text>
              </View>
              <Text style={styles.planPrice}>$19.99/year</Text>
            </View>
          </Card>

          {/* What you'll lose */}
          <Text style={styles.sectionTitle}>What you'll lose</Text>
          <Card style={styles.block} padding={spacing.lg} strong>
            {LOSE.map((l, i) => (
              <View key={l.id}>
                <View style={styles.loseRow}>
                  <View style={[styles.loseIcon, { backgroundColor: l.tint }]}>
                    <Ionicons name={l.icon as any} size={22} color={l.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.loseTitle}>{l.title}</Text>
                    <Text style={styles.loseDesc}>{l.desc}</Text>
                  </View>
                </View>
                {i < LOSE.length - 1 ? <View style={styles.hr} /> : null}
              </View>
            ))}
          </Card>

          {/* Reason */}
          <Text style={styles.sectionTitle}>Tell us why you're cancelling (optional)</Text>
          <Pressable style={[styles.block, styles.dropdown]}>
            <Text style={[styles.dropdownText, reason ? { color: colors.textPrimary } : null]}>
              {reason ?? 'Select a reason'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>

          {/* Info */}
          <View style={[styles.block, styles.info]}>
            <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.infoTitle}>You'll still have Premium access until May 28, 2025.</Text>
              <Text style={styles.infoText}>
                You can change your mind anytime before this date and reactivate
                your subscription.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <Pressable style={[styles.block, styles.cancelBtn]}>
            <Text style={styles.cancelText}>Cancel Premium</Text>
          </Pressable>
          <Pressable
            style={[styles.block, styles.keepBtn]}
            onPress={() => navigation?.goBack?.()}
          >
            <Text style={styles.keepText}>Keep Premium</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default CancelPremiumScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  lead: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  block: { marginHorizontal: spacing.xl, marginTop: spacing.lg },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  crownChip: { width: 56, height: 56, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  planLabel: { color: colors.textSecondary, fontSize: 13 },
  planName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 2 },
  planSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  planPrice: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  loseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  loseIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  loseTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  loseDesc: { color: colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 },
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: spacing.xs },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    marginTop: spacing.md,
  },
  dropdownText: { color: colors.textTertiary, fontSize: 16 },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentStrong,
    backgroundColor: 'rgba(124,58,237,0.10)',
    marginTop: spacing.xl,
  },
  infoTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  infoText: { color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 19 },
  cancelBtn: {
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,90,110,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,90,110,0.5)',
    marginTop: spacing.xl,
  },
  cancelText: { color: DANGER, fontSize: 17, fontWeight: '700' },
  keepBtn: {
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillSoft,
    marginTop: spacing.md,
  },
  keepText: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
});
