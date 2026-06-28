import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors, gradients } from '../../styles/colors';
import { spacing, radius } from '../../utils/constants';

type Nav = {
  goBack?: () => void;
};

type HelpItem = {
  id: string;
  title: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type SupportPoint = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const SUPPORT_EMAIL = 'support@flexiwalls.app';

const EMAIL_SUBJECT = 'FlexiWalls Support Request';

const EMAIL_BODY = `Hi FlexiWalls Support,

I need help with:

Device:
App version:
Issue details:

`;

const HELP_ITEMS: HelpItem[] = [
  {
    id: 'account',
    title: 'Account & login',
    text: 'Help with sign in, profile changes, and account access.',
    icon: 'person-circle-outline',
  },
  {
    id: 'premium',
    title: 'Premium & payments',
    text: 'Questions about plans, billing, renewal, and premium access.',
    icon: 'diamond-outline',
  },
  {
    id: 'app',
    title: 'App issues',
    text: 'Report bugs, crashes, slow loading, or wallpaper related issues.',
    icon: 'bug-outline',
  },
];

const SUPPORT_POINTS: SupportPoint[] = [
  { id: 'fast', label: '24 hour response', icon: 'time-outline' },
  { id: 'secure', label: 'Private support', icon: 'shield-checkmark-outline' },
  { id: 'human', label: 'Real team review', icon: 'sparkles-outline' },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'download-location',
    question: 'Where are my downloaded wallpapers saved?',
    answer:
      'Downloaded wallpapers are saved to your phone gallery inside the FlexiWalls album. You can also see your recent downloads from the Downloads page inside the app.',
  },
  {
    id: 'guest-downloads',
    question: 'Can I download wallpapers without logging in?',
    answer:
      'Yes. FlexiWalls allows guest users to browse and download wallpapers. Logging in is only needed for account-based features like syncing favorites and premium access.',
  },
  {
    id: 'download-limit',
    question: 'Why did my free downloads stop after a few wallpapers?',
    answer:
      'Free users have a daily download limit. This keeps the app fair and protects the server from heavy usage. Premium users get more access based on the selected plan.',
  },
  {
    id: 'premium-wallpapers',
    question: 'Why are some wallpapers locked?',
    answer:
      'Locked wallpapers are premium wallpapers. You can open the Premium page to unlock premium collections and get access to higher quality exclusive wallpapers.',
  },
  {
    id: 'wallpaper-quality',
    question: 'Are FlexiWalls wallpapers available in high quality?',
    answer:
      'Yes. Wallpapers can include quality labels like 4K or 8K depending on the uploaded image. The details page also shows information like category, resolution, and download count.',
  },
  {
    id: 'favorites',
    question: 'How do favorites work?',
    answer:
      'Tap the heart icon on a wallpaper to save it to your Favorites page. If you are logged in, your favorites can stay connected with your account.',
  },
  {
    id: 'image-loading',
    question: 'Why do wallpapers sometimes take time to load?',
    answer:
      'High quality wallpapers can be large, so loading depends on your internet speed and server response. FlexiWalls uses thumbnails and paginated loading to reduce pressure on the home screen.',
  },
  {
    id: 'download-failed',
    question: 'What should I do if a wallpaper download fails?',
    answer:
      'Check your internet connection, allow photo or media permissions, and try again. If the issue continues, contact Email Support with your phone model and the wallpaper name.',
  },
  {
    id: 'apply-wallpaper',
    question: 'Can I apply a wallpaper directly from the app?',
    answer:
      'Currently, FlexiWalls focuses on downloading wallpapers to your gallery. Direct Apply Wallpaper support can be added through native Android functionality in a future update.',
  },
  {
    id: 'payment-issue',
    question: 'What if my premium payment is successful but access is not unlocked?',
    answer:
      'Open Email Support and share your registered email, payment screenshot, and approximate payment time. Our team can verify and help restore premium access.',
  },
  {
    id: 'app-crash',
    question: 'What details should I send if the app crashes?',
    answer:
      'Please send your phone model, Android version, app version, what screen you were using, and what action caused the crash. This helps us identify the issue faster.',
  },
  {
    id: 'privacy',
    question: 'Does FlexiWalls access my private photos?',
    answer:
      'FlexiWalls requests media permission only to save wallpapers to your device gallery. The app does not need to read your private photos for normal wallpaper browsing.',
  },
];

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionSub}>{subtitle}</Text>
  </View>
);

