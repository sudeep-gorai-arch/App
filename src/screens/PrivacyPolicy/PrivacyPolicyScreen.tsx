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

const LAST_UPDATED = 'October 27, 2026';
const SUPPORT_EMAIL = 'support.flexiwalls@gmail.com';

const HERO_GRADIENT = ['#8B5CF6', '#EC4899', '#3B82F6'] as const;

const QUICK_FACTS: QuickFact[] = [
  {
    id: 'sale',
    icon: 'ban-outline',
    title: 'We do not sell personal data',
    text: 'FlexiWalls does not sell or rent your personal information to data brokers.',
  },
  {
    id: 'photos',
    icon: 'images-outline',
    title: 'Your photo library is not uploaded',
    text: 'Media access is used only for wallpaper download, save and deletion features you request.',
  },
  {
    id: 'ads',
    icon: 'megaphone-outline',
    title: 'Free users may see Google ads',
    text: 'Google Mobile Ads may process device, interaction, diagnostic and advertising information.',
  },
  {
    id: 'delete',
    icon: 'trash-outline',
    title: 'You can delete your account',
    text: 'Delete your account from Settings or email us to request deletion.',
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
        text: 'This policy applies to the FlexiWalls Android app, public website, backend APIs, support communications and related services.',
      },
      {
        text: 'FlexiWalls lets you browse, favorite, like, download and apply image or video wallpapers and use optional premium features.',
      },
      {
        text: 'Eligible wallpapers can be browsed and downloaded as a guest. Account-based favorites, likes, cloud activity and premium access require sign-in.',
      },
    ],
  },
  {
    id: 'collect',
    title: '2. Information we collect',
    icon: 'server-outline',
    summary:
      'We collect account, activity, technical, advertising and purchase information needed to operate FlexiWalls.',
    items: [
      {
        label: 'Google account information:',
        text: 'If you choose Google Sign-In, we receive information made available through the sign-in flow, such as your Google account identifier, name, email address, email-verification status and profile image.',
      },
      {
        label: 'Account and profile information:',
        text: 'We process your FlexiWalls user ID, username, email address, avatar, account role, account creation date, premium status and premium-expiry information.',
      },
      {
        label: 'App activity:',
        text: 'We process favorites, likes, wallpaper download history, selected download quality, daily download counts, subscription status and related activity needed to provide features and prevent abuse.',
      },
      {
        label: 'Guest activity:',
        text: 'For guest downloads on Android, the app derives a pseudonymous guest identifier from an Android system identifier and sends it with wallpaper download events to apply guest limits, prevent duplicate processing and reduce abuse. The raw Android identifier is not sent to our server. The derived identifier may remain stable across app-data clearing and reinstallations on the same device, Android user and app-signing key. Other platforms may store a randomly generated guest identifier.',
      },
      {
        label: 'Session and technical information:',
        text: 'Our services may process login and logout times, session records, IP address, user-agent, request date and time, API errors, app version, device or operating-system information and security logs.',
      },
      {
        label: 'Advertising and SDK information:',
        text: 'Google Mobile Ads may automatically collect and share IP address, approximate general location derived from IP, app launches, taps, ad or video interactions, diagnostic information, Android advertising ID, app set ID and other device or account identifiers for advertising, ad measurement, analytics and fraud prevention.',
      },
      {
        label: 'Purchase and subscription information:',
        text: 'For Google Play purchases, we may receive and store the selected product or plan, purchase token, order or transaction identifier, payment status, acknowledgement or verification result, currency, amount when available and relevant dates. Google processes your payment-method credentials.',
      },
      {
        label: 'Support information:',
        text: 'If you contact us, we receive your email address, message and any information or files you choose to provide.',
      },
    ],
  },
  {
    id: 'use',
    title: '3. How we use information',
    icon: 'sparkles-outline',
    summary:
      'We use information to provide app features, show ads, maintain security and support your account.',
    items: [
      { text: 'Authenticate your account and keep you signed in.' },
      { text: 'Provide wallpapers, categories, favorites, likes, downloads, trending content and account features.' },
      { text: 'Apply guest and free-user limits and prevent duplicate or abusive download activity.' },
      { text: 'Verify, activate, maintain, restore and cancel premium entitlements and subscriptions.' },
      { text: 'Display, personalize where permitted, measure and protect advertising shown to eligible users.' },
      { text: 'Maintain service security, prevent fraud, investigate misuse and enforce our rights.' },
      { text: 'Diagnose errors, improve reliability and respond to support or privacy requests.' },
      { text: 'Comply with legal, accounting, tax, payment and regulatory obligations.' },
    ],
  },
  {
    id: 'device',
    title: '4. Device storage and Android permissions',
    icon: 'phone-portrait-outline',
    summary:
      'Some information and permissions remain on your device so requested features can work.',
    items: [
      {
        label: 'Secure device storage:',
        text: 'The app stores your login token, basic profile information and guest identifier using secure device storage where supported.',
      },
      {
        label: 'Local app storage:',
        text: 'The app stores notification and Wi-Fi-only preferences, local favorites or download records, wallpaper details, file locations and media asset identifiers on your device.',
      },
      {
        label: 'Photos and media:',
        text: 'Photo and media access is used to save wallpapers, locate app-created downloads and delete wallpapers you select. FlexiWalls does not intentionally upload or scan unrelated photos or videos from your personal library.',
      },
      {
        label: 'Media location metadata:',
        text: 'The Android build may include media-location access through the media-library integration. FlexiWalls does not use photo location metadata for advertising, user profiling or upload to our servers.',
      },
      {
        label: 'Set wallpaper:',
        text: 'Android wallpaper access is used only when you choose to apply an image or live wallpaper to the home screen, lock screen or both.',
      },
      {
        label: 'Notifications:',
        text: 'Notification permission is requested only when you enable notifications. The current notification preference is stored locally on your device.',
      },
      {
        label: 'Network state:',
        text: 'The app checks network or Wi-Fi status when needed to load content and respect the Wi-Fi-only download preference.',
      },
      {
        text: 'You can change permissions in Android settings. Disabling a permission may prevent the related feature from working.',
      },
    ],
  },
  {
    id: 'ads',
    title: '5. Advertising',
    icon: 'megaphone-outline',
    summary:
      'FlexiWalls uses Google Mobile Ads to support free access.',
    items: [
      {
        text: 'Depending on the app version and screen, eligible users may see banner, native, interstitial, app-open or rewarded ads.',
      },
      {
        text: 'Rewarded ads are shown only when you choose an ad-supported action that offers a reward.',
      },
      {
        text: 'Google and its advertising partners may use information described in this policy to deliver personalized or non-personalized ads, measure performance, limit repeated ads, detect fraud and produce reports.',
      },
      {
        text: 'The type of ad served may depend on your consent choices, age or account settings, region, device settings and Google policies.',
      },
      {
        text: 'You can reset or delete the Android advertising ID through your device settings. Where required by law, an appropriate consent or privacy-choice flow must be presented before data is used for personalized advertising.',
      },
    ],
  },
  {
    id: 'payments',
    title: '6. Premium purchases',
    icon: 'card-outline',
    summary:
      'Google Play handles payment credentials while FlexiWalls verifies and records the purchase.',
    items: [
      {
        text: 'Purchases made in the Android app are processed through Google Play Billing. Google handles payment credentials and payment methods connected to your Google Play account.',
      },
      {
        text: 'FlexiWalls receives purchase and subscription information needed to verify the transaction, activate premium access, restore purchases, process cancellation or expiry, resolve disputes, prevent fraud and satisfy accounting or legal requirements.',
      },
      {
        text: 'FlexiWalls does not receive or store your full card number, CVV, UPI PIN or online-banking password.',
      },
      {
        text: 'Managing or deleting your FlexiWalls account does not automatically cancel a Google Play subscription. Subscriptions must also be managed through Google Play.',
      },
      {
        text: 'Some transaction records may be retained when required for tax, accounting, refunds, disputes, chargebacks, fraud prevention or legal compliance.',
      },
    ],
  },
  {
    id: 'sharing',
    title: '7. Service providers and sharing',
    icon: 'people-outline',
    summary:
      'We use service providers for login, ads, billing, hosting, database and media delivery.',
    items: [
      {
        label: 'Google:',
        text: 'Google provides Sign-In, Google Play Billing, Google Mobile Ads, Play services and related fraud-prevention, attribution and device services.',
      },
      {
        label: 'Backend hosting:',
        text: 'Render may host FlexiWalls backend services and process requests and operational logs.',
      },
      {
        label: 'Database hosting:',
        text: 'Supabase may host the PostgreSQL database that stores account, activity, entitlement and related service records.',
      },
      {
        label: 'Media storage and delivery:',
        text: 'Cloudflare R2 and related content-delivery services may store and deliver wallpaper files, previews and thumbnails.',
      },
      {
        label: 'Website hosting:',
        text: 'Vercel may host the FlexiWalls public website and process standard web request information.',
      },
      {
        label: 'Legal and safety:',
        text: 'We may disclose information when required by law or when reasonably necessary to protect users, investigate fraud, secure the service or enforce legal rights.',
      },
      {
        label: 'Business changes:',
        text: 'If FlexiWalls is reorganized, sold or transferred, relevant information may transfer with the service subject to this policy and applicable law.',
      },
      {
        text: 'We do not sell or rent personal information to data brokers.',
      },
    ],
  },
  {
    id: 'retention',
    title: '8. Retention',
    icon: 'time-outline',
    summary:
      'We retain information only while needed for the service, security, transactions or legal requirements.',
    items: [
      {
        label: 'Account information:',
        text: 'Account data, favorites, likes, cloud download history and premium-profile information are generally retained while your account is active or until deletion is completed, subject to limited legal or security retention.',
      },
      {
        label: 'Guest and local information:',
        text: 'The guest identifier, preferences and local download history remain on your device until you clear app data, uninstall the app or remove the records. Server-side guest download records may be retained for abuse prevention and usage limits.',
      },
      {
        label: 'Technical records:',
        text: 'Security, request, diagnostic and error logs are retained only for a period reasonably needed for operations, security, fraud prevention or legal obligations.',
      },
      {
        label: 'Purchase records:',
        text: 'Transaction and entitlement records may be retained for accounting, tax, refunds, disputes, chargebacks, fraud prevention and compliance. Following account deletion, limited residual records are retained for up to 15 days, unless a longer period is required by law.',
      },
    ],
  },
  {
    id: 'deletion',
    title: '9. Account and data deletion',
    icon: 'trash-outline',
    summary:
      'You can delete your account in the app or request deletion by email.',
    items: [
      { text: "We process emailed deletion requests within 3 days of receipt. Account ownership must be verified before personal data is deleted." },
      { text: "After account deletion, limited residual records are retained for up to 15 days and then deleted. Records that must be kept longer to meet a legal obligation are retained only for the legally required period." },
      {
        text: 'To delete your account in the app, open Settings and select “Delete Account and Data.” This sends a deletion request to the FlexiWalls service.',
      },
      {
        text: 'We remove the account and associated server-side data that is not required to be retained by law or for legitimate security, fraud-prevention, transaction or dispute purposes.',
      },
      {
        text: 'You may also request deletion by emailing support.flexiwalls@gmail.com with the subject “FlexiWalls Account Deletion Request” and including the email address associated with your account.',
      },
      {
        text: 'We may ask you to verify account ownership before completing an email request.',
      },
      {
        text: 'Deleting your account does not automatically remove wallpaper files already saved on your device and does not automatically cancel a Google Play subscription.',
      },
    ],
  },
  {
    id: 'rights',
    title: '10. Your choices and privacy rights',
    icon: 'shield-checkmark-outline',
    summary:
      'You can manage permissions, account data, subscriptions and advertising choices.',
    items: [
      { text: 'Request access to personal information associated with your account.' },
      { text: 'Request correction of inaccurate account information.' },
      { text: 'Request deletion of your account and associated personal information.' },
      { text: 'Disable optional permissions through Android settings.' },
      { text: 'Turn notifications or Wi-Fi-only downloads on or off in the app.' },
      { text: 'Log out and revoke FlexiWalls access through your Google Account settings.' },
      { text: 'Manage or cancel subscriptions through Google Play.' },
      { text: 'Reset or delete your Android advertising ID and manage available ad privacy settings on your device or Google account.' },
      {
        text: 'We may need to verify your identity before completing a request. Some information may be retained when required by law or needed for security, fraud prevention, transaction records or dispute resolution.',
      },
    ],
  },
  {
    id: 'security',
    title: '11. Security and international processing',
    icon: 'lock-closed-outline',
    summary:
      'We use safeguards, but no app, database or internet transmission can be guaranteed completely secure.',
    items: [
      {
        text: 'We use measures such as HTTPS, authentication, access controls, secure device storage where supported and restricted access to production services.',
      },
      {
        text: 'You should protect your device, Google account and payment account and avoid sharing authentication information.',
      },
      {
        text: 'Information may be processed in India and in other countries where our providers operate. Those locations may have data-protection laws different from those in your country.',
      },
    ],
  },
  {
    id: 'children',
    title: '12. Children’s privacy',
    icon: 'happy-outline',
    summary:
      'FlexiWalls is not specifically directed to children under the applicable minimum age.',
    items: [
      {
        text: 'FlexiWalls is not specifically directed to children under 13 or the minimum age required by applicable local law.',
      },
      {
        text: 'We do not knowingly collect personal information from children in a manner that violates applicable law.',
      },
      {
        text: 'Where parental or guardian consent is required, a child should not create an account, view personalized advertising or make a purchase without that consent.',
      },
      {
        text: 'A parent or guardian who believes a child provided personal information may contact us to request review and deletion.',
      },
    ],
  },
  {
    id: 'changes',
    title: '13. Changes and contact',
    icon: 'mail-outline',
    summary:
      'We may update this policy when the app, SDKs, providers or legal requirements change.',
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
                FlexiWalls processes information needed for login, wallpapers,
                favorites, downloads, advertising, premium access, purchases,
                security and support. This page explains how that information
                is handled and the choices available to you.
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