import React, { useMemo, useState } from 'react';
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

const CTA = ['#F472B6', '#A855F7', '#3B82F6'];

const PasswordField = ({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
}) => {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.input}>
      <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
      <TextInput
        style={styles.inputText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidden}
        autoCapitalize="none"
        selectionColor={colors.accent}
      />
      <Pressable onPress={() => setHidden(h => !h)} hitSlop={8}>
        <Ionicons
          name={hidden ? 'eye-outline' : 'eye-off-outline'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
  );
};

const SecurityScreen = ({ navigation }: { navigation?: Nav }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const strong = useMemo(
    () => next.length >= 8 && /[A-Z]/.test(next) && /[0-9]/.test(next),
    [next],
  );

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
                <Text style={styles.headerTitle}>Security</Text>
                <Text style={styles.headerSub}>Update Your Password</Text>
              </View>
              <View style={{ width: 46 }} />
            </View>

            {/* Shield */}
            <View style={styles.shieldWrap}>
              <View style={styles.shield}>
                <Ionicons name="shield-half-outline" size={52} color={colors.accent} />
                <View style={styles.shieldLock}>
                  <Ionicons name="lock-closed" size={20} color={colors.textPrimary} />
                </View>
              </View>
            </View>
            <Text style={styles.intro}>Choose a strong password and keep your account secure.</Text>

            {/* Form panel */}
            <Card style={styles.block} padding={spacing.lg} strong>
              <Text style={styles.label}>Current Password</Text>
              <PasswordField placeholder="Enter your current password" value={current} onChangeText={setCurrent} />
              <Pressable hitSlop={6} style={{ marginTop: spacing.md }}>
                <Text style={styles.forgot}>Forgot current password?</Text>
              </Pressable>

              <View style={styles.hr} />

              <Text style={styles.label}>New Password</Text>
              <PasswordField placeholder="Enter your new password" value={next} onChangeText={setNext} />
              <View style={styles.hintRow}>
                <Text style={styles.hint}>Use 8 or more characters with a mix of letters, numbers & symbols.</Text>
                {next.length > 0 ? (
                  <View style={styles.strongRow}>
                    <Ionicons
                      name="shield-checkmark"
                      size={14}
                      color={strong ? '#34D399' : colors.textTertiary}
                    />
                    <Text style={[styles.strong, { color: strong ? '#34D399' : colors.textTertiary }]}>
                      {strong ? 'Strong' : 'Weak'}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.hr} />

              <Text style={styles.label}>Confirm New Password</Text>
              <PasswordField placeholder="Re-enter your new password" value={confirm} onChangeText={setConfirm} />
            </Card>

            {/* Note */}
            <View style={[styles.block, styles.note]}>
              <View style={styles.noteIcon}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.accent} />
              </View>
              <Text style={styles.noteText}>
                For your security, you'll be signed out of all other devices after
                your password is changed.
              </Text>
            </View>

            {/* CTA */}
            <Pressable style={({ pressed }) => [styles.block, pressed && { opacity: 0.85 }]}>
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                <Ionicons name="lock-closed" size={18} color={colors.textPrimary} />
                <Text style={styles.ctaText}>Update Password</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default SecurityScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  shieldWrap: { alignItems: 'center', marginTop: spacing.lg },
  shield: {
    width: 110,
    height: 110,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.accentStrong,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  shieldLock: {
    position: 'absolute',
    bottom: 28,
  },
  intro: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xxl,
    lineHeight: 21,
  },
  block: { marginHorizontal: spacing.xl, marginTop: spacing.xl },
  label: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: spacing.md },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  inputText: { flex: 1, color: colors.textPrimary, fontSize: 16 },
  forgot: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: spacing.lg },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.md, gap: spacing.md },
  hint: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  strongRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  strong: { fontSize: 13, fontWeight: '700' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  noteIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chipViolet,
    marginRight: spacing.md,
  },
  noteText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
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
});
