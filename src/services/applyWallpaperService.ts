import { NativeModules, Platform } from 'react-native';

export type WallpaperApplyTarget = 'home' | 'lock' | 'both';

export type WallpaperCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AndroidWallpaperModuleType = {
  applyWallpaper: (
    imageUrl: string,
    target: WallpaperApplyTarget,
    cropRect?: WallpaperCropRect | null,
  ) => Promise<boolean>;
};

const sanitizeCropRect = (
  cropRect?: WallpaperCropRect | null,
): WallpaperCropRect | null => {
  if (!cropRect) return null;

  const x = Math.max(0, Math.round(Number(cropRect.x || 0)));
  const y = Math.max(0, Math.round(Number(cropRect.y || 0)));
  const width = Math.max(1, Math.round(Number(cropRect.width || 0)));
  const height = Math.max(1, Math.round(Number(cropRect.height || 0)));

  return {
    x,
    y,
    width,
    height,
  };
};

const getAndroidWallpaperModule = (): AndroidWallpaperModuleType => {
  const module = NativeModules.AndroidWallpaperModule as
    | AndroidWallpaperModuleType
    | undefined;

  if (!module) {
    console.log(
      'Available native modules:',
      Object.keys(NativeModules).sort(),
    );

    throw new Error(
      'AndroidWallpaperModule native module is not available. Rebuild the Android app.',
    );
  }

  return module;
};

export const applyWallpaperToAndroid = async (
  imageUrl: string,
  target: WallpaperApplyTarget,
  cropRect?: WallpaperCropRect | null,
) => {
  if (Platform.OS !== 'android') {
    throw new Error('Apply wallpaper is only available on Android.');
  }

  if (!imageUrl || !String(imageUrl).trim()) {
    throw new Error('Wallpaper image URL is missing.');
  }

  const AndroidWallpaperModule = getAndroidWallpaperModule();

  return AndroidWallpaperModule.applyWallpaper(
    String(imageUrl).trim(),
    target,
    sanitizeCropRect(cropRect),
  );
};