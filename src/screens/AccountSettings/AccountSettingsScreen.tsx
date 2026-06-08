import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors, gradients } from '../../styles/colors';
import { spacing, radius } from '../../utils/constants';

type Nav = { goBack?: () => void };

const DANGER = '#FF5A6E';
const AVATAR = 'https://picsum.photos/seed/acct-ethan/400/400';

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

/** Gradient pill toggle that matches the glass theme. */
const Toggle = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <Pressable onPress={() => onChange(!value)} hitSlop={8}>
    {value ? (
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
);

/** Section header: gradient icon chip + title. */
const SectionHeader = ({
  icon,
  title,
  family = 'ion',
}: {
  icon: string;
  title: string;
  family?: 'ion' | 'mc';
}) => (
  <View style={styles.sectionHeader}>
    <LinearGradient colors={gradients.blueViolet} style={styles.sectionIcon}>
      {family === 'mc' ? (
        <MaterialCommunityIcons
          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={20}
          color={colors.textPrimary}
        />
      ) : (
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={colors.textPrimary}
        />
      )}
    </LinearGradient>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

/** Editable labelled field used in Personal Info. */
const Field = ({
  icon,
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'email-address';
}) => (
  <View style={styles.fieldCard}>
    <Ionicons name={icon} size={22} color={colors.textSecondary} />
    <View style={{ flex: 1, marginLeft: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldValue}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
      />
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const AccountSettingsScreen = ({ navigation }: { navigation?: Nav }) => {
  const [fullName, setFullName] = useState('Ethan Hunt');
  const [email, setEmail] = useState('ethanhunt@email.com');
  const [faceId, setFaceId] = useState(true);

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
        >
          {/* header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <RoundButton icon="chevron-back" onPress={() => navigation?.goBack?.()} />
            </View>
            <Text style={styles.headerTitle}>Account Settings</Text>
          </View>

          {/* avatar */}
          <View style={styles.avatarWrap}>
            <LinearGradient colors={gradients.violetMagenta} style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Image source={{ uri: AVATAR }} style={styles.avatar} />
              </View>
            </LinearGradient>
            <Pressable style={styles.cameraBtn}>
              <BlurView intensity={36} tint="dark" style={styles.cameraBlur}>
                <Ionicons name="camera" size={20} color={colors.textPrimary} />
              </BlurView>
            </Pressable>
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <View style={styles.memberRow}>
            <MaterialCommunityIcons name="crown" size={16} color={colors.accent} />
            <Text style={styles.memberText}>Premium Member</Text>
          </View>

          {/* Personal Info */}
          <Card style={styles.section} padding={spacing.lg} strong>
            <SectionHeader icon="person-outline" title="Personal Info" />
            <Field
              icon="person-outline"
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />
            <View style={{ height: spacing.md }} />
            <Field
              icon="mail-outline"
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </Card>

          {/* Security */}
          <Card style={styles.section} padding={spacing.lg} strong>
            <SectionHeader icon="shield-checkmark-outline" title="Security" />
            <Pressable style={styles.rowCard}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.rowLabel}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
            <View style={{ height: spacing.md }} />
            <View style={styles.rowCard}>
              <MaterialCommunityIcons name="face-recognition" size={22} color={colors.textPrimary} />
              <Text style={styles.rowLabel}>Enable Face ID</Text>
              <Toggle value={faceId} onChange={setFaceId} />
            </View>
          </Card>

          {/* Subscription */}
          <Card style={styles.section} padding={spacing.lg} strong>
            <SectionHeader icon="crown" title="Subscription" family="mc" />
            <View style={styles.planCard}>
              <MaterialCommunityIcons
                name="crown"
                size={42}
                color={colors.accent}
                style={styles.planCrown}
              />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.planLabel}>Current Plan</Text>
                <Text style={styles.planValue}>Premium</Text>
                <Text style={styles.planSub}>Unlimited access to all premium features</Text>
              </View>
              <Pressable style={styles.manageBtn}>
                <Text style={styles.manageText}>Manage</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
              </Pressable>
            </View>
          </Card>

          {/* Log out */}
          <Pressable
            style={({ pressed }) => [styles.logout, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="log-out-outline" size={22} color={DANGER} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          <View style={styles.footer}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.footerText}>Your data is encrypted and secure.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AccountSettingsScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },

  // header
  header: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  headerLeft: { position: 'absolute', left: spacing.xl },
  headerTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },

  // avatar
  avatarWrap: { alignSelf: 'center', marginTop: spacing.lg },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    padding: 4,
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 22,
    elevation: 12,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 62,
    padding: 4,
    backgroundColor: colors.base,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 58 },
  cameraBtn: { position: 'absolute', right: -2, bottom: 2 },
  cameraBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },

  name: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  memberText: { color: colors.accent, fontSize: 16, fontWeight: '700' },

  // sections
  section: { marginHorizontal: spacing.xl, marginTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '800' },

  // editable field cards
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  fieldLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  fieldValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 2,
    marginTop: 1,
  },

  // generic rows (security)
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowLabel: { flex: 1, color: colors.textPrimary, fontSize: 17, fontWeight: '600' },

  // toggle
  track: {
    width: 54,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  trackOff: { backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'flex-start' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },

  // subscription plan card
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  planCrown: {
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  planLabel: { color: colors.textSecondary, fontSize: 13 },
  planValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 1 },
  planSub: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accentBlue,
  },
  manageText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },

  // logout
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    paddingVertical: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,90,110,0.55)',
    backgroundColor: 'rgba(255,90,110,0.08)',
  },
  logoutText: { color: DANGER, fontSize: 18, fontWeight: '800' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  footerText: { color: colors.textSecondary, fontSize: 13 },
});
