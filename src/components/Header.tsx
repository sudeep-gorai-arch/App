import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { spacing } from '../utils/constants';

type RoundAction = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

type Props = {
  /** Small label above the title, e.g. "Good Morning 👋". */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Circular frosted button shown on the right (e.g. search / settings). */
  rightAction?: RoundAction;
  /** Circular frosted button shown on the left (e.g. back). */
  leftAction?: RoundAction;
  style?: StyleProp<ViewStyle>;
};

/** A frosted circular icon button used in headers. */
export const RoundButton: React.FC<RoundAction> = ({ icon, onPress }) => (
  <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
    <BlurView intensity={30} tint="light" style={styles.round}>
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
    </BlurView>
  </Pressable>
);

const Header: React.FC<Props> = ({
  eyebrow,
  title,
  subtitle,
  rightAction,
  leftAction,
  style,
}) => {
  return (
    <View style={[styles.wrap, style]}>
      {(leftAction || rightAction) && (
        <View style={styles.actionRow}>
          {leftAction ? <RoundButton {...leftAction} /> : <View style={styles.round} />}
          {rightAction ? <RoundButton {...rightAction} /> : <View style={styles.round} />}
        </View>
      )}

      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  round: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 6,
  },
});

export default Header;
