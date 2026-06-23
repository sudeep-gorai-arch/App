import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../utils/constants';

type Nav = { goBack?: () => void };

const CTA = ['#3B82F6', '#8B5CF6', '#EC4899'] as const;
const MAX = 1000;

const CATEGORIES = [
  { id: 'general', label: 'General', icon: 'chatbubble-ellipses-outline' },
  { id: 'billing', label: 'Billing', icon: 'card-outline' },
  { id: 'account', label: 'Account', icon: 'person-outline' },
  { id: 'technical', label: 'Technical', icon: 'settings-outline' },
] as const;

const EmailSupportScreen = ({ navigation }: { navigation?: Nav }) => {
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');

  return (
    <View style={styles.root}>
      <MeshBackground variant="about" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <RoundButton icon="chevron-back" onPress={() => navigation?.goBack?.()} />
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Email Support</Text>
                <View style={styles.heartRow}>
                  <Text style={styles.headerSub}>We're here to help you </Text>
                  <Ionicons name="heart" size={14} color={colors.heart} />
                </View>
              </View>
              <View style={{ width: 46 }} />
            </View>

            {/* Banner */}
            <Card style={styles.block} padding={spacing.lg} strong>
              <View style={styles.bannerRow}>
                <View style={styles.bannerIcon}>
                  <Ionicons name="mail-outline" size={30} color={colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.lg }}>
                  <Text style={styles.bannerTitle}>Send us an email</Text>
                  <Text style={styles.bannerText}>Our support team typically responds within 24 hours.</Text>
                  <View style={styles.responsePill}>
                    <Ionicons name="time-outline" size={14} color={colors.accent} />
                    <Text style={styles.responseText}>Response within 24 hours</Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* Form */}
            <Card style={styles.block} padding={spacing.lg} strong>
              <Text style={styles.label}>Your Email</Text>
              <View style={styles.field}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="youremail@example.com"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor={colors.accent}
                />
              </View>

              <Text style={[styles.label, { marginTop: spacing.lg }]}>Subject</Text>
              <Pressable style={styles.field}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.fieldInput, { color: colors.textTertiary }]}>Choose a topic</Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </Pressable>

              <Text style={[styles.label, { marginTop: spacing.lg }]}>Category</Text>
              <View style={styles.catRow}>
                {CATEGORIES.map(c => {
                  const active = category === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategory(c.id)}
                      style={[styles.cat, active && styles.catActive]}
                    >
                      <Ionicons name={c.icon as any} size={16} color={active ? colors.accent : colors.textSecondary} />
                      <Text style={[styles.catText, active && { color: colors.accent }]}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, { marginTop: spacing.lg }]}>Message</Text>
              <View style={styles.textareaWrap}>
                <TextInput
                  style={styles.textarea}
                  placeholder="Describe your issue or question in detail..."
                  placeholderTextColor={colors.textTertiary}
                  value={message}
                  onChangeText={t => t.length <= MAX && setMessage(t)}
                  multiline
                  textAlignVertical="top"
                  selectionColor={colors.accent}
                />
                <Text style={styles.counter}>{message.length}/{MAX}</Text>
              </View>

              <View style={styles.privacy}>
                <View style={styles.privacyIcon}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.privacyTitle}>Your privacy matters</Text>
                  <Text style={styles.privacyText}>
                    We never share your personal information. All messages are
                    secure and encrypted.
                  </Text>
                </View>
              </View>
            </Card>

            {/* CTA */}
            <Pressable style={({ pressed }) => [styles.block, pressed && { opacity: 0.85 }]}>
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                <Ionicons name="paper-plane-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.ctaText}>Send Message</Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.agree}>
              By sending, you agree to our <Text style={styles.agreeLink}>Privacy Policy</Text>.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default EmailSupportScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  heartRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  headerSub: { color: colors.textSecondary, fontSize: 14 },
  block: { marginHorizontal: spacing.xl, marginTop: spacing.xl },
  bannerRow: { flexDirection: 'row', alignItems: 'center' },
  bannerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  bannerTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '800' },
  bannerText: { color: colors.textSecondary, fontSize: 14, marginTop: 3, lineHeight: 19 },
  responsePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  responseText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  label: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 54,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  fieldInput: { flex: 1, color: colors.textPrimary, fontSize: 16 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  catActive: { backgroundColor: colors.chipViolet, borderColor: colors.accentStrong },
  catText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  textareaWrap: {
    borderRadius: radius.md,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    padding: spacing.md,
  },
  textarea: { color: colors.textPrimary, fontSize: 16, minHeight: 120 },
  counter: { color: colors.textTertiary, fontSize: 12, alignSelf: 'flex-end' },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.glassFillSoft,
  },
  privacyIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chipViolet },
  privacyTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  privacyText: { color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 58,
    borderRadius: radius.pill,
    shadowColor: colors.accentStrong,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  ctaText: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  agree: { color: colors.textTertiary, fontSize: 13, textAlign: 'center', marginTop: spacing.lg },
  agreeLink: { color: colors.accent },
});
