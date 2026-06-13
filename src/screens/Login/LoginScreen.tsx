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
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../utils/constants';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { login as loginRequest } from '../../services/authService';
import { useAuth } from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/** Swap to 'WallpaperX' here if you prefer the mockup branding. */
const BRAND = 'VividWalls';

/** Pink -> violet -> blue CTA gradient used across the app's primary buttons. */
const CTA_GRADIENT = ['#EC4899', '#A855F7', '#3B82F6'] as const;

const SOCIALS: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'google', label: 'Google', icon: 'logo-google' },
  { id: 'apple', label: 'Apple', icon: 'logo-apple' },
  { id: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
];

const LoginScreen = ({ navigation }: Props) => {
  const setSession = useAuth(s => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const goHome = () =>
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });

  const onLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);

      const res = await loginRequest({ email: email.trim(), password });
      const { user, token } = res.data;

      // Persist the token so the axios interceptor in services/api.ts picks it up.
      await AsyncStorage.setItem('token', token);

      // Hydrate the zustand auth store.
      setSession(
        {
          id: user.id,
          username: user.username,
          isPremium: false,
        },
        token,
      );

      goHome();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        'Unable to sign in. Please check your details and try again.';
      Alert.alert('Login failed', message);
      console.log('LOGIN ERROR', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
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
              {/* Brand */}
              <View style={styles.brandWrap}>
                <LinearGradient
                  colors={['#6D5BF0', '#C84BD6', '#4F8DF0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logo}
                >
                  <Text style={styles.logoMark}>W</Text>
                </LinearGradient>

                <Text style={styles.brand}>
                  {BRAND.slice(0, -1)}
                  <Text style={styles.brandAccent}>{BRAND.slice(-1)}</Text>
                </Text>
                <Text style={styles.brandTagline}>
                  Stunning wallpapers for every screen
                </Text>
              </View>

              {/* Glass form panel */}
              <BlurView intensity={32} tint="dark" style={styles.panel}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
                  pointerEvents="none"
                />

                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Login to continue your journey</Text>

                <GlassInput
                  icon="person-outline"
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  style={{ marginTop: spacing.xl }}
                />

                <GlassInput
                  icon="lock-closed-outline"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secure
                  returnKeyType="go"
                  onSubmitEditing={onLogin}
                  style={{ marginTop: spacing.lg }}
                />

                <Pressable style={styles.forgot} hitSlop={6}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>

                {/* CTA */}
                <Pressable
                  disabled={submitting}
                  onPress={onLogin}
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
                      <Text style={styles.ctaText}>Login</Text>
                    )}
                  </LinearGradient>
                </Pressable>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
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
              </BlurView>

              {/* Sign up link */}
              <Pressable
                style={styles.footer}
                onPress={() => navigation.navigate('Signup')}
                hitSlop={6}
              >
                <Text style={styles.footerText}>
                  Not a user yet, click here to{' '}
                  <Text style={styles.footerLink}>sign up</Text>
                </Text>
              </Pressable>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },

  // brand
  brandWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 14,
  },
  logoMark: {
    color: colors.textPrimary,
    fontSize: 44,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: spacing.lg,
  },
  brandAccent: { color: colors.accentBlue },
  brandTagline: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: spacing.sm,
  },

  // glass panel
  panel: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  forgot: { alignSelf: 'flex-end', marginTop: spacing.md },
  forgotText: { color: colors.accent, fontSize: 14, fontWeight: '700' },

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

  // footer
  footer: { alignItems: 'center', marginTop: spacing.xxl },
  footerText: { color: colors.textSecondary, fontSize: 15 },
  footerLink: { color: colors.accent, fontWeight: '800' },
});
