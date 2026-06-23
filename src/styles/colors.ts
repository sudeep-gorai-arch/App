const APP_BACKGROUND = '#0F0F10';

export const colors = {
  base: APP_BACKGROUND,
  baseDeep: APP_BACKGROUND,
  baseElevated: APP_BACKGROUND,

  glowViolet: '#7C3AED',
  glowIndigo: '#4338CA',
  glowBlue: '#2563EB',
  glowMagenta: '#DB2777',
  glowPink: '#EC4899',
  glowOrange: '#F97316',

  accent: '#A78BFA',
  accentStrong: '#8B5CF6',
  accentPink: '#F472B6',
  accentBlue: '#60A5FA',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.66)',
  textTertiary: 'rgba(255, 255, 255, 0.42)',

  glassFill: 'rgba(255, 255, 255, 0.07)',
  glassFillStrong: 'rgba(255, 255, 255, 0.12)',
  glassFillSoft: 'rgba(255, 255, 255, 0.045)',
  glassBorder: 'rgba(255, 255, 255, 0.16)',
  glassBorderSoft: 'rgba(255, 255, 255, 0.09)',

  chipViolet: 'rgba(139, 92, 246, 0.28)',
  chipPink: 'rgba(236, 72, 153, 0.26)',
  chipBlue: 'rgba(37, 99, 235, 0.26)',

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