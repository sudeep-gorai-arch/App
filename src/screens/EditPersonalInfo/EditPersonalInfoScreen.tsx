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

type Nav = {
  goBack?: () => void;
};

const AVATAR = 'https://picsum.photos/seed/wx-ethan/400/400';

const CTA = ['#F472B6', '#A855F7', '#3B82F6'] as const;

const InputField = ({
  label,
  icon,
  value,
  onChangeText,
  secure,
  keyboardType = 'default',
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
}) => {
  const [show, setShow] = useState(false);

  return (
    <View style={styles.inputBox}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.field}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !show}
          keyboardType={keyboardType}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
        />

        {secure && (
          <Pressable onPress={() => setShow(!show)}>
            <Ionicons
              name={show ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const EditProfileScreen = ({ navigation }: { navigation?: Nav }) => {
  const [email, setEmail] = useState('ethanhunt@email.com');

  const [oldPass, setOldPass] = useState('');

  const [password, setPassword] = useState('');

  const [confirm, setConfirm] = useState('');

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 40,
            }}
          >
            {/* HEADER */}

            <View style={styles.header}>
              <RoundButton
                icon="chevron-back"
                onPress={() => navigation?.goBack?.()}
              />

              <Text style={styles.headerTitle}>Edit Profile</Text>

              <View style={{ width: 45 }} />
            </View>

            {/* PHOTO */}

            <View style={styles.avatarWrap}>
              <Image source={{ uri: AVATAR }} style={styles.avatar} />

              <Pressable style={styles.camera}>
                <Ionicons name="camera" size={20} color="white" />
              </Pressable>
            </View>

            {/* ACCOUNT */}

            <Card style={styles.card} padding={spacing.lg} strong>
              <View style={styles.section}>
                <LinearGradient
                  colors={gradients.blueViolet}
                  style={styles.sectionIcon}
                >
                  <Ionicons name="person-outline" size={20} color="white" />
                </LinearGradient>

                <Text style={styles.sectionText}>Account Details</Text>
              </View>

              <InputField
                label="Email Address"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </Card>

            {/* PASSWORD */}

            <Card style={styles.card} padding={spacing.lg} strong>
              <View style={styles.section}>
                <LinearGradient
                  colors={gradients.violetMagenta}
                  style={styles.sectionIcon}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="white"
                  />
                </LinearGradient>

                <Text style={styles.sectionText}>Change Password</Text>
              </View>

              <InputField
                label="Previous Password"
                icon="key-outline"
                value={oldPass}
                onChangeText={setOldPass}
                secure
              />

              <InputField
                label="New Password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                secure
              />

              <InputField
                label="Confirm Password"
                icon="checkmark-circle-outline"
                value={confirm}
                onChangeText={setConfirm}
                secure
              />
            </Card>

            {/* SAVE */}

            <Pressable style={styles.save}>
              <LinearGradient colors={CTA} style={styles.saveGradient}>
                <Ionicons name="save-outline" size={20} color="white" />

                <Text style={styles.saveText}>Save Changes</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
  },

  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },

  avatarWrap: {
    alignSelf: 'center',
    marginTop: 20,
  },

  avatar: {
    width: 125,
    height: 125,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: colors.accent,
  },

  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },

  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },

  inputBox: {
    marginTop: 15,
  },

  label: {
    color: colors.textSecondary,
    marginBottom: 6,
  },

  field: {
    height: 55,
    borderRadius: radius.md,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.glassFillSoft,
  },

  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
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
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
});
