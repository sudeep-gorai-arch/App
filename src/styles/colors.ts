export const colors = {
  // --- Base / backdrop -------------------------------------------------
  base: '#000000',
  baseDeep: '#000000',
  baseElevated: '#000000',

  // --- Mesh gradient glow blobs ---------------------------------------
  glowViolet: '#000000',
  glowIndigo: '#000000',
  glowBlue: '#000000',
  glowMagenta: '#000000',
  glowPink: '#000000',
  glowOrange: '#000000',

  // --- Accents ---------------------------------------------------------
  accent: '#A78BFA',
  accentStrong: '#8B5CF6',
  accentPink: '#F472B6',
  accentBlue: '#60A5FA',

  // --- Text ------------------------------------------------------------
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.66)',
  textTertiary: 'rgba(255, 255, 255, 0.42)',

  // --- Glass surfaces --------------------------------------------------
  glassFill: 'rgba(255, 255, 255, 0.07)',
  glassFillStrong: 'rgba(255, 255, 255, 0.12)',
  glassFillSoft: 'rgba(255, 255, 255, 0.045)',
  glassBorder: 'rgba(255, 255, 255, 0.16)',
  glassBorderSoft: 'rgba(255, 255, 255, 0.09)',

  // --- Tints -----------------------------------------------------------
  chipViolet: 'rgba(139, 92, 246, 0.28)',
  chipPink: 'rgba(236, 72, 153, 0.26)',
  chipBlue: 'rgba(37, 99, 235, 0.26)',

  // --- Misc ------------------------------------------------------------
  divider: 'rgba(255, 255, 255, 0.08)',
  shadow: '#000000',
  heart: '#FB6FA6',
} as const;

export const gradients = {
  violetMagenta: ['#8B5CF6', '#EC4899'],
  blueViolet: ['#3B82F6', '#7C3AED'],
  pinkOrange: ['#F472B6', '#F97316'],
  glassSheen: ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.02)'],
  borderGlow: [
    'rgba(167,139,250,0.9)',
    'rgba(236,72,153,0.7)',
    'rgba(96,165,250,0.6)',
  ],
} as const;

export type ColorKey = keyof typeof colors;
export default colors;