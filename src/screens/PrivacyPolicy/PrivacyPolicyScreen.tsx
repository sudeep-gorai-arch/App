import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors, gradients } from '../../styles/colors';
import { radius, spacing } from '../../utils/constants';

type Nav = {
  goBack?: () => void;
  navigate?: (screen: string) => void;
};

type IconName = keyof typeof Ionicons.glyphMap;

type MiniCard = {
  id: string;
  title: string;
  text: string;
  icon: IconName;
};

type JourneyStep = {
  id: string;
  label: string;
  title: string;
  text: string;
  icon: IconName;
};

type Bullet = {
  bold?: string;
  text: string;
};

type PolicySection = {
  id: string;
  title: string;
  icon: IconName;
  intro: string;
  bullets: Bullet[];
};

const LAST_UPDATED = 'June 29, 2026';

// Replace this email with your real support/privacy email before publishing.
const SUPPORT_EMAIL = 'support@flexiwalls.app';

const HERO_GRADIENT = ['#8B5CF6', '#EC4899', '#3B82F6'] as const;
const CTA_GRADIENT = ['#EC4899', '#8B5CF6', '#3B82F6'] as const;
const DARK_GLASS_GRADIENT = [
  'rgba(255,255,255,0.18)',
  'rgba(255,255,255,0.04)',
  'rgba(255,255,255,0.02)',
] as const;

const TRUST_PILLS: MiniCard[] = [
  {
    id: 'no-sale',
    title: 'No data sale',
    text: 'Your personal information is not sold.',
    icon: 'ban-outline',
  },
  {
    id: 'no-photo-upload',
    title: 'No photo upload',
    text: 'Gallery permission is only for saving wallpapers.',
    icon: 'image-outline',
  },
  {
    id: 'secure-session',
    title: 'Secure login',
    text: 'Session tokens stay on your device.',
    icon: 'lock-closed-outline',
  },
  {
    id: 'delete-control',
    title: 'Deletion control',
    text: 'You can request account or data deletion.',
    icon: 'trash-outline',
  },
];

const DATA_SUMMARY: MiniCard[] = [
  {
    id: 'account',
    title: 'Account data',
    text: 'Name, email, profile image and premium status when you sign in.',
    icon: 'person-outline',
  },
  {
    id: 'activity',
    title: 'App activity',
    text: 'Favorites, downloads, wallpaper IDs, categories and premium checks.',
    icon: 'heart-outline',
  },
  {
    id: 'device',
    title: 'Device & logs',
    text: 'Basic device, app, server and error logs for security and reliability.',
    icon: 'phone-portrait-outline',
  },
  {
    id: 'payments',
    title: 'Premium',
    text: 'Payment details should be handled by the app store or approved provider.',
    icon: 'card-outline',
  },
];

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'browse',
    label: '01',
    title: 'Browse wallpapers',
    text: 'FlexiWalls loads categories, trending items and wallpaper details from the backend.',
    icon: 'grid-outline',
  },
  {
    id: 'favorite',
    label: '02',
    title: 'Favorite something',
    text: 'If signed in, your selected wallpaper can be saved to your account favorites.',
    icon: 'heart-outline',
  },
  {
    id: 'download',
    label: '03',
    title: 'Download or apply',
    text: 'Media access is used only to save wallpapers. Android wallpaper access is used only when you tap apply.',
    icon: 'download-outline',
  },
  {
    id: 'control',
    label: '04',
    title: 'Stay in control',
    text: 'You can log out, revoke permissions or request data deletion whenever needed.',
    icon: 'shield-checkmark-outline',
  },
];

