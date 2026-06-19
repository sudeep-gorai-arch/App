import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors, gradients } from '../../styles/colors';
import { spacing, radius } from '../../utils/constants';

type Nav = { goBack?: () => void };

const CTA_GRADIENT = ['#EC4899', '#8B5CF6', '#3B82F6'] as const;

// ---------------------------------------------------------------------------
// Content (dummy policy text)
// ---------------------------------------------------------------------------
const LAST_UPDATED = 'June 20, 2026';
const INTRO =
  'Welcome to FlexiWalls. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our app and services.';

type Bullet = { bold?: string; text: string };
type Section = {
  id: string;
  num: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  intro?: string;
  bullets?: Bullet[];
  outro?: string;
};

const SECTIONS: Section[] = [
  {
    id: 's1',
    num: '1',
    title: 'Data Collection',
    icon: 'document-text-outline',
    intro: 'We collect only the information necessary to provide and improve our services.',
    bullets: [
      { bold: 'Personal Information:', text: 'When you create an account or contact us, we may collect your name, email address, and profile information.' },
      { bold: 'Usage Data:', text: 'We may collect information about how you use FlexiWalls, including your interactions, preferences, and device information.' },
      { bold: 'Device Information:', text: 'We collect basic device information such as device type, OS version, and unique identifiers to ensure app functionality and security.' },
    ],
  },
  {
    id: 's2',
    num: '2',
    title: 'How We Use Your Data',
    icon: 'bar-chart-outline',
    intro: 'We use your data to:',
    bullets: [
      { text: 'Provide, operate, and maintain our services' },
      { text: 'Personalize your experience and content' },
      { text: 'Improve app performance and develop new features' },
      { text: 'Communicate with you about updates and offers' },
      { text: 'Ensure security and prevent fraud' },
    ],
  },
  {
    id: 's3',
    num: '3',
    title: 'Data Sharing',
    icon: 'people-outline',
    intro: 'We do not sell your personal data. We may share your information only in the following cases:',
    bullets: [
      { text: 'With trusted service providers who help us operate our app' },
      { text: 'When required by law or to protect our rights' },
      { text: 'In the event of a business transfer or merger' },
    ],
  },
  {
    id: 's4',
    num: '4',
    title: 'User Rights',
    icon: 'shield-half-outline',
    intro: 'You have the right to:',
    bullets: [
      { text: 'Access, update, or delete your personal information' },
      { text: 'Opt out of marketing communications' },
      { text: 'Request a copy of your data' },
      { text: 'Withdraw consent at any time' },
    ],
    outro: 'To exercise your rights, contact us at support@wallpaperx.app.',
  },
];

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
const BulletRow = ({ item }: { item: Bullet }) => (
  <View style={styles.bulletRow}>
    <View style={styles.dot} />
    <Text style={styles.bulletText}>
      {item.bold ? <Text style={styles.bulletBold}>{item.bold} </Text> : null}
      {item.text}
    </Text>
  </View>
);

const PolicySection = ({ section, last }: { section: Section; last: boolean }) => (
  <View>
    <View style={styles.sectionHeader}>
      <LinearGradient colors={gradients.blueViolet} style={styles.numChip}>
        <Text style={styles.numText}>{section.num}</Text>
      </LinearGradient>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionIcon}>
        <Ionicons name={section.icon} size={18} color={colors.accentBlue} />
      </View>
    </View>

    {section.intro ? <Text style={styles.paragraph}>{section.intro}</Text> : null}
    {section.bullets?.map((b, i) => <BulletRow key={i} item={b} />)}
    {section.outro ? (
      <Text style={[styles.paragraph, { marginTop: spacing.sm }]}>{section.outro}</Text>
    ) : null}

    {!last && <View style={styles.divider} />}
  </View>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const PrivacyPolicyScreen = ({ navigation }: { navigation?: Nav }) => {
  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RoundButton icon="chevron-back" onPress={() => navigation?.goBack?.()} />
          </View>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.lg,
            paddingBottom: 24,
          }}
        >
          <Card padding={spacing.xl} strong>
            {/* last updated */}
            <View style={styles.updatedRow}>
              <View style={styles.shieldChip}>
                <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
              </View>
              <Text style={styles.updatedLabel}>
                Last Updated: <Text style={styles.updatedDate}>{LAST_UPDATED}</Text>
              </Text>
            </View>

            <Text style={styles.intro}>{INTRO}</Text>
            <View style={styles.divider} />

            {SECTIONS.map((s, i) => (
              <PolicySection key={s.id} section={s} last={i === SECTIONS.length - 1} />
            ))}
          </Card>
        </ScrollView>

        {/* sticky CTA */}
        <View style={styles.ctaBar}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaWrap,
              { transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={() => navigation?.goBack?.()}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.ctaText}>I Understand</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default PrivacyPolicyScreen;

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
  headerTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },

  // last updated
  updatedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  shieldChip: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
    marginRight: spacing.md,
  },
  updatedLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  updatedDate: { color: colors.accent, fontWeight: '700' },

  intro: { color: colors.textSecondary, fontSize: 15, lineHeight: 23 },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.xl,
  },

  // section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  numChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  numText: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  sectionTitle: { flex: 1, color: colors.textPrimary, fontSize: 21, fontWeight: '800' },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipBlue,
  },

  paragraph: { color: colors.textSecondary, fontSize: 15, lineHeight: 23, marginBottom: spacing.sm },

  // bullets
  bulletRow: { flexDirection: 'row', marginTop: spacing.sm, paddingRight: spacing.sm },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 8,
    marginRight: spacing.md,
  },
  bulletText: { flex: 1, color: colors.textSecondary, fontSize: 15, lineHeight: 23 },
  bulletBold: { color: colors.textPrimary, fontWeight: '700' },

  // CTA
  ctaBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  ctaWrap: {
    borderRadius: radius.pill,
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: 18,
    borderRadius: radius.pill,
  },
  ctaText: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
});
