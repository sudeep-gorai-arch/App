import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors } from '../../styles/colors';
import { radius, spacing } from '../../utils/constants';

type Nav = {
  goBack?: () => void;
};

type IconName = keyof typeof Ionicons.glyphMap;

type PolicyItem = {
  label?: string;
  text: string;
};

type PolicySection = {
  id: string;
  title: string;
  icon: IconName;
  summary: string;
  items: PolicyItem[];
};

type QuickFact = {
  id: string;
  icon: IconName;
  title: string;
  text: string;
};

const LAST_UPDATED = 'July 13, 2026';
const SUPPORT_EMAIL = 'support@flexiwalls.app';

const HERO_GRADIENT = ['#8B5CF6', '#EC4899', '#3B82F6'] as const;

const QUICK_FACTS: QuickFact[] = [
  {
    id: 'sale',
    icon: 'ban-outline',
    title: 'We do not sell personal data',
    text: 'FlexiWalls does not sell or rent your personal information.',
  },
  {
    id: 'photos',
    icon: 'images-outline',
    title: 'Your photos are not uploaded',
    text: 'Media access is used to save or remove wallpapers you choose.',
  },
  {
    id: 'ads',
    icon: 'eye-off-outline',
    title: 'No personalized advertising',
    text: 'The current app has no third-party ad or cross-app tracking SDK.',
  },
  {
    id: 'delete',
    icon: 'trash-outline',
    title: 'You can delete your account',
    text: 'Account deletion is available from Settings inside the app.',
  },
];

