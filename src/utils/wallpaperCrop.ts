export type WallpaperCropTarget = 'home' | 'lock' | 'both';

export type WallpaperPreviewMode = 'home' | 'lock';

export type WallpaperCropSize = {
  width: number;
  height: number;
};

export type WallpaperCropTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

export type WallpaperCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WallpaperCropResult = {
  imageUrl: string;
  target: WallpaperCropTarget;
  cropRect: WallpaperCropRect;
  imageSize: WallpaperCropSize;
  frameSize: WallpaperCropSize;
};

export const WALLPAPER_CROP_MIN_SCALE = 1;
export const WALLPAPER_CROP_MAX_SCALE = 8;

export const WALLPAPER_PHONE_ASPECT_WIDTH = 9;
export const WALLPAPER_PHONE_ASPECT_HEIGHT = 19.5;
export const WALLPAPER_PHONE_ASPECT_RATIO =
  WALLPAPER_PHONE_ASPECT_HEIGHT / WALLPAPER_PHONE_ASPECT_WIDTH;

export const makeInitialCropTransform = (): WallpaperCropTransform => ({
  scale: 1,
  translateX: 0,
  translateY: 0,
});

export const clamp = (value: number, min: number, max: number) => {
  'worklet';

  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
};

export const isValidSize = (size?: Partial<WallpaperCropSize> | null) => {
  return !!size && Number(size.width) > 0 && Number(size.height) > 0;
};

export const getCoverLayout = (
  imageSize: WallpaperCropSize,
  frameSize: WallpaperCropSize,
) => {
  const imageWidth = Math.max(1, imageSize.width);
  const imageHeight = Math.max(1, imageSize.height);
  const frameWidth = Math.max(1, frameSize.width);
  const frameHeight = Math.max(1, frameSize.height);

  const coverScale = Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
  const displayWidth = imageWidth * coverScale;
  const displayHeight = imageHeight * coverScale;

  return {
    coverScale,
    displayWidth,
    displayHeight,
    offsetX: (frameWidth - displayWidth) / 2,
    offsetY: (frameHeight - displayHeight) / 2,
  };
};

export const boundCropTransform = ({
  transform,
  imageSize,
  frameSize,
}: {
  transform: WallpaperCropTransform;
  imageSize: WallpaperCropSize;
  frameSize: WallpaperCropSize;
}): WallpaperCropTransform => {
  const layout = getCoverLayout(imageSize, frameSize);

  const scale = clamp(
    transform.scale,
    WALLPAPER_CROP_MIN_SCALE,
    WALLPAPER_CROP_MAX_SCALE,
  );

  const scaledWidth = layout.displayWidth * scale;
  const scaledHeight = layout.displayHeight * scale;

  const maxTranslateX = Math.max(0, (scaledWidth - frameSize.width) / 2);
  const maxTranslateY = Math.max(0, (scaledHeight - frameSize.height) / 2);

  return {
    scale,
    translateX: clamp(transform.translateX, -maxTranslateX, maxTranslateX),
    translateY: clamp(transform.translateY, -maxTranslateY, maxTranslateY),
  };
};

export const calculateCropRect = ({
  transform,
  imageSize,
  frameSize,
}: {
  transform: WallpaperCropTransform;
  imageSize: WallpaperCropSize;
  frameSize: WallpaperCropSize;
}): WallpaperCropRect => {
  if (!isValidSize(imageSize) || !isValidSize(frameSize)) {
    return {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    };
  }

  const bounded = boundCropTransform({
    transform,
    imageSize,
    frameSize,
  });

  const layout = getCoverLayout(imageSize, frameSize);

  const totalScale = layout.coverScale * bounded.scale;

  const visibleWidthInSource = frameSize.width / totalScale;
  const visibleHeightInSource = frameSize.height / totalScale;

  const scaledImageWidth = imageSize.width * totalScale;
  const scaledImageHeight = imageSize.height * totalScale;

  const imageLeftInFrame =
    frameSize.width / 2 - scaledImageWidth / 2 + bounded.translateX;

  const imageTopInFrame =
    frameSize.height / 2 - scaledImageHeight / 2 + bounded.translateY;

  const rawX = -imageLeftInFrame / totalScale;
  const rawY = -imageTopInFrame / totalScale;

  const x = clamp(Math.round(rawX), 0, Math.max(0, imageSize.width - 1));
  const y = clamp(Math.round(rawY), 0, Math.max(0, imageSize.height - 1));

  const width = clamp(
    Math.round(visibleWidthInSource),
    1,
    Math.max(1, imageSize.width - x),
  );

  const height = clamp(
    Math.round(visibleHeightInSource),
    1,
    Math.max(1, imageSize.height - y),
  );

  return {
    x,
    y,
    width,
    height,
  };
};

export const getPreviewModesForTarget = (
  target: WallpaperCropTarget,
): WallpaperPreviewMode[] => {
  if (target === 'both') return ['home', 'lock'];
  return [target];
};

export const getWallpaperTargetLabel = (target: WallpaperCropTarget) => {
  if (target === 'home') return 'Home screen';
  if (target === 'lock') return 'Lock screen';
  return 'Home & Lock screen';
};

export const getPreviewModeLabel = (mode: WallpaperPreviewMode) => {
  if (mode === 'home') return 'Home screen';
  return 'Lock screen';
};