const SupportPill = ({ item }: { item: SupportPoint }) => (
  <View style={styles.supportPill}>
    <Ionicons name={item.icon} size={15} color={colors.accent} />
    <Text style={styles.supportPillText}>{item.label}</Text>
  </View>
);

const HelpMiniCard = ({ item }: { item: HelpItem }) => (
  <Card style={styles.miniCard} padding={spacing.lg}>
    <View style={styles.miniIcon}>
      <Ionicons name={item.icon} size={23} color={colors.accent} />
    </View>

    <Text style={styles.miniTitle}>{item.title}</Text>
    <Text style={styles.miniText}>{item.text}</Text>
  </Card>
);

const HelpSupportScreen = ({ navigation }: { navigation?: Nav }) => {
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const openEmailSupport = async () => {
    const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      EMAIL_SUBJECT,
    )}&body=${encodeURIComponent(EMAIL_BODY)}`;

    try {
      await Linking.openURL(mailUrl);
    } catch (error) {
      Alert.alert(
        'Email app not found',
        `Please email us directly at ${SUPPORT_EMAIL}`,
      );
    }
  };

  const toggleFaq = (id: string) => {
    setExpandedFaqId(currentId => (currentId === id ? null : id));
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RoundButton
              icon="chevron-back"
              onPress={() => navigation?.goBack?.()}
            />
          </View>

          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Card style={styles.heroCard} padding={0} glowBorder strong>
            <LinearGradient
              colors={gradients.violetMagenta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <BlurView intensity={22} tint="dark" style={styles.heroBlur}>
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIconWrap}>
                    <Ionicons
                      name="headset-outline"
                      size={31}
                      color={colors.textPrimary}
                    />
                  </View>

                  <View style={styles.heroBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.heroBadgeText}>Support</Text>
                  </View>
                </View>

                <Text style={styles.heroTitle}>Need help with FlexiWalls?</Text>

                <Text style={styles.heroText}>
                  Tell us what happened and our support team will help you with
                  account, premium, payment, or app related issues.
                </Text>

                <View style={styles.supportPillWrap}>
                  {SUPPORT_POINTS.map(item => (
                    <SupportPill key={item.id} item={item} />
                  ))}
                </View>
              </BlurView>
            </LinearGradient>
          </Card>

          <View style={styles.sectionWrap}>
            <SectionHeader
              title="Frequently asked questions"
              subtitle="Tap a question to expand the answer. Swipe inside the list to view more."
            />

            <Card style={styles.faqTableCard} padding={0}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={styles.faqList}
                contentContainerStyle={styles.faqListContent}
              >
                {FAQ_ITEMS.map((item, index) => {
                  const expanded = expandedFaqId === item.id;
                  const isLast = index === FAQ_ITEMS.length - 1;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleFaq(item.id)}
                      style={({ pressed }) => [
                        styles.faqRow,
                        !isLast && styles.faqDivider,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.faqQuestionRow}>
                        <View style={styles.faqNumber}>
                          <Text style={styles.faqNumberText}>
                            {index + 1 < 10 ? `0${index + 1}` : index + 1}
                          </Text>
                        </View>

                        <Text style={styles.faqQuestion}>{item.question}</Text>

                        <View
                          style={[
                            styles.faqChevron,
                            expanded && styles.faqChevronActive,
                          ]}
                        >
                          <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={
                              expanded
                                ? colors.textPrimary
                                : colors.textSecondary
                            }
                          />
                        </View>
                      </View>

                      {expanded ? (
                        <View style={styles.faqAnswerWrap}>
                          <Text style={styles.faqAnswer}>{item.answer}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.faqFooter}>
                <Ionicons
                  name="swap-vertical-outline"
                  size={15}
                  color={colors.textTertiary}
                />
                <Text style={styles.faqFooterText}>Swipe to view more FAQs</Text>
              </View>
            </Card>
          </View>

          <View style={styles.sectionWrap}>
            <SectionHeader
              title="Contact support"
              subtitle="Email is the fastest way to share details and screenshots."
            />

            <Pressable
              onPress={openEmailSupport}
              style={({ pressed }) => [
                styles.emailPress,
                pressed && styles.pressed,
              ]}
            >
              <Card padding={spacing.lg} glowBorder>
                <View style={styles.emailRow}>
                  <View style={styles.emailIcon}>
                    <Ionicons
                      name="mail-outline"
                      size={31}
                      color={colors.textPrimary}
                    />
                  </View>

                  <View style={styles.emailBody}>
                    <Text style={styles.emailTitle}>Email Support</Text>

                    <Text style={styles.emailText}>
                      Open your email app and send your issue directly to us.
                    </Text>

                    <View style={styles.emailMetaRow}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={colors.accentBlue}
                      />
                      <Text style={styles.emailMeta}>
                        Response within 24 hours
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chevronWrap}>
                    <Ionicons
                      name="chevron-forward"
                      size={21}
                      color={colors.textPrimary}
                    />
                  </View>
                </View>
              </Card>
            </Pressable>
          </View>

          <View style={styles.sectionWrap}>
            <SectionHeader
              title="What we can help with"
              subtitle="Share the right details so we can resolve your request faster."
            />

            {HELP_ITEMS.map(item => (
              <HelpMiniCard key={item.id} item={item} />
            ))}
          </View>

          <Card style={styles.noteCard} padding={spacing.lg}>
            <View style={styles.noteRow}>
              <View style={styles.noteIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color={colors.accent}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.noteTitle}>Tip before contacting us</Text>

                <Text style={styles.noteText}>
                  Include your registered email, phone model, app version, and a
                  short description of the issue for quicker help.
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HelpSupportScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  header: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  headerLeft: {
    position: 'absolute',
    left: spacing.xl,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },

  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: 130,
  },

  heroCard: {
    marginHorizontal: spacing.xl,
  },
  heroGradient: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  heroBlur: {
    padding: spacing.xl,
    backgroundColor: 'rgba(15, 15, 16, 0.18)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  heroBadgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  heroText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  supportPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  supportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(15,15,16,0.34)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  supportPillText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },

  sectionWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  sectionSub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  faqTableCard: {
    marginTop: spacing.sm,
  },
  faqList: {
    maxHeight: 258,
  },
  faqListContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  faqRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },
  faqDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glassBorderSoft,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  faqNumberText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
  },
  faqQuestion: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    marginLeft: spacing.md,
  },
  faqChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    marginLeft: spacing.sm,
  },
  faqChevronActive: {
    backgroundColor: colors.glassFillSoft,
    borderColor: colors.glassBorder,
  },
  faqAnswerWrap: {
    marginTop: spacing.md,
    marginLeft: 46,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  faqAnswer: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  faqFooter: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorderSoft,
    backgroundColor: 'transparent',
  },
  faqFooterText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
  },

  emailPress: {
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailIcon: {
    width: 64,
    height: 64,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  emailBody: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  emailTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  emailText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  emailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  emailMeta: {
    color: colors.accentBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  chevronWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  miniCard: {
    marginTop: spacing.md,
  },
  miniIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    marginBottom: spacing.md,
  },
  miniTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  miniText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  noteCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  noteRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  noteIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  noteTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  noteText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
});