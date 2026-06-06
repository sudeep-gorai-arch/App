import React from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../styles/colors';
import { radius, blur as blurTokens } from '../utils/constants';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Inner padding shorthand. */
  padding?: number;
  /** Corner radius. */
  borderRadius?: number;
  /** Blur strength. */
  intensity?: number;
  /** Use a brighter glass fill for elevated/feature surfaces. */
  strong?: boolean;
  /** Draw a soft violet->pink->blue glowing gradient border. */
  glowBorder?: boolean;
};

/**
 * Card — the core frosted-glass surface used everywhere in the app.
 *
 * It layers, bottom to top:
 *   1. A BlurView (the actual frosted-glass effect).
 *   2. A semi-transparent rgba fill so the glass reads even where blur is weak.
 *   3. A faint top-down sheen for a "lit edge" highlight.
 *   4. An optional gradient glow border (the mockups' glowing card edges).
 *
 * `experimentalBlurMethod` is set on Android so expo-blur actually blurs there.
 */
const Card: React.FC<Props> = ({
  children,
  style,
  padding = 16,
  borderRadius = radius.lg,
  intensity = blurTokens.card,
  strong = false,
  glowBorder = false,
}) => {
  const content = (
    <BlurView
      intensity={intensity}
      tint="dark"
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      style={[
        styles.glass,
        {
          borderRadius,
          backgroundColor: strong ? colors.glassFillStrong : colors.glassFill,
          borderColor: colors.glassBorder,
        },
      ]}
    >
      {/* lit top edge */}
      <LinearGradient
        colors={gradients.glassSheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius, opacity: 0.5 }]}
        pointerEvents="none"
      />
      <View style={{ padding }}>{children}</View>
    </BlurView>
  );

  if (!glowBorder) {
    return <View style={[styles.shadow, style]}>{content}</View>;
  }

  // Gradient border = a gradient layer with a 1.5px inset clipping the glass.
  return (
    <View style={[styles.shadow, style]}>
      <LinearGradient
        colors={gradients.borderGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: borderRadius + 1.5, padding: 1.5 }}
      >
        {content}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  shadow: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
});

export default Card;