const SECTIONS: PolicySection[] = [
  {
    id: 'scope',
    title: '1. About this policy',
    icon: 'document-text-outline',
    summary:
      'This policy explains how FlexiWalls handles information when you use the app and related services.',
    items: [
      {
        text: 'FlexiWalls lets you browse, favorite, download and apply image or video wallpapers and use optional premium features.',
      },
      {
        text: 'This policy applies to the FlexiWalls mobile app, public website, backend APIs, support communications and related services.',
      },
      {
        text: 'You can browse and download eligible wallpapers as a guest. Features such as cloud favorites, account download history and premium access require sign-in.',
      },
    ],
  },
  {
    id: 'collect',
    title: '2. Information we collect',
    icon: 'server-outline',
    summary:
      'We collect account, activity, payment and technical information needed to operate FlexiWalls.',
    items: [
      {
        label: 'Google account information:',
        text: 'If you choose Google Sign-In, we receive your Google account identifier, name, email address, email verification status and profile image.',
      },
      {
        label: 'Account and app activity:',
        text: 'We process your FlexiWalls user ID, profile details, favorites, likes, wallpaper download history, daily download count, premium status and subscription status.',
      },
      {
        label: 'Guest activity:',
        text: 'For guest downloads, the app creates a random guest identifier and sends it with wallpaper download events so we can apply download limits and reduce abuse.',
      },
      {
        label: 'Session and technical information:',
        text: 'We may process login and logout times, session records, IP address, user-agent, request dates, API errors and security logs.',
      },
      {
        label: 'Payment information:',
        text: 'For premium purchases, we process the selected plan, receipt, order, payment and subscription identifiers, amount, currency, payment status, verification signature and provider response.',
      },
      {
        label: 'Support information:',
        text: 'If you contact us, we receive the email address, message and any information or files you choose to provide.',
      },
    ],
  },
  {
    id: 'use',
    title: '3. How we use information',
    icon: 'sparkles-outline',
    summary:
      'We use information to provide app features, maintain security and support your account.',
    items: [
      { text: 'Authenticate your account and keep you signed in.' },
      { text: 'Display wallpapers, categories, favorites, downloads and trending content.' },
      { text: 'Enforce guest and free-user download limits and verify premium access.' },
      { text: 'Create, verify, manage and cancel premium subscriptions.' },
      { text: 'Calculate aggregate download, favorite and like counts.' },
      { text: 'Prevent fraud, misuse, unauthorized access and security incidents.' },
      { text: 'Diagnose errors, maintain performance and respond to support or privacy requests.' },
      {
        text: 'We process optional permissions with your choice, account and payment data to provide requested services, and limited technical data for security, legal and operational purposes.',
      },
    ],
  },
  {
    id: 'device',
    title: '4. Data stored on your device and permissions',
    icon: 'phone-portrait-outline',
    summary:
      'Some information stays on your device so app features work correctly.',
    items: [
      {
        label: 'Secure device storage:',
        text: 'The app stores your login token, basic profile and guest identifier using secure device storage where supported.',
      },
      {
        label: 'Local app storage:',
        text: 'The app stores notification and Wi-Fi-only preferences, local download records, wallpaper details, file locations and media asset identifiers on your device.',
      },
      {
        label: 'Photos and media:',
        text: 'Media-library permission is used to save downloaded wallpapers and remove selected downloaded wallpapers from your device. FlexiWalls does not upload your personal photo library to our servers.',
      },
      {
        label: 'Set wallpaper:',
        text: 'Android wallpaper access is used only when you choose to apply a wallpaper to your home screen, lock screen or both.',
      },
      {
        label: 'Notifications:',
        text: 'Notification permission is requested only when you enable notifications. The current preference is stored locally on your device.',
      },
      {
        label: 'Network state:',
        text: 'The app checks whether you are connected to Wi-Fi when the Wi-Fi-only download preference is enabled.',
      },
      {
        text: 'You can change permissions from your device settings. Disabling a permission may prevent the related feature from working.',
      },
    ],
  },
  {
    id: 'sharing',
    title: '5. Service providers and sharing',
    icon: 'people-outline',
    summary:
      'We use trusted providers to run login, payments, hosting, database and media delivery.',
    items: [
      {
        label: 'Google:',
        text: 'Google processes the sign-in flow when you choose Google Sign-In. We use the identity information received only for account authentication and profile features described in this policy.',
      },
      {
        label: 'Razorpay:',
        text: 'Razorpay processes checkout and payment-method information. FlexiWalls receives transaction identifiers and status information but does not receive or store your full card number, CVV, UPI PIN or online-banking password.',
      },
      {
        label: 'Hosting and database providers:',
        text: 'Render may host backend services, Supabase may host the PostgreSQL database, and Vercel may host the public website.',
      },
      {
        label: 'Media delivery:',
        text: 'Cloudflare R2 and related content-delivery services may store and deliver wallpaper files and thumbnails.',
      },
      {
        label: 'Legal and safety:',
        text: 'We may disclose information when required by law or when reasonably necessary to protect users, investigate fraud, enforce rights or secure the service.',
      },
      {
        label: 'Business changes:',
        text: 'If FlexiWalls is reorganized, sold or transferred, relevant information may transfer with the service subject to this policy and applicable law.',
      },
      {
        text: 'We do not sell or rent your personal information to advertisers or data brokers.',
      },
    ],
  },
  {
    id: 'payments',
    title: '6. Premium payments',
    icon: 'card-outline',
    summary:
      'Razorpay handles payment credentials while FlexiWalls verifies and records the purchase.',
    items: [
      {
        text: 'Checkout may support payment methods such as UPI, cards, wallets or net banking according to Razorpay availability.',
      },
      {
        text: 'Razorpay may independently collect payment, billing, device and fraud-prevention information under its own privacy notice.',
      },
      {
        text: 'FlexiWalls stores transaction and subscription records needed to activate premium access, handle cancellation, resolve disputes, prevent fraud and meet accounting or legal obligations.',
      },
      {
        text: 'Deleting your FlexiWalls account does not automatically erase records that must be kept for tax, accounting, chargeback, fraud-prevention or other legal purposes.',
      },
    ],
  },
  {
    id: 'ads',
    title: '7. Ads and analytics',
    icon: 'analytics-outline',
    summary:
      'The current app does not use personalized advertising or third-party analytics SDKs.',
    items: [
      {
        text: 'FlexiWalls does not currently use a third-party advertising SDK or track you across other companies’ apps or websites for advertising.',
      },
      {
        text: 'We use server logs and aggregate wallpaper activity such as download, favorite and like counts to operate and improve app features.',
      },
      {
        text: 'Before adding advertising, remote analytics, crash reporting or similar tracking, we will update this policy, store disclosures and consent flows where required.',
      },
    ],
  },
  {
    id: 'retention',
    title: '8. Retention and account deletion',
    icon: 'time-outline',
    summary:
      'We keep information only while it is needed for the service, security or legal requirements.',
    items: [
      {
        label: 'Account information:',
        text: 'Account data, favorites, likes, cloud download history and premium profile information are kept while your account remains active or until deletion is requested, subject to limited legal retention.',
      },
      {
        label: 'Guest and local information:',
        text: 'The guest identifier, preferences and local download history remain on your device until you clear app data, uninstall the app or remove the related records.',
      },
      {
        label: 'Downloaded files:',
        text: 'Deleting your account does not automatically remove wallpaper files already saved in your device gallery. You can remove those files from the Downloads screen or your gallery.',
      },
      {
        label: 'Technical records:',
        text: 'Security, request and error logs are kept only for a limited period based on operational, fraud-prevention and legal needs.',
      },
      {
        label: 'Payment records:',
        text: 'Transaction records may be retained for accounting, tax, refunds, disputes, chargebacks, fraud prevention and compliance for as long as required or reasonably necessary.',
      },
      {
        text: 'To delete your account in the app, open Settings and select “Delete Account and Data.” You may also email us to request access, correction or deletion.',
      },
    ],
  },
  {
    id: 'rights',
    title: '9. Your choices and privacy rights',
    icon: 'shield-checkmark-outline',
    summary:
      'You can manage permissions, preferences, account information and deletion requests.',
    items: [
      { text: 'Access the personal information associated with your account.' },
      { text: 'Request correction or updating of inaccurate account information.' },
      { text: 'Request deletion of your account and associated personal information.' },
      { text: 'Disable optional permissions through your device settings.' },
      { text: 'Turn notifications or Wi-Fi-only downloads on or off in the app.' },
      { text: 'Log out and revoke Google access through your Google Account settings.' },
      {
        text: 'We may need to verify your identity before completing a request. Some information may be retained when required by law or necessary for security, fraud prevention or dispute resolution.',
      },
    ],
  },
  {
    id: 'security',
    title: '10. Security and international processing',
    icon: 'lock-closed-outline',
    summary:
      'We use safeguards, but no app or internet transmission can be guaranteed completely secure.',
    items: [
      {
        text: 'We use measures such as HTTPS, access controls, authentication, secure device storage where supported and restricted access to production services.',
      },
      {
        text: 'You should protect your device, Google account and payment account and avoid sharing authentication information.',
      },
      {
        text: 'Information may be processed in India and in other countries where our providers operate. Those locations may have different data-protection laws.',
      },
    ],
  },
  {
    id: 'children',
    title: '11. Children’s privacy',
    icon: 'happy-outline',
    summary:
      'FlexiWalls is not specifically directed to children.',
    items: [
      {
        text: 'We do not knowingly collect personal information from children in a way that violates applicable law.',
      },
      {
        text: 'Where local law requires parental or guardian consent, a child should not create an account or make a purchase without that consent.',
      },
      {
        text: 'A parent or guardian who believes a child provided personal information may contact us to request review and deletion.',
      },
    ],
  },
  {
    id: 'changes',
    title: '12. Changes and contact',
    icon: 'mail-outline',
    summary:
      'We may update this policy when the app, providers or legal requirements change.',
    items: [
      {
        text: 'The latest version will show a revised “Last updated” date. Material changes may also be communicated in the app or through another appropriate method.',
      },
      {
        label: 'Privacy and support email:',
        text: SUPPORT_EMAIL,
      },
      {
        label: 'Application:',
        text: 'FlexiWalls',
      },
      {
        label: 'Android package:',
        text: 'com.flexiwalls.app',
      },
    ],
  },
];

