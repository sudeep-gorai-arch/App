/**
 * Central design tokens for the WallpaperX glassmorphism theme.
 *
 * The look is built from three layers:
 *   1. A deep, near-black violet base.
 *   2. Vibrant mesh "glow" blobs (magenta -> violet -> blue).
 *   3. Frosted translucent glass surfaces stacked on top.
 *
 * Keeping every colour in one place means screens stay perfectly cohesive
 * and the whole palette can be re-tinted from a single file.
 */

export const colors = {
  // --- Base / backdrop -------------------------------------------------
  base: '#0B0A1F',
  baseDeep: '#070612',
  baseElevated: '#15132E',

  // --- Mesh gradient glow blobs ---------------------------------------
  glowViolet: '#7C3AED',
  glowIndigo: '#4338CA',
  glowBlue: '#2563EB',
  glowMagenta: '#DB2777',
  glowPink: '#EC4899',
  glowOrange: '#F97316',

  // --- Accents ---------------------------------------------------------
  accent: '#A78BFA', // soft violet
  accentStrong: '#8B5CF6',
  accentPink: '#F472B6',
  accentBlue: '#60A5FA',

  // --- Text ------------------------------------------------------------
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.66)',
  textTertiary: 'rgba(255, 255, 255, 0.42)',

  // --- Glass surfaces (semi-transparent rgba) -------------------------
  glassFill: 'rgba(255, 255, 255, 0.07)',
  glassFillStrong: 'rgba(255, 255, 255, 0.12)',
  glassFillSoft: 'rgba(255, 255, 255, 0.045)',
  glassBorder: 'rgba(255, 255, 255, 0.16)',
  glassBorderSoft: 'rgba(255, 255, 255, 0.09)',

  // --- Tints used for icon chips / pills ------------------------------
  chipViolet: 'rgba(139, 92, 246, 0.28)',
  chipPink: 'rgba(236, 72, 153, 0.26)',
  chipBlue: 'rgba(37, 99, 235, 0.26)',

  // --- Misc ------------------------------------------------------------
  divider: 'rgba(255, 255, 255, 0.08)',
  shadow: '#000000',
  heart: '#FB6FA6',
} as const;

/**
 * Reusable, premium-feeling linear-gradient pairs (top-left -> bottom-right).
 * Each is an array of two stops so it drops straight into <LinearGradient>.
 */
export const gradients = {
  violetMagenta: ['#8B5CF6', '#EC4899'],
  blueViolet: ['#3B82F6', '#7C3AED'],
  pinkOrange: ['#F472B6', '#F97316'],
  glassSheen: ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.02)'],
  borderGlow: ['rgba(167,139,250,0.9)', 'rgba(236,72,153,0.7)', 'rgba(96,165,250,0.6)'],
} as const;

export type ColorKey = keyof typeof colors;
export default colors;
