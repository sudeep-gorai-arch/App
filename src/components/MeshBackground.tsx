import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';

type Blob = {
  size: number;
  color: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  opacity?: number;
};

type Props = {
  /** Choose a per-screen colour mood. */
  variant?: 'home' | 'category' | 'profile' | 'about';
};

/**
 * MeshBackground
 *
 * Fakes a "mesh gradient" backdrop the way the mockups look:
 *   - a deep gradient base via expo-linear-gradient
 *   - several oversized, low-opacity colour "blobs" with huge border radii
 *     that bleed into each other to read as soft, glowing light.
 *
 * It fills its parent with StyleSheet.absoluteFill, so just drop it in as the
 * first child of a screen's root View.
 */
const BLOBS: Record<NonNullable<Props['variant']>, Blob[]> = {
  home: [
    { size: 420, color: colors.glowOrange, bottom: -60, right: -120, opacity: 0.32 },
    { size: 360, color: colors.glowMagenta, top: 120, left: -140, opacity: 0.28 },
    { size: 480, color: colors.glowBlue, top: -160, right: -100, opacity: 0.3 },
  ],
  category: [
    { size: 460, color: colors.glowMagenta, top: -120, right: -120, opacity: 0.34 },
    { size: 420, color: colors.glowBlue, bottom: 40, left: -160, opacity: 0.32 },
    { size: 380, color: colors.glowOrange, bottom: -120, right: -80, opacity: 0.3 },
    { size: 320, color: colors.glowViolet, top: 260, left: 40, opacity: 0.22 },
  ],
  profile: [
    { size: 460, color: colors.glowViolet, top: -80, left: -100, opacity: 0.36 },
    { size: 420, color: colors.glowMagenta, top: 220, right: -150, opacity: 0.3 },
    { size: 380, color: colors.glowBlue, bottom: -40, left: -120, opacity: 0.28 },
  ],
  about: [
    { size: 420, color: colors.glowMagenta, top: 220, left: -140, opacity: 0.26 },
    { size: 380, color: colors.glowBlue, top: -120, right: -120, opacity: 0.28 },
    { size: 340, color: colors.glowOrange, bottom: 60, right: -120, opacity: 0.22 },
  ],
};

const MeshBackground: React.FC<Props> = ({ variant = 'home' }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.baseDeep, colors.base, '#120F2E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {BLOBS[variant].map((b, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: b.size,
            height: b.size,
            borderRadius: b.size / 2,
            backgroundColor: b.color,
            opacity: b.opacity ?? 0.3,
            top: b.top,
            bottom: b.bottom,
            left: b.left,
            right: b.right,
          }}
        />
      ))}
      {/* Subtle darkening veil so glass + white text always stay legible. */}
      <View style={[StyleSheet.absoluteFill, styles.veil]} />
    </View>
  );
};

const styles = StyleSheet.create({
  veil: {
    backgroundColor: 'rgba(7, 6, 18, 0.32)',
  },
});

export default MeshBackground;
