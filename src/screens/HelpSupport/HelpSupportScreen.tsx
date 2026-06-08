import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
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

type Nav = { goBack?: () => void };

const ONLINE = '#34D399';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
type FaqCat = { id: string; label: string; icon: keyof typeof Ionicons.glyphMap };

const FAQ_CATEGORIES: FaqCat[] = [
  { id: 'downloads', label: 'Downloads', icon: 'download-outline' },
  { id: 'billing', label: 'Billing', icon: 'card-outline' },
  { id: 'account', label: 'Account', icon: 'person-outline' },
  { id: 'privacy', label: 'Privacy', icon: 'shield-checkmark-outline' },
  { id: 'features', label: 'Features', icon: 'star-outline' },
];

type Contact = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  meta: string;
  metaIcon?: keyof typeof Ionicons.glyphMap;
  metaColor: string;
  showDot?: boolean;
};

const CONTACTS: Contact[] = [
  {
    id: 'chat',
    title: 'Live Chat',
    subtitle: 'Chat with our support team in real-time',
    icon: 'chatbubbles-outline',
    meta: 'Online now',
    metaColor: ONLINE,
    showDot: true,
  },
  {
    id: 'email',
    title: 'Email Support',
    subtitle: "Send us an email and we'll get back to you",
    icon: 'mail-outline',
    meta: 'Response within 24 hours',
    metaIcon: 'time-outline',
    metaColor: colors.accentBlue,
  },
  {
    id: 'forum',
    title: 'Community Forum',
    subtitle: 'Get help from our community and share tips',
    icon: 'people-outline',
    meta: 'Active community',
    metaIcon: 'people-outline',
    metaColor: colors.accent,
  },
];

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
const SectionHeader = ({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIcon}>
      <Ionicons name={icon} size={22} color={colors.accent} />
    </View>
    <View style={{ marginLeft: spacing.md }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </View>
  </View>
);

const FaqChip = ({
  item,
  active,
  onPress,
}: {
  item: FaqCat;
  active: boolean;
  onPress: () => void;
}) => {
  const inner = (
    <BlurView
      intensity={28}
      tint="dark"
      style={[styles.chipGlass, { backgroundColor: active ? 'rgba(139,92,246,0.16)' : colors.glassFill }]}
    >
      <Ionicons name={item.icon} size={24} color={colors.textPrimary} />
      <Text style={styles.chipLabel}>{item.label}</Text>
    </BlurView>
  );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      {active ? (
        <LinearGradient
          colors={gradients.violetMagenta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chipActiveBorder}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View style={styles.chipBorder}>{inner}</View>
      )}
    </Pressable>
  );
};

const ContactCard = ({ item }: { item: Contact }) => (
  <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
    <Card style={{ marginTop: spacing.lg }} padding={spacing.lg} glowBorder>
      <View style={styles.contactRow}>
        <View style={styles.contactIcon}>
          <Ionicons name={item.icon} size={34} color={colors.textPrimary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.lg }}>
          <Text style={styles.contactTitle}>{item.title}</Text>
          <Text style={styles.contactSub}>{item.subtitle}</Text>
          <View style={styles.metaRow}>
            {item.showDot ? <View style={[styles.dot, { backgroundColor: item.metaColor }]} /> : null}
            {item.metaIcon ? (
              <Ionicons name={item.metaIcon} size={14} color={item.metaColor} />
            ) : null}
            <Text style={[styles.metaText, { color: item.metaColor }]}>{item.meta}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
      </View>
    </Card>
  </Pressable>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const HelpSupportScreen = ({ navigation }: { navigation?: Nav }) => {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('downloads');

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RoundButton icon="chevron-back" onPress={() => navigation?.goBack?.()} />
          </View>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
        >
          {/* search */}
          <BlurView intensity={32} tint="dark" style={styles.search}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              selectionColor={colors.accent}
            />
          </BlurView>

          {/* FAQ */}
          <View style={styles.sectionWrap}>
            <SectionHeader
              icon="help-circle-outline"
              title="Frequently Asked Questions"
              subtitle="Browse help topics by category"
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
          >
            {FAQ_CATEGORIES.map((c) => (
              <FaqChip
                key={c.id}
                item={c}
                active={c.id === activeCat}
                onPress={() => setActiveCat(c.id)}
              />
            ))}
          </ScrollView>

          {/* Contact */}
          <View style={[styles.sectionWrap, { marginTop: spacing.xxl }]}>
            <SectionHeader
              icon="headset-outline"
              title="Contact Us"
              subtitle="We're here to help you 24/7"
            />
            {CONTACTS.map((c) => (
              <ContactCard key={c.id} item={c} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HelpSupportScreen;

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

  // search
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    height: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 16 },

  // sections
  sectionWrap: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  sectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  sectionSub: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },

  // faq chips
  chipActiveBorder: { borderRadius: radius.lg + 1.5, padding: 1.5 },
  chipBorder: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  chipGlass: {
    width: 104,
    height: 96,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chipLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },

  // contact cards
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  contactTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  contactSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { fontSize: 13, fontWeight: '700' },
});
