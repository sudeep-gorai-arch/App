import { NativeModules, Platform } from 'react-native';

export type WallpaperApplyTarget = 'home' | 'lock' | 'both';

type AndroidWallpaperModuleType = {
  applyWallpaper: (
    imageUrl: string,
    target: WallpaperApplyTarget,
  ) => Promise<boolean>;
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
) => {
  if (Platform.OS !== 'android') {
    throw new Error('Apply wallpaper is only available on Android.');
  }

  if (!imageUrl || !String(imageUrl).trim()) {
    throw new Error('Wallpaper image URL is missing.');
  }

  const AndroidWallpaperModule = getAndroidWallpaperModule();

  return AndroidWallpaperModule.applyWallpaper(imageUrl, target);
};