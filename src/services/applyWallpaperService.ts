import { NativeModules, Platform } from 'react-native';

export type WallpaperApplyTarget = 'home' | 'lock' | 'both';

export type WallpaperMediaType = 'IMAGE' | 'VIDEO';

export type WallpaperCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VideoWallpaperCropConfig = {
  scale: number;
  translateX: number;
  translateY: number;

  previewWidth: number;
  previewHeight: number;

  videoWidth: number;
  videoHeight: number;

  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
};

export type ApplyWallpaperOptions = {
  mediaType?: WallpaperMediaType | string;
  isVideo?: boolean;
  title?: string;
  videoCropConfig?: VideoWallpaperCropConfig | null;
};

type AndroidWallpaperModuleType = {
  applyWallpaper: (
    imageUrl: string,
    target: WallpaperApplyTarget,
    cropRect?: WallpaperCropRect | null,
  ) => Promise<boolean>;

  applyVideoWallpaper?: (
    videoUrl: string,
    target: WallpaperApplyTarget,
    title?: string | null,
    cropConfig?: VideoWallpaperCropConfig | null,
  ) => Promise<boolean>;
};

const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

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

const sanitizeVideoCropConfig = (
  cropConfig?: VideoWallpaperCropConfig | null,
): VideoWallpaperCropConfig | null => {
  if (!cropConfig) return null;

  const scale = Number(cropConfig.scale || 1);
  const translateX = Number(cropConfig.translateX || 0);
  const translateY = Number(cropConfig.translateY || 0);

  const previewWidth = Number(cropConfig.previewWidth || 0);
  const previewHeight = Number(cropConfig.previewHeight || 0);

  const videoWidth = Number(cropConfig.videoWidth || 0);
  const videoHeight = Number(cropConfig.videoHeight || 0);

  const cropX = Number(cropConfig.cropX || 0);
  const cropY = Number(cropConfig.cropY || 0);
  const cropWidth = Number(cropConfig.cropWidth || 0);
  const cropHeight = Number(cropConfig.cropHeight || 0);

  if (
    !Number.isFinite(scale) ||
    !Number.isFinite(translateX) ||
    !Number.isFinite(translateY) ||
    !Number.isFinite(previewWidth) ||
    !Number.isFinite(previewHeight) ||
    !Number.isFinite(videoWidth) ||
    !Number.isFinite(videoHeight) ||
    previewWidth <= 0 ||
    previewHeight <= 0 ||
    videoWidth <= 0 ||
    videoHeight <= 0
  ) {
    return null;
  }

  return {
    scale: Math.max(1, scale),
    translateX,
    translateY,

    previewWidth,
    previewHeight,

    videoWidth,
    videoHeight,

    cropX: Number.isFinite(cropX) ? Math.max(0, cropX) : 0,
    cropY: Number.isFinite(cropY) ? Math.max(0, cropY) : 0,
    cropWidth: Number.isFinite(cropWidth) ? Math.max(1, cropWidth) : 1,
    cropHeight: Number.isFinite(cropHeight) ? Math.max(1, cropHeight) : 1,
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

export const isVideoWallpaperMedia = (
  mediaUrl?: string | null,
  options?: ApplyWallpaperOptions,
) => {
  const mediaType = String(options?.mediaType || '').trim().toUpperCase();

  if (mediaType === 'VIDEO') {
    return true;
  }

  if (options?.isVideo) {
    return true;
  }

  return VIDEO_EXTENSION_PATTERN.test(String(mediaUrl || '').trim());
};

export const applyWallpaperToAndroid = async (
  mediaUrl: string,
  target: WallpaperApplyTarget,
  cropRect?: WallpaperCropRect | null,
  options?: ApplyWallpaperOptions,
) => {
  if (Platform.OS !== 'android') {
    throw new Error('Apply wallpaper is only available on Android.');
  }

  if (!mediaUrl || !String(mediaUrl).trim()) {
    throw new Error('Wallpaper URL is missing.');
  }

  if (isVideoWallpaperMedia(mediaUrl, options)) {
    return applyVideoWallpaperToAndroid(
      String(mediaUrl).trim(),
      target,
      options?.title,
      options?.videoCropConfig,
    );
  }

  const AndroidWallpaperModule = getAndroidWallpaperModule();

  return AndroidWallpaperModule.applyWallpaper(
    String(mediaUrl).trim(),
    target,
    sanitizeCropRect(cropRect),
  );
};

export const applyVideoWallpaperToAndroid = async (
  videoUrl: string,
  target: WallpaperApplyTarget = 'home',
  title?: string | null,
  cropConfig?: VideoWallpaperCropConfig | null,
) => {
  if (Platform.OS !== 'android') {
    throw new Error('Video wallpaper apply is only available on Android.');
  }

  if (!videoUrl || !String(videoUrl).trim()) {
    throw new Error('Video wallpaper URL is missing.');
  }

  const AndroidWallpaperModule = getAndroidWallpaperModule();

  if (!AndroidWallpaperModule.applyVideoWallpaper) {
    throw new Error(
      'Native video wallpaper method is not available. Rebuild the Android app.',
    );
  }

  return AndroidWallpaperModule.applyVideoWallpaper(
    String(videoUrl).trim(),
    target,
    title || 'FlexiWalls Video Wallpaper',
    sanitizeVideoCropConfig(cropConfig),
  );
};