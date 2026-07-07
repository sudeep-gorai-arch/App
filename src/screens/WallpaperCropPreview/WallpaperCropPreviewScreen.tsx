import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../styles/colors';
import { fontFamily } from '../../styles/typography';
import { SCREEN, spacing } from '../../utils/constants';
import CropPreviewFrame, {
  CropPreviewFrameValue,
} from '../../components/wallpaper/CropPreviewFrame';
import {
  WALLPAPER_PHONE_ASPECT_RATIO,
  getPreviewModeLabel,
  getPreviewModesForTarget,
  WallpaperCropRect,
  WallpaperCropTarget,
  WallpaperPreviewMode,
} from '../../utils/wallpaperCrop';
import {
  applyVideoWallpaperToAndroid,
  applyWallpaperToAndroid,
  WallpaperApplyTarget,
} from '../../services/applyWallpaperService';

type CropMediaType = 'IMAGE' | 'VIDEO';

type Props = {
  navigation: any;
  route: {
    params?: {
      imageUrl?: string;
      videoUrl?: string;
      mediaType?: CropMediaType | string;
      isVideo?: boolean;
      target?: WallpaperCropTarget;
      title?: string;
      videoWidth?: number | null;
      videoHeight?: number | null;
    };
  };
};

type CropMap = Partial<Record<WallpaperPreviewMode, CropPreviewFrameValue>>;

const getPrimaryCropValue = ({
  cropMap,
  target,
  latestCrop,
}: {
  cropMap: CropMap;
  target: WallpaperCropTarget;
  latestCrop?: CropPreviewFrameValue | null;
}): CropPreviewFrameValue | undefined => {
  if (target === 'home') {
    return cropMap.home || latestCrop || undefined;
  }

  if (target === 'lock') {
    return cropMap.lock || latestCrop || undefined;
  }

  return latestCrop || cropMap.home || cropMap.lock || undefined;
};

const getPrimaryCropRect = ({
  cropMap,
  target,
  latestCrop,
}: {
  cropMap: CropMap;
  target: WallpaperCropTarget;
  latestCrop?: CropPreviewFrameValue | null;
}): WallpaperCropRect | undefined => {
  return getPrimaryCropValue({
    cropMap,
    target,
    latestCrop,
  })?.cropRect;
};

const toNumberOrNull = (value: unknown) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const buildVideoCropConfig = (cropValue?: CropPreviewFrameValue | null) => {
  if (!cropValue) return null;

  return {
    scale: cropValue.transform.scale,
    translateX: cropValue.transform.translateX,
    translateY: cropValue.transform.translateY,

    previewWidth: cropValue.frameSize.width,
    previewHeight: cropValue.frameSize.height,

    videoWidth: cropValue.imageSize.width,
    videoHeight: cropValue.imageSize.height,

    cropX: cropValue.cropRect.x,
    cropY: cropValue.cropRect.y,
    cropWidth: cropValue.cropRect.width,
    cropHeight: cropValue.cropRect.height,
  };
};

