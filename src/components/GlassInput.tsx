import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { radius, spacing } from '../utils/constants';

type Props = {
  /** Leading Ionicon shown inside the field. */
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  /** Renders a password field with a show/hide eye toggle. */
  secure?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * GlassInput — a single frosted-glass text field matching the auth mockups.
 *
 * Layers a BlurView + semi-transparent rgba fill + hairline border, with a
 * leading icon and (for passwords) a trailing eye toggle. Used by the Login
 * and Signup screens.
 */
const GlassInput: React.FC<Props> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secure = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType,
  onSubmitEditing,
  style,
}) => {
  const [hidden, setHidden] = useState(secure);

  return (
    <BlurView intensity={26} tint="dark" style={[styles.wrap, style]}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidden}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        selectionColor={colors.accent}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />

      {secure ? (
        <Pressable onPress={() => setHidden(h => !h)} hitSlop={8}>
          <Ionicons
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      ) : null}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 58,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    paddingVertical: 0,
  },
});

export default GlassInput;
