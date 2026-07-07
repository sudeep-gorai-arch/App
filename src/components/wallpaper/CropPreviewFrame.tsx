import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Image,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';

import { SCREEN } from '../../utils/constants';
import HomeScreenPreview from './HomeScreenPreview';
import LockScreenPreview from './LockScreenPreview';
import {
  WALLPAPER_PHONE_ASPECT_RATIO,
  boundCropTransform,
  calculateCropRect,
  getCoverLayout,
  isValidSize,
  makeInitialCropTransform,
  WallpaperCropRect,
  WallpaperCropSize,
  WallpaperCropTransform,
  WallpaperPreviewMode,
} from '../../utils/wallpaperCrop';

export type CropPreviewMediaType = 'IMAGE' | 'VIDEO';

export type CropPreviewFrameValue = {
  mode: WallpaperPreviewMode;
  imageUrl: string;
  videoUrl?: string;
  mediaType: CropPreviewMediaType;
  isVideo: boolean;
  cropRect: WallpaperCropRect;
  imageSize: WallpaperCropSize;
  frameSize: WallpaperCropSize;
  transform: WallpaperCropTransform;
};

type Props = {
  imageUrl: string;
  videoUrl?: string;
  mediaType?: CropPreviewMediaType | string;
  isVideo?: boolean;
  mode: WallpaperPreviewMode;
  active?: boolean;
  frameWidth?: number;
  frameHeight?: number;
  sourceWidth?: number | null;
  sourceHeight?: number | null;
  onCropChange?: (value: CropPreviewFrameValue) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
};

const DEFAULT_FRAME_WIDTH = Math.min(SCREEN.width - 52, 350);
const DEFAULT_FRAME_HEIGHT = Math.round(
  DEFAULT_FRAME_WIDTH * WALLPAPER_PHONE_ASPECT_RATIO,
);

const DEFAULT_SOURCE_SIZE = {
  width: 1080,
  height: 1920,
};

const areSizesEqual = (a: WallpaperCropSize, b: WallpaperCropSize) => {
  return (
    Math.round(a.width) === Math.round(b.width) &&
    Math.round(a.height) === Math.round(b.height)
  );
};

const areTransformsEqual = (
  a: WallpaperCropTransform,
  b: WallpaperCropTransform,
) => {
  return (
    Math.abs(a.scale - b.scale) < 0.001 &&
    Math.abs(a.translateX - b.translateX) < 0.5 &&
    Math.abs(a.translateY - b.translateY) < 0.5
  );
};

const areCropRectsEqual = (a?: WallpaperCropRect, b?: WallpaperCropRect) => {
  if (!a || !b) return false;

  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
};

const getTouchDistance = (event: GestureResponderEvent) => {
  const touches = event.nativeEvent.touches;

  if (!touches || touches.length < 2) return 0;

  const first = touches[0];
  const second = touches[1];

  const dx = first.pageX - second.pageX;
  const dy = first.pageY - second.pageY;

  return Math.sqrt(dx * dx + dy * dy);
};

const toPositiveNumber = (value?: number | null) => {
  if (typeof value !== 'number') return undefined;
  if (!Number.isFinite(value) || value <= 0) return undefined;

  return value;
};

const getInitialSourceSize = ({
  sourceWidth,
  sourceHeight,
}: {
  sourceWidth?: number | null;
  sourceHeight?: number | null;
}): WallpaperCropSize => {
  const width = toPositiveNumber(sourceWidth);
  const height = toPositiveNumber(sourceHeight);

  if (width && height) {
    return {
      width,
      height,
    };
  }

  return DEFAULT_SOURCE_SIZE;
};

const CropGrid = () => {
  return (
    <View pointerEvents="none" style={styles.fill}>
      <View style={[styles.gridLineVertical, { left: '33.333%' }]} />
      <View style={[styles.gridLineVertical, { left: '66.666%' }]} />
      <View style={[styles.gridLineHorizontal, { top: '33.333%' }]} />
      <View style={[styles.gridLineHorizontal, { top: '66.666%' }]} />
    </View>
  );
};

const CropPreviewOverlay = ({ mode }: { mode: WallpaperPreviewMode }) => {
  if (mode === 'home') {
    return <HomeScreenPreview />;
  }

  return <LockScreenPreview />;
};

type VideoCropLayerProps = {
  videoUrl: string;
  posterUrl: string;
};

const VideoCropLayer = ({ videoUrl, posterUrl }: VideoCropLayerProps) => {
  const player = useVideoPlayer(videoUrl, videoPlayer => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    try {
      player.loop = true;
      player.muted = true;
      player.play();
    } catch (error) {
      console.log('Crop preview video play failed:', error);
    }
  }, [player, videoUrl]);

  return (
    <View style={styles.videoLayer}>
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          resizeMode="stretch"
          style={styles.image}
        />
      ) : null}

      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        nativeControls={false}
      />
    </View>
  );
};