const QuickFactCard = ({ item }: { item: QuickFact }) => (
  <View style={styles.quickFactCard}>
    <View style={styles.quickFactIcon}>
      <Ionicons name={item.icon} size={19} color={colors.accent} />
    </View>
    <View style={styles.quickFactContent}>
      <Text style={styles.quickFactTitle}>{item.title}</Text>
      <Text style={styles.quickFactText}>{item.text}</Text>
    </View>
  </View>
);

const PolicySectionCard = ({
  section,
  expanded,
  onPress,
}: {
  section: PolicySection;
  expanded: boolean;
  onPress: () => void;
}) => (
  <Card style={styles.policyCard} padding={0} strong>
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${section.title}. ${expanded ? 'Collapse' : 'Expand'} section`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.policyPressable,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.policyHeader}>
        <View style={styles.policyIcon}>
          <Ionicons name={section.icon} size={20} color={colors.textPrimary} />
        </View>

        <View style={styles.policyHeaderText}>
          <Text style={styles.policyTitle}>{section.title}</Text>
          <Text style={styles.policySummary}>{section.summary}</Text>
        </View>

        <View style={styles.chevronWrap}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textPrimary}
          />
        </View>
      </View>

      {expanded ? (
        <View style={styles.policyBody}>
          {section.items.map((item, index) => (
            <View key={`${section.id}-${index}`} style={styles.policyItem}>
              <View style={styles.policyDot} />
              <Text style={styles.policyText}>
                {item.label ? (
                  <Text style={styles.policyLabel}>{item.label} </Text>
                ) : null}
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  </Card>
);

const PrivacyPolicyScreen = ({ navigation }: { navigation?: Nav }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setOpenSections(previous => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const openPrivacyEmail = () => {
    const subject = encodeURIComponent('FlexiWalls Privacy Request');
    const body = encodeURIComponent(
      'Please describe whether you are requesting access, correction, deletion or other privacy support.',
    );

    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
    ).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <RoundButton
            icon="chevron-back"
            onPress={() => navigation?.goBack?.()}
          />

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Privacy & Data</Text>
            <Text style={styles.headerSubtitle}>Last updated {LAST_UPDATED}</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <LinearGradient
            colors={HERO_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBorder}
          >
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroIcon}>
                  <Ionicons
                    name="shield-checkmark"
                    size={30}
                    color={colors.textPrimary}
                  />
                </View>

                <View style={styles.datePill}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={colors.accent}
                  />
                  <Text style={styles.dateText}>{LAST_UPDATED}</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Your privacy, explained simply.</Text>
              <Text style={styles.heroText}>
                FlexiWalls collects only the information needed for login,
                favorites, downloads, premium access, payments, security and
                support. This page explains what happens to that information and
                the controls available to you.
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>QUICK SUMMARY</Text>
            <Text style={styles.sectionTitle}>The important points</Text>
          </View>

          <View style={styles.quickFactsGrid}>
            {QUICK_FACTS.map(item => (
              <QuickFactCard key={item.id} item={item} />
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>FULL POLICY</Text>
            <Text style={styles.sectionTitle}>Tap a section to read</Text>
          </View>

          {SECTIONS.map(section => (
            <PolicySectionCard
              key={section.id}
              section={section}
              expanded={Boolean(openSections[section.id])}
              onPress={() => toggleSection(section.id)}
            />
          ))}

          <Card style={styles.contactCard} padding={spacing.lg} strong>
            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color={colors.accent}
                />
              </View>

              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>Privacy questions?</Text>
                <Text style={styles.contactText}>
                  Contact us for access, correction, deletion or privacy support.
                </Text>
                <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={openPrivacyEmail}
              style={({ pressed }) => [
                styles.contactButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="send-outline"
                size={17}
                color={colors.textPrimary}
              />
              <Text style={styles.contactButtonText}>Email Privacy Team</Text>
            </Pressable>
          </Card>

          <Text style={styles.footerText}>
            FlexiWalls · com.flexiwalls.app
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    minHeight: 66,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  heroBorder: {
    borderRadius: 30,
    padding: 1.5,
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 26,
    elevation: 12,
  },
  heroCard: {
    borderRadius: 28,
    padding: spacing.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(17,14,28,0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  datePill: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '800',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 0.1,
  },
  heroText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14.5,
    lineHeight: 23,
    fontWeight: '500',
  },
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionEyebrow: {
    color: colors.accent,
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    marginTop: 6,
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  quickFactsGrid: {
    gap: spacing.md,
  },
  quickFactCard: {
    minHeight: 86,
    padding: spacing.md,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.075)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  quickFactIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.20)',
  },
  quickFactContent: {
    flex: 1,
  },
  quickFactTitle: {
    color: colors.textPrimary,
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '900',
  },
  quickFactText: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  policyCard: {
    marginTop: spacing.md,
  },
  policyPressable: {
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  policyIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  policyHeaderText: {
    flex: 1,
  },
  policyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  policySummary: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  policyBody: {
    marginTop: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  policyItem: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  policyDot: {
    width: 6,
    height: 6,
    marginTop: 8,
    marginRight: spacing.md,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  policyText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13.7,
    lineHeight: 22,
    fontWeight: '500',
  },
  policyLabel: {
    color: colors.textPrimary,
    fontWeight: '900',
  },
  contactCard: {
    marginTop: spacing.xxl,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  contactIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.16)',
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  contactText: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  contactEmail: {
    marginTop: spacing.sm,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  contactButton: {
    height: 48,
    marginTop: spacing.lg,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
  },
  contactButtonText: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '900',
  },
  footerText: {
    marginTop: spacing.xl,
    color: colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});