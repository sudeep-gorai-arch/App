import { SharedTransition } from 'react-native-reanimated';

const sanitizeSharedTagPart = (value: unknown) =>
  String(value ?? 'wallpaper')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'wallpaper';

export const getWallpaperSharedTag = (wallpaper?: {
  id?: string | number | null;
  title?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
}) => {
  const stableKey =
    wallpaper?.id ?? wallpaper?.title ?? wallpaper?.imageUrl ?? wallpaper?.thumbnailUrl;

  return `flexiwalls-wallpaper-${sanitizeSharedTagPart(stableKey)}`;
};

export const wallpaperSharedTransition = SharedTransition.duration(560).springify();