const WallpaperCropPreviewScreen = ({ navigation, route }: Props) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const latestCropRef = useRef<CropPreviewFrameValue | null>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const imageUrl = String(route.params?.imageUrl || '').trim();
  const videoUrl = String(route.params?.videoUrl || '').trim();

  const mediaType = String(route.params?.mediaType || '').toUpperCase();

  const isVideo = Boolean(
    route.params?.isVideo || mediaType === 'VIDEO' || videoUrl,
  );

  const target = (
    isVideo ? 'lock' : route.params?.target || 'home'
  ) as WallpaperCropTarget;

  const title = route.params?.title || 'FlexiWalls Wallpaper';

  const sourceWidth = toNumberOrNull(route.params?.videoWidth);
  const sourceHeight = toNumberOrNull(route.params?.videoHeight);

  const [cropMap, setCropMap] = useState<CropMap>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [applying, setApplying] = useState(false);
  const [cropInteractionActive, setCropInteractionActive] = useState(false);

  const previewModes = useMemo(() => {
    if (isVideo) {
      return ['lock'] as WallpaperPreviewMode[];
    }

    return getPreviewModesForTarget(target);
  }, [isVideo, target]);

  const isBoth = !isVideo && target === 'both';

  const maxCardWidthByScreen = Math.max(240, windowWidth - 46);
  const reservedVerticalSpace = isBoth ? 245 : isVideo ? 235 : 185;
  const maxCardHeightByScreen = Math.max(
    420,
    windowHeight - reservedVerticalSpace,
  );

  const cardWidth = Math.floor(
    Math.min(
      maxCardWidthByScreen,
      340,
      maxCardHeightByScreen / WALLPAPER_PHONE_ASPECT_RATIO,
    ),
  );

  const cardHeight = Math.round(cardWidth * WALLPAPER_PHONE_ASPECT_RATIO);

  const cardOuterWidth = cardWidth + 14;
  const cardOuterHeight = cardHeight + 14;

  const onCropChange = (value: CropPreviewFrameValue) => {
    latestCropRef.current = value;

    setCropMap(prev => ({
      ...prev,
      [value.mode]: value,
    }));
  };

  const switchPreview = (index: number) => {
    if (!isBoth || applying) return;

    const nextIndex = Math.max(0, Math.min(previewModes.length - 1, index));

    setActiveIndex(nextIndex);

    scrollRef.current?.scrollTo({
      x: SCREEN.width * nextIndex,
      animated: true,
    });
  };

  const onDone = async () => {
    if (applying) return;

    if (!imageUrl) {
      Alert.alert(
        'Missing wallpaper',
        isVideo
          ? 'Video preview image URL is missing.'
          : 'Wallpaper image URL is missing.',
      );
      return;
    }

    if (isVideo && !videoUrl) {
      Alert.alert('Missing video', 'Video wallpaper URL is missing.');
      return;
    }

    try {
      setApplying(true);

      const cropValue = getPrimaryCropValue({
        cropMap,
        target,
        latestCrop: latestCropRef.current,
      });

      const cropRect =
        cropValue?.cropRect ||
        getPrimaryCropRect({
          cropMap,
          target,
          latestCrop: latestCropRef.current,
        });

      if (isVideo) {
        const videoCropConfig = buildVideoCropConfig(cropValue);

        await applyVideoWallpaperToAndroid(
          videoUrl,
          target as WallpaperApplyTarget,
          title || 'FlexiWalls Video Wallpaper',
          videoCropConfig,
        );

        navigation.goBack();

        return;
      }

      await applyWallpaperToAndroid(
        imageUrl,
        target as WallpaperApplyTarget,
        cropRect,
      );

      navigation.goBack();
    } catch (error: any) {
      console.log(
        isVideo
          ? 'Open Android live wallpaper preview failed:'
          : 'Apply cropped wallpaper failed:',
        error,
      );

      Alert.alert(
        isVideo ? 'Preview failed' : 'Apply failed',
        error?.message ||
        (isVideo
          ? 'Could not open Android live wallpaper preview.'
          : 'Could not apply this wallpaper.'),
      );
    } finally {
      setApplying(false);
    }
  };

  const onScroll = (event: any) => {
    if (!isBoth) return;

    const x = Number(event?.nativeEvent?.contentOffset?.x || 0);
    const nextIndex = Math.round(x / SCREEN.width);

    setActiveIndex(Math.max(0, Math.min(previewModes.length - 1, nextIndex)));
  };

  const renderFloatingActions = () => {
    return (
      <View pointerEvents="box-none" style={styles.floatingActions}>
        <Pressable
          onPress={() => {
            if (!applying) navigation.goBack();
          }}
          disabled={applying}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButtonWrap,
            {
              opacity: pressed || applying ? 0.65 : 1,
              transform: [{ scale: pressed && !applying ? 0.96 : 1 }],
            },
          ]}
        >
          <BlurView intensity={40} tint="dark" style={styles.backButton}>
            <View pointerEvents="none" style={styles.glassHighlight} />

            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.textPrimary}
            />
          </BlurView>
        </Pressable>

        <Pressable
          onPress={onDone}
          disabled={applying}
          hitSlop={8}
          style={({ pressed }) => [
            styles.doneButtonWrap,
            {
              opacity: pressed || applying ? 0.8 : 1,
              transform: [{ scale: pressed && !applying ? 0.96 : 1 }],
            },
          ]}
        >
          <BlurView intensity={42} tint="dark" style={styles.doneButton}>
            <View pointerEvents="none" style={styles.doneGlassOverlay} />

            {applying ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Text style={styles.doneButtonText}>
                {isVideo ? 'Next' : 'Done'}
              </Text>
            )}
          </BlurView>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[
          'rgba(14,165,233,0.16)',
          'rgba(139,92,246,0.10)',
          'rgba(15,15,16,0)',
        ]}
        style={styles.backgroundGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.previewArea}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled={isBoth}
            scrollEnabled={isBoth && !applying && !cropInteractionActive}
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.previewScroller,
              !isBoth ? styles.previewScrollerSingle : null,
            ]}
          >
            {previewModes.map(mode => (
              <View
                key={mode}
                style={[
                  styles.previewPage,
                  {
                    width: isBoth ? SCREEN.width : undefined,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardWithActions,
                    {
                      width: cardOuterWidth,
                      height: cardOuterHeight,
                    },
                  ]}
                >
                  <CropPreviewFrame
                    imageUrl={imageUrl}
                    videoUrl={videoUrl}
                    mediaType={isVideo ? 'VIDEO' : 'IMAGE'}
                    isVideo={isVideo}
                    mode={mode}
                    active={!applying}
                    frameWidth={cardWidth}
                    frameHeight={cardHeight}
                    sourceWidth={sourceWidth}
                    sourceHeight={sourceHeight}
                    onCropChange={onCropChange}
                    onInteractionStart={() => setCropInteractionActive(true)}
                    onInteractionEnd={() => setCropInteractionActive(false)}
                  />

                  {renderFloatingActions()}
                </View>

                <Text style={styles.modeLabel}>
                  {isVideo ? 'Lock screen preview' : getPreviewModeLabel(mode)}
                </Text>

                {isVideo ? (
                  <View style={styles.videoExternalNote}>
                    <Ionicons
                      name="open-outline"
                      size={15}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.videoExternalNoteText}>
                      Apply using Android external preview
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>

        {isBoth ? (
          <View style={styles.previewSwitchBottom}>
            {previewModes.map((mode, index) => {
              const active = index === activeIndex;

              return (
                <Pressable
                  key={mode}
                  disabled={applying}
                  onPress={() => switchPreview(index)}
                  style={({ pressed }) => [
                    styles.switchPill,
                    active ? styles.switchPillActive : null,
                    pressed ? styles.switchPillPressed : null,
                  ]}
                >
                  <Ionicons
                    name={
                      mode === 'home'
                        ? 'home-outline'
                        : 'lock-closed-outline'
                    }
                    size={15}
                    color={active ? colors.textPrimary : colors.textSecondary}
                  />

                  <Text
                    style={[
                      styles.switchText,
                      active ? styles.switchTextActive : null,
                    ]}
                  >
                    {mode === 'home' ? 'Home screen' : 'Lock screen'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
};

export default WallpaperCropPreviewScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  backgroundGlow: {
    position: 'absolute',
    left: -80,
    top: -90,
    width: SCREEN.width + 160,
    height: 340,
  },

  safeArea: {
    flex: 1,
  },

  previewArea: {
    flex: 1,
    justifyContent: 'center',
  },

  previewScroller: {
    alignItems: 'center',
  },

  previewScrollerSingle: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  previewPage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },

  cardWithActions: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  floatingActions: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    zIndex: 20,
    elevation: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButtonWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 14,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  doneButtonWrap: {
    minWidth: 82,
    height: 44,
    borderRadius: 22,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
  },

  doneButton: {
    minWidth: 82,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  doneGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  doneButtonText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0,0,0,0.38)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  modeLabel: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    textAlign: 'center',
  },

  videoExternalNote: {
    marginTop: spacing.sm,
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },

  videoExternalNoteText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  previewSwitchBottom: {
    alignSelf: 'center',
    marginBottom: spacing.md,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  switchPill: {
    minHeight: 36,
    minWidth: 126,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  switchPillActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  switchPillPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },

  switchText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  switchTextActive: {
    color: colors.textPrimary,
  },
});