const SECTIONS: PolicySection[] = [
  {
    id: 'scope',
    title: '1. Scope of this policy',
    icon: 'document-text-outline',
    intro:
      'This Privacy Policy explains how FlexiWalls handles information when you browse wallpapers, save wallpapers, create an account, use favorites, download wallpapers or use premium features.',
    bullets: [
      {
        text: 'This policy applies to the FlexiWalls mobile app, backend APIs and related services.',
      },
      {
        text: 'Guest users can browse and download supported wallpapers without creating an account.',
      },
      {
        text: 'Some features, such as favorites, download history and premium access, may require sign-in.',
      },
    ],
  },
  {
    id: 'collect',
    title: '2. Information we collect',
    icon: 'server-outline',
    intro:
      'We collect only the information needed to provide the wallpaper experience, protect the service and improve app reliability.',
    bullets: [
      {
        bold: 'Account information:',
        text: 'When you sign in, we may receive your name, email address, profile image, user ID and premium status.',
      },
      {
        bold: 'Authentication data:',
        text: 'We store a login token on your device so you can stay signed in. The token is removed when you log out.',
      },
      {
        bold: 'Wallpaper activity:',
        text: 'We may process wallpaper IDs, favorites, download history, download counts, categories and premium access checks.',
      },
      {
        bold: 'Guest downloads:',
        text: 'For guest downloads, we may record the wallpaper download event to maintain download counts, limits, abuse prevention and app performance.',
      },
      {
        bold: 'Device and technical data:',
        text: 'We may process basic technical data such as app version, device type, operating system, IP address, crash or error logs and server request logs.',
      },
      {
        bold: 'Support messages:',
        text: 'If you contact us, we may collect the email address and message content you provide so we can respond.',
      },
    ],
  },
  {
    id: 'permissions',
    title: '3. App permissions',
    icon: 'settings-outline',
    intro:
      'FlexiWalls asks for permissions only when they are required for a feature you use.',
    bullets: [
      {
        bold: 'Photos or media library:',
        text: 'Used to save downloaded wallpapers to your gallery. We do not upload your personal photos to our servers.',
      },
      {
        bold: 'Set wallpaper permission on Android:',
        text: 'Used only when you choose to apply a wallpaper directly to your home screen, lock screen or both.',
      },
      {
        bold: 'Google Sign-In:',
        text: 'Used only when you choose to sign in with Google. Google may provide identity information needed for account login.',
      },
      {
        bold: 'Permission control:',
        text: 'You can disable app permissions anytime from your device settings, but some features may stop working.',
      },
    ],
  },
  {
    id: 'use',
    title: '4. How we use information',
    icon: 'sparkles-outline',
    intro:
      'We use information to provide the app features users expect from FlexiWalls.',
    bullets: [
      { text: 'Show wallpapers, categories, trending content and wallpaper details.' },
      { text: 'Save wallpapers to your device when you request a download.' },
      { text: 'Apply wallpapers directly on Android when you choose that action.' },
      { text: 'Sync account features such as favorites, premium status and download history.' },
      { text: 'Prevent abuse, enforce download limits and protect the app from unauthorized access.' },
      { text: 'Improve performance, troubleshoot issues and maintain service reliability.' },
      { text: 'Respond to support, privacy or deletion requests.' },
    ],
  },
  {
    id: 'sharing',
    title: '5. Sharing and third-party services',
    icon: 'people-outline',
    intro:
      'We do not sell your personal information. We share data only when needed to operate FlexiWalls, comply with law or protect users and the service.',
    bullets: [
      {
        bold: 'Service providers:',
        text: 'We may use providers for authentication, hosting, database, storage, content delivery, payments, security and support.',
      },
      {
        bold: 'Google Sign-In:',
        text: 'If you choose Google login, Google handles the sign-in flow according to its own privacy practices.',
      },
      {
        bold: 'App stores and payments:',
        text: 'Premium purchases should be processed by Google Play, Apple App Store or an approved payment provider. FlexiWalls should not store full card numbers or CVV codes.',
      },
      {
        bold: 'Legal and safety reasons:',
        text: 'We may disclose information if required by law, to enforce our terms, prevent fraud or protect rights and safety.',
      },
    ],
  },
  {
    id: 'ads',
    title: '6. Ads, tracking and analytics',
    icon: 'analytics-outline',
    intro:
      'FlexiWalls is designed as a wallpaper app and should be transparent about advertising and tracking choices.',
    bullets: [
      {
        text: 'At this stage, FlexiWalls does not use third-party advertising SDKs for personalized ads.',
      },
      {
        text: 'We do not track you across other companies’ apps or websites for advertising purposes.',
      },
      {
        text: 'If analytics, crash reporting or ads are added later, this policy and the store privacy declarations must be updated before release.',
      },
    ],
  },
  {
    id: 'retention',
    title: '7. Data retention and deletion',
    icon: 'time-outline',
    intro:
      'We keep information only as long as it is needed for app features, security, legal obligations or legitimate business purposes.',
    bullets: [
      {
        text: 'Account data is kept while your account is active unless deletion is requested or required by law.',
      },
      {
        text: 'Favorites and download history may be kept so they can appear in your account and profile screens.',
      },
      {
        text: 'Server logs are kept for a limited period for security, debugging and abuse prevention.',
      },
      {
        text: `To request deletion of your account or personal data, contact us at ${SUPPORT_EMAIL}.`,
      },
    ],
  },
  {
    id: 'rights',
    title: '8. Your choices and rights',
    icon: 'shield-checkmark-outline',
    intro:
      'Depending on your region, you may have privacy rights over your personal information.',
    bullets: [
      { text: 'Access, correct or update your account information.' },
      { text: 'Request deletion of your account or personal data.' },
      { text: 'Withdraw optional permissions from device settings.' },
      { text: 'Log out to remove the active session from your device.' },
      { text: 'Contact us for questions about privacy, account deletion or data access.' },
    ],
  },
  {
    id: 'children',
    title: '9. Children’s privacy',
    icon: 'happy-outline',
    intro:
      'FlexiWalls is not intended for children under the age required by applicable law to use online services without parental consent.',
    bullets: [
      {
        text: 'We do not knowingly collect personal information from children without appropriate consent.',
      },
      {
        text: 'If you believe a child has provided personal information, contact us and we will take appropriate action.',
      },
    ],
  },
  {
    id: 'security',
    title: '10. Security',
    icon: 'lock-closed-outline',
    intro:
      'We use reasonable technical and organizational measures to protect information handled by FlexiWalls.',
    bullets: [
      { text: 'Authentication tokens are stored using secure device storage where supported.' },
      { text: 'Requests to the production backend should use HTTPS.' },
      { text: 'No system is completely secure, so users should keep their device and account credentials protected.' },
    ],
  },
  {
    id: 'changes',
    title: '11. Changes to this policy',
    icon: 'information-circle-outline',
    intro:
      'We may update this Privacy Policy when FlexiWalls changes or when store, legal or security requirements change.',
    bullets: [
      { text: 'The latest version will show a new “Last updated” date.' },
      { text: 'Important changes may be communicated in the app or through another appropriate method.' },
      { text: 'You should review this policy before publishing new features that collect new data.' },
    ],
  },
  {
    id: 'contact',
    title: '12. Contact us',
    icon: 'mail-outline',
    intro:
      'For privacy questions, account deletion requests or data access requests, contact the FlexiWalls team.',
    bullets: [
      { bold: 'Email:', text: SUPPORT_EMAIL },
      { bold: 'App:', text: 'FlexiWalls' },
      { bold: 'Package:', text: 'com.flexiwalls.app' },
    ],
  },
];