const CropPreviewFrame = ({
  imageUrl,
  videoUrl,
  mediaType,
  isVideo: rawIsVideo,
  mode,
  active = true,
  frameWidth = DEFAULT_FRAME_WIDTH,
  frameHeight = DEFAULT_FRAME_HEIGHT,
  sourceWidth,
  sourceHeight,
  onCropChange,
  onInteractionStart,
  onInteractionEnd,
}: Props) => {
  const normalizedMediaType = String(mediaType || '').toUpperCase();

  const isVideo =
    rawIsVideo === true || normalizedMediaType === 'VIDEO' || !!videoUrl;

  const cropMediaType: CropPreviewMediaType = isVideo ? 'VIDEO' : 'IMAGE';
  const mediaUrl = isVideo ? videoUrl || imageUrl : imageUrl;

  const onCropChangeRef = useRef<Props['onCropChange']>(onCropChange);
  const lastCropRectRef = useRef<WallpaperCropRect | undefined>(undefined);

  const [imageSize, setImageSize] = useState<WallpaperCropSize>(
    getInitialSourceSize({
      sourceWidth,
      sourceHeight,
    }),
  );

  const [frameSize, setFrameSize] = useState<WallpaperCropSize>({
    width: frameWidth,
    height: frameHeight,
  });

  const [transform, setTransform] = useState<WallpaperCropTransform>(
    makeInitialCropTransform,
  );

  const transformRef = useRef(transform);
  const imageSizeRef = useRef(imageSize);
  const frameSizeRef = useRef(frameSize);
  const startTransformRef = useRef<WallpaperCropTransform>(transform);
  const pinchStartDistanceRef = useRef(0);
  const lastTouchCountRef = useRef(0);

  useEffect(() => {
    onCropChangeRef.current = onCropChange;
  }, [onCropChange]);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    imageSizeRef.current = imageSize;
  }, [imageSize]);

  useEffect(() => {
    frameSizeRef.current = frameSize;
  }, [frameSize]);

  const emitCropChange = useCallback(
    (nextTransform: WallpaperCropTransform, force = false) => {
      const currentImageSize = imageSizeRef.current;
      const currentFrameSize = frameSizeRef.current;

      if (!isValidSize(currentImageSize) || !isValidSize(currentFrameSize)) {
        return;
      }

      const cropRect = calculateCropRect({
        transform: nextTransform,
        imageSize: currentImageSize,
        frameSize: currentFrameSize,
      });

      if (!force && areCropRectsEqual(lastCropRectRef.current, cropRect)) {
        return;
      }

      lastCropRectRef.current = cropRect;

      onCropChangeRef.current?.({
        mode,
        imageUrl,
        videoUrl,
        mediaType: cropMediaType,
        isVideo,
        cropRect,
        imageSize: currentImageSize,
        frameSize: currentFrameSize,
        transform: nextTransform,
      });
    },
    [cropMediaType, imageUrl, isVideo, mode, videoUrl],
  );

  const updateTransform = useCallback(
    (nextTransform: WallpaperCropTransform, shouldEmitCrop = false) => {
      const bounded = boundCropTransform({
        transform: nextTransform,
        imageSize: imageSizeRef.current,
        frameSize: frameSizeRef.current,
      });

      if (areTransformsEqual(transformRef.current, bounded)) {
        if (shouldEmitCrop) {
          emitCropChange(bounded, true);
        }

        return;
      }

      transformRef.current = bounded;
      setTransform(bounded);

      if (shouldEmitCrop) {
        emitCropChange(bounded, true);
      }
    },
    [emitCropChange],
  );

  useEffect(() => {
    const initialTransform = makeInitialCropTransform();

    transformRef.current = initialTransform;
    lastCropRectRef.current = undefined;
    setTransform(initialTransform);

    requestAnimationFrame(() => {
      emitCropChange(initialTransform, true);
    });
  }, [emitCropChange, imageUrl, mode, videoUrl]);

  useEffect(() => {
    if (isVideo) {
      const nextSize = getInitialSourceSize({
        sourceWidth,
        sourceHeight,
      });

      setImageSize(prev => {
        if (areSizesEqual(prev, nextSize)) return prev;
        return nextSize;
      });

      return;
    }

    if (!imageUrl) return;

    Image.getSize(
      imageUrl,
      (width, height) => {
        if (width <= 0 || height <= 0) return;

        const nextSize = { width, height };

        setImageSize(prev => {
          if (areSizesEqual(prev, nextSize)) return prev;
          return nextSize;
        });
      },
      () => {
        setImageSize(prev => {
          if (areSizesEqual(prev, DEFAULT_SOURCE_SIZE)) return prev;
          return DEFAULT_SOURCE_SIZE;
        });
      },
    );
  }, [imageUrl, isVideo, sourceHeight, sourceWidth]);

  useEffect(() => {
    emitCropChange(transformRef.current, true);
  }, [emitCropChange, imageSize, frameSize]);

  const endInteraction = useCallback(() => {
    lastTouchCountRef.current = 0;
    pinchStartDistanceRef.current = 0;

    updateTransform(transformRef.current, true);
    onInteractionEnd?.();
  }, [onInteractionEnd, updateTransform]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!active,
        onMoveShouldSetPanResponder: () => !!active,
        onStartShouldSetPanResponderCapture: () => !!active,
        onMoveShouldSetPanResponderCapture: () => !!active,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,

        onPanResponderGrant: event => {
          if (!active) return;

          onInteractionStart?.();

          startTransformRef.current = transformRef.current;
          lastTouchCountRef.current = event.nativeEvent.touches.length;
          pinchStartDistanceRef.current = getTouchDistance(event);
        },

        onPanResponderMove: (
          event: GestureResponderEvent,
          gesture: PanResponderGestureState,
        ) => {
          if (!active) return;

          const touchCount = event.nativeEvent.touches.length;

          if (touchCount >= 2) {
            const nextDistance = getTouchDistance(event);

            if (
              lastTouchCountRef.current !== touchCount ||
              pinchStartDistanceRef.current <= 0
            ) {
              startTransformRef.current = transformRef.current;
              pinchStartDistanceRef.current = nextDistance;
              lastTouchCountRef.current = touchCount;
              return;
            }

            const startDistance = Math.max(1, pinchStartDistanceRef.current);

            const nextScale =
              startTransformRef.current.scale * (nextDistance / startDistance);

            updateTransform(
              {
                ...startTransformRef.current,
                scale: nextScale,
              },
              false,
            );

            return;
          }

          if (touchCount === 1) {
            if (lastTouchCountRef.current !== touchCount) {
              startTransformRef.current = transformRef.current;
              lastTouchCountRef.current = touchCount;
            }

            updateTransform(
              {
                ...startTransformRef.current,
                translateX: startTransformRef.current.translateX + gesture.dx,
                translateY: startTransformRef.current.translateY + gesture.dy,
              },
              false,
            );
          }
        },

        onPanResponderRelease: endInteraction,
        onPanResponderTerminate: endInteraction,
      }),
    [active, endInteraction, onInteractionStart, updateTransform],
  );

  const coverLayout = getCoverLayout(imageSize, frameSize);

  return (
    <View style={styles.outer}>
      <View style={styles.cardShadow}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.20)',
            'rgba(255,255,255,0.055)',
            'rgba(0,0,0,0.50)',
          ]}
          style={styles.cardChrome}
        >
          <View
            collapsable={false}
            onLayout={event => {
              const { width, height } = event.nativeEvent.layout;

              if (width > 0 && height > 0) {
                const nextSize = { width, height };

                setFrameSize(prev => {
                  if (areSizesEqual(prev, nextSize)) return prev;
                  return nextSize;
                });
              }
            }}
            style={[
              styles.frame,
              {
                width: frameWidth,
                height: frameHeight,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.imageLayer,
                {
                  width: coverLayout.displayWidth,
                  height: coverLayout.displayHeight,
                  left: coverLayout.offsetX,
                  top: coverLayout.offsetY,
                  transform: [
                    { translateX: transform.translateX },
                    { translateY: transform.translateY },
                    { scale: transform.scale },
                  ],
                },
              ]}
            >
              {isVideo && mediaUrl ? (
                <VideoCropLayer videoUrl={mediaUrl} posterUrl={imageUrl} />
              ) : (
                <Image
                  source={{ uri: imageUrl }}
                  resizeMode="stretch"
                  onLoad={event => {
                    const source = event.nativeEvent.source;

                    if (source?.width > 0 && source?.height > 0) {
                      const nextSize = {
                        width: source.width,
                        height: source.height,
                      };

                      setImageSize(prev => {
                        if (areSizesEqual(prev, nextSize)) return prev;
                        return nextSize;
                      });
                    }
                  }}
                  style={styles.image}
                />
              )}
            </View>

            <LinearGradient
              colors={[
                'rgba(0,0,0,0.18)',
                'rgba(0,0,0,0.00)',
                'rgba(0,0,0,0.24)',
              ]}
              locations={[0, 0.45, 1]}
              pointerEvents="none"
              style={styles.fill}
            />

            <CropPreviewOverlay mode={mode} />

            <CropGrid />

            <View pointerEvents="none" style={styles.focusBorder} />

            <View
              collapsable={false}
              {...panResponder.panHandlers}
              style={styles.touchLayer}
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

export default CropPreviewFrame;

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
  },

  cardShadow: {
    borderRadius: 38,
    backgroundColor: 'rgba(0,0,0,0.62)',
    shadowColor: '#000000',
    shadowOpacity: 0.42,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
  },

  cardChrome: {
    borderRadius: 38,
    padding: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },

  frame: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#050505',
  },

  imageLayer: {
    position: 'absolute',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  videoLayer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#050505',
    overflow: 'hidden',
  },

  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  touchLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    elevation: 50,
    backgroundColor: 'transparent',
  },

  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  focusBorder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
});