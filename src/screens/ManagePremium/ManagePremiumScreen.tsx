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

type Nav = { goBack?: () => void; navigate?: (r: string, p?: any) => void };

const DANGER = '#FF5A6E';

const DETAILS = [
  { id: 'plan', icon: 'calendar-outline', title: 'Plan', value: 'Premium Annual', badge: 'Best Value' },
  { id: 'billing', icon: 'card-outline', title: 'Billing', value: 'Billed annually', right: '$19.99 / year' },
] as const;

const MANAGE = [
  { id: 'pay', icon: 'card-outline', title: 'Update Payment Method', sub: 'Visa •••• 4242' },
  { id: 'change', icon: 'sync-outline', title: 'Change Plan', sub: 'Upgrade or downgrade your plan' },
  { id: 'history', icon: 'time-outline', title: 'Billing History', sub: 'View your past invoices' },
] as const;

const ManagePremiumScreen = ({ navigation }: { navigation?: Nav }) => {
  const [autoRenew, setAutoRenew] = useState(true);

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          {/* Header */}
          <View style={styles.header}>
            <RoundButton icon="chevron-back" onPress={() => navigation?.goBack?.()} />
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Manage Premium</Text>
              <Text style={styles.headerSub}>View and manage your Premium subscription.</Text>
            </View>
            <View style={{ width: 46 }} />
          </View>

          {/* Current plan */}
          <Card style={styles.block} padding={spacing.lg} glowBorder strong>
            <View style={styles.planTop}>
              <LinearGradient colors={gradients.violetMagenta} style={styles.crownChip}>
                <MaterialCommunityIcons name="crown" size={34} color={colors.textPrimary} />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: spacing.lg }}>
                <Text style={styles.planLabel}>Current Plan</Text>
                <View style={styles.planNameRow}>
                  <Text style={styles.planName}>Premium</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                </View>
                <View style={styles.enjoyRow}>
                  <Text style={styles.enjoy}>Enjoying all Premium benefits</Text>
                  <Ionicons name="shield-checkmark" size={14} color="#34D399" />
                </View>
              </View>
            </View>
            <View style={styles.hr} />
            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Member Since</Text>
                <Text style={styles.metaValue}>May 12, 2024</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Next Billing Date</Text>
                <Text style={styles.metaValue}>May 12, 2025</Text>
              </View>
            </View>
          </Card>

          {/* Subscription details */}
          <Card style={styles.block} padding={spacing.lg} strong>
            <Text style={styles.sectionTitle}>Subscription Details</Text>
            {DETAILS.map(d => (
              <View key={d.id} style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name={d.icon as any} size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.detailTitle}>{d.title}</Text>
                  <Text style={styles.detailValue}>{d.value}</Text>
                </View>
                {'badge' in d && d.badge ? (
                  <View style={styles.bestValue}>
                    <Text style={styles.bestValueText}>{d.badge}</Text>
                  </View>
                ) : null}
                {'right' in d && d.right ? <Text style={styles.detailRight}>{d.right}</Text> : null}
              </View>
            ))}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="sync-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.detailTitle}>Auto-Renewal</Text>
                <Text style={styles.detailValue}>{autoRenew ? 'Enabled' : 'Disabled'}</Text>
              </View>
              <Pressable onPress={() => setAutoRenew(v => !v)} hitSlop={8}>
                {autoRenew ? (
                  <LinearGradient
                    colors={gradients.blueViolet}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.track, { alignItems: 'flex-end' }]}
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

          {/* Manage subscription */}
          <Card style={styles.block} padding={spacing.lg} strong>
            <Text style={styles.sectionTitle}>Manage Subscription</Text>
            {MANAGE.map(m => (
              <Pressable key={m.id} style={({ pressed }) => [styles.manageRow, pressed && { opacity: 0.7 }]}>
                <View style={styles.detailIcon}>
                  <Ionicons name={m.icon as any} size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.detailTitle}>{m.title}</Text>
                  <Text style={styles.detailValue}>{m.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.manageRow, pressed && { opacity: 0.7 }]}
              onPress={() => navigation?.navigate?.('CancelPremium')}
            >
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(255,90,110,0.16)' }]}>
                <Ionicons name="close-circle-outline" size={20} color={DANGER} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.detailTitle, { color: DANGER }]}>Cancel Subscription</Text>
                <Text style={styles.detailValue}>You will lose access on May 12, 2025</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          </Card>

          {/* Secure note */}
          <Card style={styles.block} padding={spacing.lg}>
            <View style={styles.noteRow}>
              <View style={styles.noteIcon}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.noteTitle}>Your Premium subscription is secure</Text>
                <Text style={styles.noteText}>
                  Payments are encrypted and your data is always protected.
                </Text>
              </View>
            </View>
          </Card>

          <Pressable style={styles.supportRow} hitSlop={6}>
            <Ionicons name="headset-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.supportText}>
              Need help? <Text style={styles.supportLink}>Contact Support</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ManagePremiumScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  headerTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2, textAlign: 'center' },
  block: { marginHorizontal: spacing.xl, marginTop: spacing.xl },
  planTop: { flexDirection: 'row', alignItems: 'center' },
  crownChip: { width: 78, height: 78, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  planLabel: { color: colors.textSecondary, fontSize: 14 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 2 },
  planName: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.chipViolet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  activeText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  enjoyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  enjoy: { color: colors.textSecondary, fontSize: 14 },
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: spacing.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaCol: { flex: 1, alignItems: 'center' },
  metaDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: colors.divider },
  metaLabel: { color: colors.textSecondary, fontSize: 13 },
  metaValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 4 },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: spacing.md },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.glassFillSoft,
    marginBottom: spacing.sm,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
  },
  detailTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  detailValue: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  detailRight: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  bestValue: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0A93B',
  },
  bestValueText: { color: '#E0A93B', fontSize: 12, fontWeight: '700' },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.glassFillSoft,
    marginBottom: spacing.sm,
  },
  track: { width: 52, height: 30, borderRadius: 15, padding: 3, justifyContent: 'center' },
  trackOff: { backgroundColor: colors.glassFillStrong, alignItems: 'flex-start' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.textPrimary },
  noteRow: { flexDirection: 'row', alignItems: 'center' },
  noteIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
  },
  noteTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  noteText: { color: colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 },
  supportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.xl },
  supportText: { color: colors.textSecondary, fontSize: 14 },
  supportLink: { color: colors.accentBlue, fontWeight: '700' },
});