const BulletRow = ({ item }: { item: Bullet }) => (
  <View style={styles.bulletRow}>
    <View style={styles.bulletDot} />
    <Text style={styles.bulletText}>
      {item.bold ? <Text style={styles.bulletBold}>{item.bold} </Text> : null}
      {item.text}
    </Text>
  </View>
);

const TrustPill = ({ item }: { item: MiniCard }) => (
  <View style={styles.trustPill}>
    <View style={styles.trustIconWrap}>
      <Ionicons name={item.icon} size={15} color={colors.accent} />
    </View>

    <View>
      <Text style={styles.trustTitle}>{item.title}</Text>
      <Text style={styles.trustText}>{item.text}</Text>
    </View>
  </View>
);

const FlipCardSurface = ({
  children,
  back,
}: {
  children: React.ReactNode;
  back?: boolean;
}) => (
  <BlurView
    intensity={34}
    tint="dark"
    experimentalBlurMethod="dimezisBlurView"
    style={[styles.flipGlassFace, back && styles.flipGlassBackFace]}
  >
    <LinearGradient
      colors={
        back
          ? ['rgba(139,92,246,0.26)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.035)']
          : ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.035)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />

    <View style={styles.flipGlassContent}>{children}</View>
  </BlurView>
);

const DataCard = ({ item }: { item: MiniCard }) => {
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const toggleFlip = () => {
    const nextFlipped = !flipped;

    setFlipped(nextFlipped);

    Animated.spring(flipAnim, {
      toValue: nextFlipped ? 180 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 65,
    }).start();
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <Pressable
      onPress={toggleFlip}
      style={({ pressed }) => [
        styles.flipCardPressable,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.flipCardShell}>
        <Animated.View
          pointerEvents={flipped ? 'none' : 'auto'}
          style={[
            styles.flipFace,
            {
              transform: [{ perspective: 900 }, { rotateY: frontRotate }],
            },
          ]}
        >
          <FlipCardSurface>
            <View style={styles.dataFrontTop}>
              <View style={styles.dataIconWrap}>
                <Ionicons name={item.icon} size={22} color={colors.accentBlue} />
              </View>

              <View style={styles.flipHintPill}>
                <Ionicons name="swap-horizontal" size={13} color={colors.accent} />
              </View>
            </View>

            <View style={styles.dataFrontMiddle}>
              <Text style={styles.dataFrontSubject} numberOfLines={2}>
                {item.title}
              </Text>

              <Text style={styles.dataFrontSubText}>Tap card to view details</Text>
            </View>
          </FlipCardSurface>
        </Animated.View>

        <Animated.View
          pointerEvents={flipped ? 'auto' : 'none'}
          style={[
            styles.flipFace,
            {
              transform: [{ perspective: 900 }, { rotateY: backRotate }],
            },
          ]}
        >
          <FlipCardSurface back>
            <View style={styles.dataBackTop}>
              <View style={styles.dataBackIconWrap}>
                <Ionicons name={item.icon} size={17} color={colors.accent} />
              </View>

              <Text style={styles.dataBackTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>

            <Text style={styles.dataText} numberOfLines={4}>
              {item.text}
            </Text>

            <View style={styles.dataBackHint}>
              <Ionicons name="refresh-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.dataBackHintText}>Tap to flip back</Text>
            </View>
          </FlipCardSurface>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const JourneyItem = ({
  item,
  isLast,
}: {
  item: JourneyStep;
  isLast: boolean;
}) => (
  <View style={styles.journeyItem}>
    <View style={styles.journeyRail}>
      <LinearGradient
        colors={CTA_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.journeyBadge}
      >
        <Ionicons name={item.icon} size={18} color={colors.textPrimary} />
      </LinearGradient>

      {!isLast ? <View style={styles.journeyLine} /> : null}
    </View>

    <View style={styles.journeyContent}>
      <Text style={styles.journeyLabel}>{item.label}</Text>
      <Text style={styles.journeyTitle}>{item.title}</Text>
      <Text style={styles.journeyText}>{item.text}</Text>
    </View>
  </View>
);

const PolicyBlock = ({
  section,
  expanded,
  onToggle,
}: {
  section: PolicySection;
  expanded: boolean;
  onToggle: () => void;
}) => (
  <Pressable
    onPress={onToggle}
    style={({ pressed }) => [pressed && styles.cardPressed]}
  >
    <Card style={styles.policyCard} padding={spacing.lg} strong>
      <View style={styles.policyHeader}>
        <View style={styles.policyIconWrap}>
          <Ionicons name={section.icon} size={20} color={colors.textPrimary} />
        </View>

        <View style={styles.policyTitleWrap}>
          <Text style={styles.policyTitle}>{section.title}</Text>
          <Text style={styles.policyIntro} numberOfLines={expanded ? undefined : 2}>
            {section.intro}
          </Text>
        </View>

        <View style={styles.expandIconWrap}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textPrimary}
          />
        </View>
      </View>

      {expanded ? (
        <View style={styles.bulletWrap}>
          {section.bullets.map((item, index) => (
            <BulletRow key={`${section.id}-${index}`} item={item} />
          ))}
        </View>
      ) : (
        <View style={styles.collapsedHint}>
          <Ionicons name="reader-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.collapsedText}>Tap to read details</Text>
        </View>
      )}
    </Card>
  </Pressable>
);

const PrivacyPolicyScreen = ({ navigation }: { navigation?: Nav }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const expandedCount = useMemo(
    () => SECTIONS.filter(section => openSections[section.id]).length,
    [openSections],
  );

  const allOpen = expandedCount === SECTIONS.length;

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const nextValue = !allOpen;
    const nextState = SECTIONS.reduce<Record<string, boolean>>((acc, section) => {
      acc[section.id] = nextValue;
      return acc;
    }, {});

    setOpenSections(nextState);
  };

  const openEmail = () => {
    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=FlexiWalls%20Privacy%20Request`,
    ).catch(() => {});
  };

  const openSupport = () => {
    navigation?.navigate?.('HelpSupport');
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RoundButton
              icon="chevron-back"
              onPress={() => navigation?.goBack?.()}
            />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.headerSubtitle}>Simple, clear and transparent</Text>
          </View>
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
            <BlurView
              intensity={36}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={styles.heroCard}
            >
              <LinearGradient
                colors={DARK_GLASS_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              <View style={styles.heroGlowOne} />
              <View style={styles.heroGlowTwo} />

              <View style={styles.heroTopRow}>
                <LinearGradient
                  colors={gradients.violetMagenta}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroIcon}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={34}
                    color={colors.textPrimary}
                  />
                </LinearGradient>

                <View style={styles.updatedPill}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={colors.accent}
                  />
                  <Text style={styles.updatedText}>Updated {LAST_UPDATED}</Text>
                </View>
              </View>

              <Text style={styles.heroKicker}>FlexiWalls data promise</Text>
              <Text style={styles.heroTitle}>Privacy, without the boring part.</Text>

              <Text style={styles.heroSubtitle}>
                We keep the wallpaper experience simple: browse, save, favorite
                and enjoy premium wallpapers while collecting only what is
                needed to run the app safely.
              </Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatBox}>
                  <Text style={styles.heroStatNumber}>0</Text>
                  <Text style={styles.heroStatLabel}>Data sold</Text>
                </View>

                <View style={styles.heroStatDivider} />

                <View style={styles.heroStatBox}>
                  <Text style={styles.heroStatNumber}>12</Text>
                  <Text style={styles.heroStatLabel}>Clear sections</Text>
                </View>

                <View style={styles.heroStatDivider} />

                <View style={styles.heroStatBox}>
                  <Text style={styles.heroStatNumber}>1 tap</Text>
                  <Text style={styles.heroStatLabel}>To expand</Text>
                </View>
              </View>
            </BlurView>
          </LinearGradient>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trustStrip}
          >
            {TRUST_PILLS.map(item => (
              <TrustPill key={item.id} item={item} />
            ))}
          </ScrollView>

          <View style={styles.sectionIntroWrap}>
            <Text style={styles.sectionEyebrow}>At a glance</Text>
            <Text style={styles.sectionHeading}>Tap the cards to flip</Text>
          </View>

          <View style={styles.dataGrid}>
            {DATA_SUMMARY.map(item => (
              <DataCard key={item.id} item={item} />
            ))}
          </View>

          <Card style={styles.journeyCard} padding={spacing.lg} glowBorder strong>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="git-branch-outline"
                  size={22}
                  color={colors.textPrimary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>Your privacy flow</Text>
                <Text style={styles.summarySub}>
                  A simple view of what happens when you use core app features.
                </Text>
              </View>
            </View>

            <View style={styles.journeyList}>
              {JOURNEY_STEPS.map((item, index) => (
                <JourneyItem
                  key={item.id}
                  item={item}
                  isLast={index === JOURNEY_STEPS.length - 1}
                />
              ))}
            </View>
          </Card>

          <Card style={styles.storeCard} padding={spacing.lg} strong>
            <View style={styles.storeCardTop}>
              <View style={styles.storeIconWrap}>
                <Ionicons name="storefront-outline" size={22} color={colors.accent} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.storeTitle}>Store-ready reminder</Text>
                <Text style={styles.storeText}>
                  Use the same data practices in Google Play Data Safety and
                  Apple App Privacy. Update this policy before adding ads,
                  analytics, crash SDKs or new payment flows.
                </Text>
              </View>
            </View>
          </Card>

          <View style={styles.fullPolicyHeader}>
            <View style={styles.sectionIntroWrapCompact}>
              <Text style={styles.sectionEyebrow}>Full policy</Text>
              <Text style={styles.sectionHeading}>Tap any section to expand</Text>
            </View>

            <Pressable
              onPress={toggleAll}
              style={({ pressed }) => [
                styles.expandAllButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons
                name={allOpen ? 'contract-outline' : 'expand-outline'}
                size={15}
                color={colors.textPrimary}
              />
              <Text style={styles.expandAllText}>
                {allOpen ? 'Close all' : 'Open all'}
              </Text>
            </Pressable>
          </View>

          {SECTIONS.map(section => (
            <PolicyBlock
              key={section.id}
              section={section}
              expanded={!!openSections[section.id]}
              onToggle={() => toggleSection(section.id)}
            />
          ))}

          <Card style={styles.contactCard} padding={spacing.lg} strong>
            <View style={styles.contactHeader}>
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={24} color={colors.textPrimary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.contactTitle}>Need privacy help?</Text>
                <Text style={styles.contactSub}>
                  Send a data access, correction or deletion request.
                </Text>
              </View>
            </View>

            <View style={styles.emailPreview}>
              <Ionicons name="at-outline" size={17} color={colors.accentBlue} />
              <Text style={styles.emailPreviewText}>{SUPPORT_EMAIL}</Text>
            </View>

            <View style={styles.contactActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={openSupport}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color={colors.textPrimary}
                />
                <Text style={styles.secondaryText}>Help Center</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButtonWrap,
                  pressed && styles.buttonPressed,
                ]}
                onPress={openEmail}
              >
                <LinearGradient
                  colors={CTA_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Ionicons
                    name="send-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                  <Text style={styles.primaryText}>Email Us</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Card>

          <Text style={styles.footerNote}>
            This screen is written for FlexiWalls app transparency. Before
            publishing, make sure this same policy is hosted on a public URL and
            the same data practices are declared in the store privacy forms.
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
    minHeight: 62,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  headerLeft: {
    position: 'absolute',
    left: spacing.xl,
    top: spacing.sm + 5,
  },
  headerTextWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },

  heroBorder: {
    borderRadius: 32,
    padding: 1.5,
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 14,
  },
  heroCard: {
    borderRadius: 30,
    overflow: 'hidden',
    padding: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -42,
    top: -46,
    backgroundColor: 'rgba(236,72,153,0.22)',
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    left: -56,
    bottom: -50,
    backgroundColor: 'rgba(59,130,246,0.18)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    width: 66,
    height: 66,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  updatedText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  heroKicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    marginTop: spacing.md,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  heroStatsRow: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatNumber: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  heroStatLabel: {
    marginTop: 4,
    color: colors.textTertiary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  trustStrip: {
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  trustPill: {
    width: 220,
    minHeight: 74,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  trustIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
  },
  trustTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  trustText: {
    marginTop: 4,
    width: 145,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },

  sectionIntroWrap: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionIntroWrapCompact: {
    flex: 1,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionHeading: {
    marginTop: 6,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  flipCardPressable: {
    width: '48%',
  },
  flipCardShell: {
    width: '100%',
    height: 178,
    minHeight: 178,
    maxHeight: 178,
    position: 'relative',
  },
  flipFace: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 178,
    backfaceVisibility: 'hidden',
  },
  flipGlassFace: {
    width: '100%',
    height: 178,
    minHeight: 178,
    maxHeight: 178,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  flipGlassBackFace: {
    borderColor: 'rgba(139,92,246,0.38)',
    backgroundColor: 'rgba(139,92,246,0.10)',
  },
  flipGlassContent: {
    flex: 1,
    height: 178,
    padding: spacing.md,
  },
  dataFrontTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataFrontMiddle: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  dataFrontSubject: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  dataFrontSubText: {
    marginTop: 10,
    color: colors.textTertiary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  flipHintPill: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dataIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipBlue,
  },
  dataBackTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dataBackIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
  },
  dataBackTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  dataText: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 12.2,
    lineHeight: 18,
    fontWeight: '500',
  },
  dataBackHint: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dataBackHintText: {
    color: colors.textTertiary,
    fontSize: 11.5,
    fontWeight: '700',
  },

  journeyCard: {
    marginTop: spacing.xxl,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipPink,
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  summarySub: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  journeyList: {
    marginTop: spacing.xl,
  },
  journeyItem: {
    flexDirection: 'row',
  },
  journeyRail: {
    width: 42,
    alignItems: 'center',
  },
  journeyBadge: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyLine: {
    flex: 1,
    width: 1,
    minHeight: 44,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  journeyContent: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  journeyLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  journeyTitle: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  journeyText: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  storeCard: {
    marginTop: spacing.xl,
    borderColor: 'rgba(139,92,246,0.34)',
  },
  storeCardTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  storeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
  },
  storeTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  storeText: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 13.2,
    lineHeight: 20,
    fontWeight: '500',
  },

  fullPolicyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  expandAllButton: {
    marginBottom: spacing.md,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  expandAllText: {
    color: colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '900',
  },

  policyCard: {
    marginTop: spacing.lg,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  policyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  policyTitleWrap: {
    flex: 1,
  },
  policyTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
  },
  policyIntro: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  expandIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bulletWrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    paddingRight: spacing.xs,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 8,
    marginRight: spacing.md,
  },
  bulletText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  bulletBold: {
    color: colors.textPrimary,
    fontWeight: '900',
  },
  collapsedHint: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  collapsedText: {
    color: colors.textTertiary,
    fontSize: 12.5,
    fontWeight: '700',
  },

  contactCard: {
    marginTop: spacing.xxl,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
  },
  contactTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  contactSub: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  emailPreview: {
    marginTop: spacing.lg,
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  emailPreviewText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  contactActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  primaryButtonWrap: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    overflow: 'hidden',
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  primaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },

  footerNote: {
    marginTop: spacing.xl,
    color: colors.textTertiary,
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
});