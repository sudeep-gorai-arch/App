import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../styles/colors';
import { radius } from '../utils/constants';

type Variant = 'glass' | 'gradient';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  /** Optional leading icon. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional trailing icon (e.g. arrow-forward). */
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  /** Tint the leading icon (used for the pink heart on "Made with passion"). */
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
};

/**
 * Button — two looks:
 *   - "glass": frosted translucent pill (the mockups' "Explore" / "Made with
 *     passion" buttons).
 *   - "gradient": solid violet->pink gradient pill for primary CTAs.
 */
const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = 'glass',
  icon,
  trailingIcon,
  iconColor,
  style,
  full = false,
}) => {
  const inner = (
    <View style={styles.row}>
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={iconColor ?? colors.textPrimary}
          style={styles.leading}
        />
      ) : null}
      <Text style={styles.label}>{label}</Text>
      {trailingIcon ? (
        <Ionicons name={trailingIcon} size={18} color={colors.textPrimary} style={styles.trailing} />
      ) : null}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        full && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {variant === 'gradient' ? (
        <LinearGradient
          colors={gradients.violetMagenta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pill}
        >
          {inner}
        </LinearGradient>
      ) : (
        <BlurView intensity={28} tint="light" style={[styles.pill, styles.glassPill]}>
          {inner}
        </BlurView>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  glassPill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  leading: { marginRight: 8 },
  trailing: { marginLeft: 8 },
});

export default Button;
