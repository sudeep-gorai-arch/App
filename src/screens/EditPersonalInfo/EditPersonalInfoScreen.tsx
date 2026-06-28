import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';

import { useAuth } from '../../context/AuthContext';
import { colors, gradients } from '../../styles/colors';
import { radius, spacing } from '../../utils/constants';

type Nav = {
  goBack?: () => void;
};

type StoredPersonalInfo = {
  nickName: string;
  avatarUrl: string | null;
};

const STORAGE_KEY = 'flexiwalls.personalInfo';

const CTA = ['#F472B6', '#A855F7', '#3B82F6'] as const;

const isValidRemoteImage = (value: string) => {
  if (!value.trim()) return true;

  return /^https?:\/\/.+/i.test(value.trim());
};

const DetailRow = ({
  icon,
  title,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Ionicons name={icon} size={18} color={colors.accent} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={styles.detailTitle}>{title}</Text>
      <Text numberOfLines={1} style={styles.detailValue}>
        {value}
      </Text>
    </View>
  </View>
);

const InputField = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  maxLength,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'url';
  maxLength?: number;
}) => (
  <View style={styles.inputBox}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>

      {!!maxLength && (
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>

    <View style={[styles.field, multiline && styles.fieldLarge]}>
      <Ionicons
        name={icon}
        size={20}
        color={colors.textSecondary}
        style={multiline ? styles.multilineIcon : undefined}
      />

      <TextInput
        style={[styles.input, multiline && styles.inputLarge]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  </View>
);

const EditPersonalInfoScreen = ({ navigation }: { navigation?: Nav }) => {
  const { user } = useAuth();

  const [nickName, setNickName] = useState(user?.username ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const fallbackAvatar = useMemo(() => {
    const seed = user?.username || user?.email || 'FlexiWalls User';

    return `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(
      seed,
    )}`;
  }, [user?.email, user?.username]);

  const previewAvatar = avatarUrl.trim() || user?.avatarUrl || fallbackAvatar;

  useEffect(() => {
    let mounted = true;

    const loadPersonalInfo = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (!stored || !mounted) return;

        const parsed = JSON.parse(stored) as StoredPersonalInfo;

        setNickName(parsed.nickName || user?.username || '');
        setAvatarUrl(parsed.avatarUrl || user?.avatarUrl || '');
      } catch (error) {
        console.log('LOAD PERSONAL INFO ERROR', error);
      }
    };

    loadPersonalInfo();

    return () => {
      mounted = false;
    };
  }, [user?.avatarUrl, user?.username]);

  const restoreDefaultPhoto = () => {
    setAvatarUrl(user?.avatarUrl ?? '');
  };

  const removePhoto = () => {
    setAvatarUrl('');
  };

  const saveChanges = async () => {
    const cleanNickName = nickName.trim();
    const cleanAvatarUrl = avatarUrl.trim();

    if (cleanNickName.length < 2) {
      Alert.alert('Nick name required', 'Please enter at least 2 characters.');
      return;
    }

    if (!isValidRemoteImage(cleanAvatarUrl)) {
      Alert.alert(
        'Invalid image link',
        'Please paste a valid image URL starting with http:// or https://.',
      );
      return;
    }

    try {
      setSaving(true);

      const payload: StoredPersonalInfo = {
        nickName: cleanNickName,
        avatarUrl: cleanAvatarUrl || null,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      Alert.alert('Saved', 'Your personal info has been updated.', [
        {
          text: 'Done',
          onPress: () => navigation?.goBack?.(),
        },
      ]);
    } catch (error) {
      console.log('SAVE PERSONAL INFO ERROR', error);
      Alert.alert('Save failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* ================= HEADER ================= */}

            <View style={styles.header}>
              <RoundButton
                icon="chevron-back"
                onPress={() => navigation?.goBack?.()}
              />

              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Personal Info</Text>
                <Text style={styles.headerSubtitle}>Edit your profile look</Text>
              </View>

              <Pressable
                hitSlop={8}
                disabled={saving}
                onPress={saveChanges}
                style={({ pressed }) => [
                  styles.headerSave,
                  pressed && !saving && styles.pressed,
                ]}
              >
                <Ionicons
                  name={saving ? 'hourglass-outline' : 'checkmark'}
                  size={22}
                  color="#fff"
                />
              </Pressable>
            </View>

            {/* ================= AVATAR HERO ================= */}

            <Card
              style={styles.heroCard}
              padding={0}
              borderRadius={32}
              strong
              glowBorder
            >
              <View style={styles.heroInner}>
                <View style={styles.avatarStage}>
                  <LinearGradient
                    colors={gradients.borderGlow}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarRing}
                  >
                    <Image source={{ uri: previewAvatar }} style={styles.avatar} />
                  </LinearGradient>

                  <Pressable
                    style={styles.cameraButton}
                    onPress={() => setShowImageEditor(value => !value)}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                  </Pressable>
                </View>

                <View style={styles.heroTextWrap}>
                  <Text style={styles.heroTitle}>{nickName || 'Your Nick Name'}</Text>

                  <Text numberOfLines={1} style={styles.heroSubtitle}>
                    {user?.email || 'flexiwalls user'}
                  </Text>

                  <Pressable
                    style={styles.changePhotoBtn}
                    onPress={() => setShowImageEditor(value => !value)}
                  >
                    <Ionicons name="image-outline" size={17} color="#fff" />
                    <Text style={styles.changePhotoText}>
                      {showImageEditor ? 'Hide image editor' : 'Change photo'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Card>

            {/* ================= IMAGE EDITOR ================= */}

            {showImageEditor && (
              <Card style={styles.card} padding={spacing.lg} strong>
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={gradients.blueViolet}
                    style={styles.sectionIcon}
                  >
                    <Ionicons name="image-outline" size={20} color="#fff" />
                  </LinearGradient>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Profile Image</Text>
                    <Text style={styles.sectionSubtitle}>
                      Paste an online image link for your avatar.
                    </Text>
                  </View>
                </View>

                <InputField
                  label="Image URL"
                  icon="link-outline"
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                  placeholder="https://example.com/avatar.jpg"
                  keyboardType="url"
                  autoCapitalize="none"
                  multiline
                />

                <View style={styles.imageActions}>
                  <Pressable style={styles.secondaryBtn} onPress={restoreDefaultPhoto}>
                    <Ionicons
                      name="refresh-outline"
                      size={18}
                      color={colors.textPrimary}
                    />
                    <Text style={styles.secondaryText}>Restore</Text>
                  </Pressable>

                  <Pressable style={styles.secondaryBtn} onPress={removePhoto}>
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.textPrimary}
                    />
                    <Text style={styles.secondaryText}>Remove</Text>
                  </Pressable>
                </View>
              </Card>
            )}

            {/* ================= NICK NAME ================= */}

            <Card style={styles.card} padding={spacing.lg} strong>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={gradients.violetMagenta}
                  style={styles.sectionIcon}
                >
                  <Ionicons name="person-outline" size={20} color="#fff" />
                </LinearGradient>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Public Profile</Text>
                  <Text style={styles.sectionSubtitle}>
                    This name will be shown on your profile.
                  </Text>
                </View>
              </View>

              <InputField
                label="Nick Name"
                icon="sparkles-outline"
                value={nickName}
                onChangeText={setNickName}
                placeholder="Enter your nick name"
                maxLength={24}
              />

              <View style={styles.tipBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.accent}
                />
                <Text style={styles.tipText}>
                  Keep it short and premium. Example: Sudeep, WallMaster, AnimeFan.
                </Text>
              </View>
            </Card>

            {/* ================= ACCOUNT INFO ================= */}

            <Card style={styles.card} padding={spacing.lg} strong>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={gradients.pinkOrange}
                  style={styles.sectionIcon}
                >
                  <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                </LinearGradient>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Account</Text>
                  <Text style={styles.sectionSubtitle}>
                    Login details are kept read-only here.
                  </Text>
                </View>
              </View>

              <DetailRow
                icon="mail-outline"
                title="Email Address"
                value={user?.email || 'Not signed in'}
              />

              <DetailRow
                icon="person-circle-outline"
                title="Original Username"
                value={user?.username || 'Guest'}
              />
            </Card>

            {/* ================= SAVE ================= */}

            <Pressable
              disabled={saving}
              onPress={saveChanges}
              style={({ pressed }) => [
                styles.save,
                pressed && !saving && styles.pressed,
                saving && styles.disabled,
              ]}
            >
              <LinearGradient colors={CTA} style={styles.saveGradient}>
                <Ionicons
                  name={saving ? 'hourglass-outline' : 'save-outline'}
                  size={20}
                  color="#fff"
                />

                <Text style={styles.saveText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default EditPersonalInfoScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  safeArea: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 44,
  },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
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
    fontSize: 13,
    fontWeight: '600',
  },

  headerSave: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },

  heroCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },

  heroInner: {
    padding: 22,
    alignItems: 'center',
  },

  avatarStage: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarRing: {
    width: 138,
    height: 138,
    borderRadius: 69,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 66,
    backgroundColor: '#202024',
    borderWidth: 4,
    borderColor: colors.base,
  },

  cameraButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentStrong,
    borderWidth: 3,
    borderColor: colors.base,
  },

  heroTextWrap: {
    marginTop: 14,
    alignItems: 'center',
  },

  heroTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  heroSubtitle: {
    marginTop: 7,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 260,
  },

  changePhotoBtn: {
    marginTop: 18,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },

  changePhotoText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },

  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
  },

  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },

  sectionSubtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },

  inputBox: {
    marginTop: spacing.md,
  },

  labelRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },

  counter: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
  },

  field: {
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  fieldLarge: {
    minHeight: 98,
    alignItems: 'flex-start',
    paddingTop: 16,
  },

  multilineIcon: {
    marginTop: 2,
  },

  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
  },

  inputLarge: {
    minHeight: 68,
    textAlignVertical: 'top',
  },

  imageActions: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: 12,
  },

  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  secondaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },

  tipBox: {
    marginTop: spacing.lg,
    padding: 14,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(167,139,250,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(167,139,250,0.22)',
  },

  tipText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  detailRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },

  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  detailTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  detailValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },

  save: {
    marginHorizontal: spacing.xl,
    marginTop: 30,
  },

  saveGradient: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },

  saveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.65,
  },
});
