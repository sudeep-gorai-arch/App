import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
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

const CTA = ['#F472B6', '#A855F7', '#3B82F6'];
const AVATAR = 'https://picsum.photos/seed/wx-ethan/400/400';

const LabeledField = ({
  label,
  icon,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'email-address';
}) => (
  <View style={{ marginTop: spacing.md }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        selectionColor={colors.accent}
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  </View>
);

const EditPersonalInfoScreen = ({ navigation }: { navigation?: Nav }) => {
  const [first, setFirst] = useState('Ethan');
  const [last, setLast] = useState('Hunt');
  const [email, setEmail] = useState('ethanhunt@email.com');

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />
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
                <Text style={styles.headerTitle}>Edit Personal Info</Text>
                <Text style={styles.headerSub}>Update your details and keep your account secure.</Text>
              </View>
              <View style={{ width: 46 }} />
            </View>

            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                <Image source={{ uri: AVATAR }} style={styles.avatar} />
              </View>
              <Pressable style={styles.camera} hitSlop={6}>
                <Ionicons name="camera" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Fields */}
            <Card style={styles.block} padding={spacing.lg} strong>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={gradients.blueViolet} style={styles.sectionIcon}>
                  <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Full Name</Text>
              </View>
              <LabeledField label="First Name" icon="person-outline" value={first} onChangeText={setFirst} />
              <LabeledField label="Last Name" icon="person-outline" value={last} onChangeText={setLast} />

              <View style={styles.hr} />

              <View style={styles.sectionHeader}>
                <LinearGradient colors={gradients.violetMagenta} style={styles.sectionIcon}>
                  <Ionicons name="mail-outline" size={20} color={colors.textPrimary} />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Email Address</Text>
              </View>
              <LabeledField label="Email" icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" />
            </Card>

            {/* Note */}
            <View style={[styles.block, styles.note]}>
              <View style={styles.noteIcon}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.noteTitle}>Keep your information up to date</Text>
                <Text style={styles.noteText}>
                  Your personal information is used to personalize your experience
                  and keep your account secure.
                </Text>
              </View>
            </View>

            {/* CTA */}
            <Pressable style={({ pressed }) => [styles.block, pressed && { opacity: 0.85 }]}>
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                <Ionicons name="document-text-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.ctaText}>Save Changes</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.cancel}
              onPress={() => navigation?.goBack?.()}
              hitSlop={8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default EditPersonalInfoScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  headerTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2, textAlign: 'center' },
  avatarWrap: { alignSelf: 'center', marginTop: spacing.xl },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 3,
    borderWidth: 2,
    borderColor: colors.accentStrong,
    shadowColor: colors.accentStrong,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 60 },
  camera: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.baseElevated,
    borderWidth: 2,
    borderColor: colors.base,
  },
  block: { marginHorizontal: spacing.xl, marginTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  sectionIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  fieldLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
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
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: spacing.xl },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  noteIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chipViolet },
  noteTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  noteText: { color: colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 },
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
  cancel: { alignItems: 'center', marginTop: spacing.lg },
  cancelText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
});
