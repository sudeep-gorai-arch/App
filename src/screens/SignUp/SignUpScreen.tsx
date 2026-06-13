import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import MeshBackground from '../../components/MeshBackground';
import GlassInput from '../../components/GlassInput';
import { RoundButton } from '../../components/Header';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../utils/constants';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { register as registerRequest } from '../../services/authService';
import { useAuth } from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const BRAND = 'VividWalls';
const CTA_GRADIENT = ['#EC4899', '#A855F7', '#3B82F6'] as const;

const SOCIALS: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'google', label: 'Google', icon: 'logo-google' },
  { id: 'apple', label: 'Apple', icon: 'logo-apple' },
  { id: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
];

/** Mirrors the password rule shown in the mockup. */
const isStrong = (pw: string) =>
  pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);

const SignupScreen = ({ navigation }: Props) => {
  const setSession = useAuth(s => s.login);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goHome = () =>
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });

  const onSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Missing details', 'Please fill in all the fields.');
      return;
    }
    if (!isStrong(password)) {
      Alert.alert(
        'Weak password',
        'Use at least 8 characters with an uppercase letter, a number, and a symbol.',
      );
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Please re-enter your password.');
      return;
    }

    try {
      setSubmitting(true);

      const res = await registerRequest({
        email: email.trim(),
        password,
        username: fullName.trim(),
      });
      const { user, token } = res.data;

      await AsyncStorage.setItem('token', token);

      setSession(
        {
          id: user.id,
          username: user.username ?? fullName.trim(),
          isPremium: false,
        },
        token,
      );

      goHome();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        'Unable to create your account. Please try again.';
      Alert.alert('Sign up failed', message);
      console.log('SIGNUP ERROR', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <RoundButton icon="chevron-back" onPress={() => navigation.goBack()} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scroll}
            >
              {/* Avatar glow */}
              <View style={styles.avatarWrap}>
                <View style={styles.avatarHalo}>
                  <Ionicons name="person-outline" size={44} color={colors.accent} />
                </View>
              </View>

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join us and start exploring amazing wallpapers.
              </Text>

              <View style={styles.form}>
                <GlassInput
                  icon="person-outline"
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
                <GlassInput
                  icon="mail-outline"
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  style={{ marginTop: spacing.lg }}
                />
                <GlassInput
                  icon="lock-closed-outline"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secure
                  style={{ marginTop: spacing.lg }}
                />
                <GlassInput
                  icon="lock-closed-outline"
                  placeholder="Confirm Password"
                  value={confirm}
                  onChangeText={setConfirm}
                  secure
                  returnKeyType="go"
                  onSubmitEditing={onSignup}
                  style={{ marginTop: spacing.lg }}
                />

                {/* Password rule */}
                <View style={styles.ruleRow}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={isStrong(password) ? '#34D399' : colors.textSecondary}
                  />
                  <Text style={styles.ruleText}>
                    Password must be at least 8 characters and include an uppercase
                    letter, a number, and a symbol.
                  </Text>
                </View>

                {/* CTA */}
                <Pressable
                  disabled={submitting}
                  onPress={onSignup}
                  style={({ pressed }) => [
                    styles.ctaWrap,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] },
                  ]}
                >
                  <LinearGradient
                    colors={CTA_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cta}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.textPrimary} />
                    ) : (
                      <Text style={styles.ctaText}>Sign Up</Text>
                    )}
                  </LinearGradient>
                </Pressable>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social row */}
                <View style={styles.socialRow}>
                  {SOCIALS.map(s => (
                    <Pressable
                      key={s.id}
                      style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}
                    >
                      <BlurView intensity={24} tint="dark" style={styles.social}>
                        <Ionicons name={s.icon} size={18} color={colors.textPrimary} />
                        <Text style={styles.socialText}>{s.label}</Text>
                      </BlurView>
                    </Pressable>
                  ))}
                </View>

                {/* Sign in link */}
                <Pressable
                  style={styles.signinRow}
                  onPress={() => navigation.navigate('Login')}
                  hitSlop={6}
                >
                  <Text style={styles.signinText}>
                    Already have an account?{' '}
                    <Text style={styles.signinLink}>Sign In</Text>
                  </Text>
                </Pressable>

                <Text style={styles.legal}>
                  By signing up, you agree to our{' '}
                  <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.legalLink}>Privacy Policy</Text>.
                </Text>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  topBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  // avatar
  avatarWrap: { alignItems: 'center', marginBottom: spacing.lg },
  avatarHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accentStrong,
    backgroundColor: colors.chipViolet,
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 12,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },

  form: { marginTop: spacing.xxl },

  // password rule
  ruleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingRight: spacing.sm,
  },
  ruleText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  // CTA
  ctaWrap: {
    marginTop: spacing.xl,
    borderRadius: radius.pill,
    shadowColor: colors.accentPink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
  },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },

  // divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  dividerText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },

  // social
  socialRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  social: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    backgroundColor: colors.glassFillSoft,
  },
  socialText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },

  // sign in
  signinRow: { alignItems: 'center', marginTop: spacing.xxl },
  signinText: { color: colors.textSecondary, fontSize: 15 },
  signinLink: { color: colors.accent, fontWeight: '800' },

  legal: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  legalLink: { color: colors.accent, fontWeight: '600' },
});
