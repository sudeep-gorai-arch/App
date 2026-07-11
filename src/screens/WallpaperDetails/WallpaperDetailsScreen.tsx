import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Easing,
  Image,
  ImageBackground,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { colors } from "../../styles/colors";
import { fontFamily } from "../../styles/typography";
import { radius, spacing } from "../../utils/constants";
import { RootStackParamList } from "../../navigation/RootStackParamList";

import API from "../../services/api";
import { downloadWallpaper } from "../../utils/downloadHelper";
import {
  addDownload,
  ensureDownloadAllowed,
  saveLocalDownload,
} from "../../services/downloadService";
import {
  getFavoriteStatus,
  toggleFavorite,
} from "../../services/favoriteService";
import {
  getWallpaperById,
  incrementView,
} from "../../services/wallpaperService";
import type { WallpaperApplyTarget } from "../../services/applyWallpaperService";

import { appEvents } from "../../utils/appEvents";
import { useToast } from "../../components/ui/toast/useToast";

type Props = NativeStackScreenProps<RootStackParamList, "WallpaperDetails">;

type Status = "idle" | "downloading" | "done";

const DOWNLOAD_GRADIENT = ["#3B82F6", "#8B5CF6", "#EC4899"] as const;
const APPLY_GRADIENT = ["#0EA5E9", "#14B8A6", "#22D3EE"] as const;
const POPUP_GRADIENT = ["#3B82F6", "#8B5CF6", "#EC4899"] as const;

const API_ORIGIN = String(API.defaults.baseURL || "").replace(/\/api\/?$/, "");
const LOCAL_DOWNLOADS_KEY = "@flexiwalls:guestDownloads";
const MAX_LOCAL_DOWNLOADS = 100;

type DownloadSaveResult =
  | boolean
  | {
      success?: boolean;
      ok?: boolean;
      uri?: string | null;
      localUri?: string | null;
      fileUri?: string | null;
      savedUri?: string | null;
      assetId?: string | null;
      mediaAssetId?: string | null;
      asset?: {
        id?: string | null;
        uri?: string | null;
      } | null;
    }
  | null
  | undefined;

const isDownloadSuccessful = (result: DownloadSaveResult) => {
  if (typeof result === "boolean") return result;
  if (!result) return false;

  if (result.success === false || result.ok === false) return false;

  return Boolean(
    result.success ||
    result.ok ||
    result.uri ||
    result.localUri ||
    result.fileUri ||
    result.savedUri ||
    result.assetId ||
    result.mediaAssetId ||
    result.asset?.id ||
    result.asset?.uri,
  );
};

const getSavedDeviceInfo = (result: DownloadSaveResult) => {
  if (!result || typeof result === "boolean") {
    return {
      localUri: null,
      fileUri: null,
      savedUri: null,
      assetId: null,
      mediaAssetId: null,
    };
  }

  const localUri =
    result.localUri ||
    result.fileUri ||
    result.savedUri ||
    result.uri ||
    result.asset?.uri ||
    null;

  const assetId =
    result.assetId || result.mediaAssetId || result.asset?.id || null;

  return {
    localUri,
    fileUri: result.fileUri || localUri,
    savedUri: result.savedUri || localUri,
    assetId,
    mediaAssetId: result.mediaAssetId || assetId,
  };
};

const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

const isBlankishValue = (value: unknown) => {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    !text ||
    text === "null" ||
    text === "undefined" ||
    text === "false" ||
    text === "0"
  );
};

const isRealVideoUrlValue = (value: unknown) => {
  if (isBlankishValue(value)) return false;

  const text = String(value).trim();

  return (
    VIDEO_EXTENSION_PATTERN.test(text) ||
    /\/videos?\//i.test(text) ||
    /video-wallpapers?/i.test(text)
  );
};

const getWallpaperMediaType = (wallpaper: any) => {
  return String(
    wallpaper?.mediaType || wallpaper?.media_type || wallpaper?.type || "",
  )
    .trim()
    .toUpperCase();
};

const toAbsoluteMediaUrl = (value?: string | null) => {
  if (!value) return undefined;

  const url = String(value).trim();

  if (!url) return undefined;

  if (/^https?:\/\//i.test(url)) {
    if (!API_ORIGIN) return url;

    return url.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
      API_ORIGIN,
    );
  }

  if (url.startsWith("//")) return `https:${url}`;

  if (url.startsWith("/")) {
    return API_ORIGIN ? `${API_ORIGIN}${url}` : url;
  }

  return API_ORIGIN ? `${API_ORIGIN}/${url}` : url;
};

const unwrapApiData = (response: any) =>
  response?.data?.data ?? response?.data ?? response;

const getApiErrorStatus = (error: any) =>
  error?.response?.status ?? error?.status;

const getApiErrorMessage = (error: any) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "";

const clearSavedToken = async () => {
  try {
    await SecureStore.deleteItemAsync("token");
  } catch {
    // ignore
  }

  try {
    await AsyncStorage.removeItem("token");
  } catch {
    // ignore
  }
};

const getWallpaperId = (wallpaper: any) =>
  String(
    wallpaper?.id ||
      wallpaper?._id ||
      wallpaper?.wallpaperId ||
      wallpaper?.wallpaper_id ||
      "",
  );

const isPlaceholder = (wallpaperId: string) =>
  !wallpaperId ||
  wallpaperId.includes("placeholder") ||
  wallpaperId.startsWith("ph-");

const isVideoWallpaper = (wallpaper: any) => {
  const mediaType = getWallpaperMediaType(wallpaper);

  if (mediaType === "IMAGE") {
    return false;
  }

  if (mediaType === "VIDEO") {
    return true;
  }

  if (wallpaper?.isVideo === true || wallpaper?.is_video === true) {
    return true;
  }

  return (
    isRealVideoUrlValue(wallpaper?.videoUrl) ||
    isRealVideoUrlValue(wallpaper?.video_url) ||
    isRealVideoUrlValue(wallpaper?.videoPath) ||
    isRealVideoUrlValue(wallpaper?.video_path) ||
    isRealVideoUrlValue(wallpaper?.downloadUrl) ||
    isRealVideoUrlValue(wallpaper?.download_url) ||
    isRealVideoUrlValue(wallpaper?.url)
  );
};

const getWallpaperVideoUrl = (wallpaper: any): string | undefined => {
  const mediaType = getWallpaperMediaType(wallpaper);

  if (mediaType === "IMAGE") {
    return undefined;
  }

  const candidates = [
    wallpaper?.videoUrl,
    wallpaper?.video_url,
    wallpaper?.videoPath,
    wallpaper?.video_path,
    wallpaper?.downloadUrl,
    wallpaper?.download_url,
    wallpaper?.url,
  ];

  const videoValue = candidates.find(isRealVideoUrlValue);

  return toAbsoluteMediaUrl(videoValue);
};

const getWallpaperPreviewImage = (wallpaper: any): string => {
  const isVideo = isVideoWallpaper(wallpaper);

  const image = isVideo
    ? wallpaper?.videoPreviewUrl ||
      wallpaper?.video_preview_url ||
      wallpaper?.videoPreviewPath ||
      wallpaper?.video_preview_path ||
      wallpaper?.videoThumbnailUrl ||
      wallpaper?.video_thumbnail_url ||
      wallpaper?.videoThumbnailPath ||
      wallpaper?.video_thumbnail_path ||
      wallpaper?.thumbnailUrl ||
      wallpaper?.thumbnail_url ||
      wallpaper?.imageUrl ||
      wallpaper?.image_url ||
      wallpaper?.displayPath ||
      wallpaper?.display_path ||
      wallpaper?.originalPath ||
      wallpaper?.original_path
    : wallpaper?.imageUrl ||
      wallpaper?.thumbnailUrl ||
      wallpaper?.image_url ||
      wallpaper?.thumbnail_url ||
      wallpaper?.displayPath ||
      wallpaper?.display_path ||
      wallpaper?.originalPath ||
      wallpaper?.original_path ||
      wallpaper?.url ||
      wallpaper?.image ||
      wallpaper?.thumbnail ||
      wallpaper?.photoUrl ||
      wallpaper?.photo_url ||
      wallpaper?.mediaUrl ||
      wallpaper?.media_url;

  return (
    toAbsoluteMediaUrl(image) ||
    "https://picsum.photos/seed/flexiwalls-details-fallback/900/1600"
  );
};

const getWallpaperFullImage = (wallpaper: any): string => {
  if (isVideoWallpaper(wallpaper)) {
    return getWallpaperPreviewImage(wallpaper);
  }

  const image =
    wallpaper?.originalUrl ||
    wallpaper?.original_url ||
    wallpaper?.originalPath ||
    wallpaper?.original_path ||
    wallpaper?.downloadUrl ||
    wallpaper?.download_url ||
    wallpaper?.imageUrl ||
    wallpaper?.image_url ||
    wallpaper?.displayPath ||
    wallpaper?.display_path ||
    wallpaper?.url ||
    wallpaper?.image ||
    wallpaper?.mediaUrl ||
    wallpaper?.media_url ||
    wallpaper?.thumbnailUrl ||
    wallpaper?.thumbnail_url ||
    wallpaper?.thumbnail ||
    wallpaper?.photoUrl ||
    wallpaper?.photo_url;

  return (
    toAbsoluteMediaUrl(image) ||
    "https://picsum.photos/seed/flexiwalls-details-fallback/900/1600"
  );
};

const getWallpaperDownloadUrl = (wallpaper: any): string | undefined => {
  if (isVideoWallpaper(wallpaper)) {
    return (
      getWallpaperVideoUrl(wallpaper) ||
      toAbsoluteMediaUrl(wallpaper?.downloadUrl) ||
      toAbsoluteMediaUrl(wallpaper?.download_url) ||
      getWallpaperPreviewImage(wallpaper)
    );
  }

  return (
    toAbsoluteMediaUrl(wallpaper?.downloadUrl) ||
    toAbsoluteMediaUrl(wallpaper?.download_url) ||
    toAbsoluteMediaUrl(wallpaper?.originalPath) ||
    toAbsoluteMediaUrl(wallpaper?.original_path) ||
    toAbsoluteMediaUrl(wallpaper?.displayPath) ||
    toAbsoluteMediaUrl(wallpaper?.display_path) ||
    getWallpaperPreviewImage(wallpaper)
  );
};

const getDownloadUrlFromResponse = (response: any, fallbackUrl: string) => {
  const data = unwrapApiData(response);

  return (
    toAbsoluteMediaUrl(data?.downloadUrl) ||
    toAbsoluteMediaUrl(data?.download_url) ||
    toAbsoluteMediaUrl(data?.videoUrl) ||
    toAbsoluteMediaUrl(data?.video_url) ||
    toAbsoluteMediaUrl(data?.videoPath) ||
    toAbsoluteMediaUrl(data?.video_path) ||
    toAbsoluteMediaUrl(data?.url) ||
    toAbsoluteMediaUrl(data?.imageUrl) ||
    toAbsoluteMediaUrl(data?.image_url) ||
    toAbsoluteMediaUrl(data?.thumbnailUrl) ||
    toAbsoluteMediaUrl(data?.thumbnail_url) ||
    fallbackUrl
  );
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
};

const toPositiveDimensionNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getDimensionPartsFromText = (value?: string | null) => {
  const text = String(value || "").trim();

  if (!text) {
    return {
      width: null,
      height: null,
    };
  }

  const match = text.match(/(\d{3,5})\s*[x×]\s*(\d{3,5})/i);

  if (!match) {
    return {
      width: null,
      height: null,
    };
  }

  return {
    width: toPositiveDimensionNumber(match[1]),
    height: toPositiveDimensionNumber(match[2]),
  };
};

const getWallpaperSourceWidth = (wallpaper: any): number | null => {
  return (
    toPositiveDimensionNumber(wallpaper?.videoWidth) ||
    toPositiveDimensionNumber(wallpaper?.video_width) ||
    toPositiveDimensionNumber(wallpaper?.width) ||
    toPositiveDimensionNumber(wallpaper?.imageWidth) ||
    toPositiveDimensionNumber(wallpaper?.image_width) ||
    toPositiveDimensionNumber(wallpaper?.meta?.videoWidth) ||
    toPositiveDimensionNumber(wallpaper?.meta?.width) ||
    getDimensionPartsFromText(wallpaper?.dimensions).width ||
    getDimensionPartsFromText(wallpaper?.resolution).width ||
    null
  );
};

const getWallpaperSourceHeight = (wallpaper: any): number | null => {
  return (
    toPositiveDimensionNumber(wallpaper?.videoHeight) ||
    toPositiveDimensionNumber(wallpaper?.video_height) ||
    toPositiveDimensionNumber(wallpaper?.height) ||
    toPositiveDimensionNumber(wallpaper?.imageHeight) ||
    toPositiveDimensionNumber(wallpaper?.image_height) ||
    toPositiveDimensionNumber(wallpaper?.meta?.videoHeight) ||
    toPositiveDimensionNumber(wallpaper?.meta?.height) ||
    getDimensionPartsFromText(wallpaper?.dimensions).height ||
    getDimensionPartsFromText(wallpaper?.resolution).height ||
    null
  );
};

const formatCount = (value?: number | string) => {
  const count = toNumber(value);

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace(".0", "")}M`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(".0", "")}K`;
  }

  return String(count);
};

const getDownloads = (wallpaper: any) =>
  Math.max(
    toNumber(wallpaper?.downloads),
    toNumber(wallpaper?.downloadCount),
    toNumber(wallpaper?.download_count),
    toNumber(wallpaper?.downloadsThisWeek),
    toNumber(wallpaper?.weeklyDownloads),
    toNumber(wallpaper?._count?.downloads),
  );

const getFavoriteCountValue = (value: any) =>
  Math.max(
    toNumber(value?.favoriteCount),
    toNumber(value?.favorite_count),
    toNumber(value?.favoritesCount),
    toNumber(value?._count?.favorites),
    toNumber(value?.favorites),
  );

const hasFavoriteCountValue = (value: any) =>
  value?.favoriteCount !== undefined ||
  value?.favorite_count !== undefined ||
  value?.favoritesCount !== undefined ||
  value?._count?.favorites !== undefined ||
  value?.favorites !== undefined;

const getFavoriteCountFromPayload = (value: any, fallback: number) => {
  if (!hasFavoriteCountValue(value)) return fallback;

  return getFavoriteCountValue(value);
};

const getCategoryName = (wallpaper: any) => {
  if (wallpaper?.category?.name) return wallpaper.category.name;
  if (wallpaper?.categoryName) return wallpaper.categoryName;
  if (wallpaper?.category_name) return wallpaper.category_name;
  if (typeof wallpaper?.category === "string") return wallpaper.category;

  return "Wallpaper";
};

const getDimensions = (wallpaper: any) => {
  if (wallpaper?.dimensions) return String(wallpaper.dimensions);
  if (wallpaper?.resolution) return String(wallpaper.resolution);

  const width =
    wallpaper?.width ||
    wallpaper?.imageWidth ||
    wallpaper?.image_width ||
    wallpaper?.videoWidth ||
    wallpaper?.video_width ||
    wallpaper?.meta?.width;

  const height =
    wallpaper?.height ||
    wallpaper?.imageHeight ||
    wallpaper?.image_height ||
    wallpaper?.videoHeight ||
    wallpaper?.video_height ||
    wallpaper?.meta?.height;

  if (width && height) return `${width} × ${height}`;

  return isVideoWallpaper(wallpaper) ? "Live Wallpaper" : "4K Ultra HD";
};

const saveGuestDownloadHistory = async (
  wallpaper: any,
  wallpaperId: string,
  downloadedUrl: string,
  savedDeviceInfo?: {
    localUri?: string | null;
    fileUri?: string | null;
    savedUri?: string | null;
    assetId?: string | null;
    mediaAssetId?: string | null;
  },
) => {
  try {
    const id = String(
      wallpaperId ||
        wallpaper?.id ||
        wallpaper?._id ||
        wallpaper?.wallpaperId ||
        wallpaper?.wallpaper_id ||
        downloadedUrl,
    );

    const isVideo = isVideoWallpaper(wallpaper);
    const previewImage = getWallpaperPreviewImage(wallpaper);
    const videoUrl = getWallpaperVideoUrl(wallpaper);

    const record = {
      ...wallpaper,
      id,
      mediaType: isVideo ? "VIDEO" : "IMAGE",
      isVideo,
      downloadUrl: downloadedUrl,
      localUri:
        savedDeviceInfo?.localUri ||
        savedDeviceInfo?.fileUri ||
        savedDeviceInfo?.savedUri ||
        null,
      fileUri:
        savedDeviceInfo?.fileUri ||
        savedDeviceInfo?.localUri ||
        savedDeviceInfo?.savedUri ||
        null,
      savedUri:
        savedDeviceInfo?.savedUri ||
        savedDeviceInfo?.localUri ||
        savedDeviceInfo?.fileUri ||
        null,
      assetId:
        savedDeviceInfo?.assetId || savedDeviceInfo?.mediaAssetId || null,
      mediaAssetId:
        savedDeviceInfo?.mediaAssetId || savedDeviceInfo?.assetId || null,
      imageUrl:
        wallpaper?.imageUrl ||
        wallpaper?.image_url ||
        wallpaper?.url ||
        wallpaper?.image ||
        wallpaper?.mediaUrl ||
        previewImage ||
        downloadedUrl,
      thumbnailUrl:
        wallpaper?.thumbnailUrl ||
        wallpaper?.thumbnail_url ||
        wallpaper?.videoThumbnailUrl ||
        wallpaper?.video_thumbnail_url ||
        wallpaper?.thumbnail ||
        wallpaper?.photoUrl ||
        wallpaper?.photo_url ||
        previewImage ||
        downloadedUrl,
      videoUrl: videoUrl || wallpaper?.videoUrl || wallpaper?.video_url || null,
      videoPreviewUrl:
        wallpaper?.videoPreviewUrl ||
        wallpaper?.video_preview_url ||
        previewImage ||
        null,
      videoThumbnailUrl:
        wallpaper?.videoThumbnailUrl ||
        wallpaper?.video_thumbnail_url ||
        wallpaper?.thumbnailUrl ||
        wallpaper?.thumbnail_url ||
        null,
      downloadedAt: new Date().toISOString(),
    };

    const raw = await AsyncStorage.getItem(LOCAL_DOWNLOADS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const existing = Array.isArray(parsed) ? parsed : [];

    const withoutDuplicate = existing.filter((item: any) => {
      const existingId = String(
        item?.id || item?._id || item?.wallpaperId || item?.wallpaper_id || "",
      );

      return existingId !== id;
    });

    await AsyncStorage.setItem(
      LOCAL_DOWNLOADS_KEY,
      JSON.stringify(
        [record, ...withoutDuplicate].slice(0, MAX_LOCAL_DOWNLOADS),
      ),
    );
  } catch (error) {
    console.log("SAVE GUEST DOWNLOAD HISTORY ERROR", error);
  }
};

const InfoPill = ({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) => {
  return (
    <BlurView intensity={30} tint="dark" style={styles.infoPill}>
      <Ionicons name={icon} size={15} color={colors.textPrimary} />

      <Text style={styles.infoPillText} numberOfLines={1}>
        {text}
      </Text>
    </BlurView>
  );
};

const ApplyButtonIcon = () => {
  return (
    <View style={styles.applyIconFrame}>
      <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
    </View>
  );
};

type VideoWallpaperPreviewProps = {
  videoUrl: string;
  fallbackImage: string;
  style?: any;
  children?: React.ReactNode;
};

const VideoWallpaperPreview = ({
  videoUrl,
  fallbackImage,
  style,
  children,
}: VideoWallpaperPreviewProps) => {
  const player = useVideoPlayer(videoUrl, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    const playVideo = () => {
      try {
        player.loop = true;
        player.muted = true;
        player.play();
      } catch (error) {
        console.log("Video preview play failed:", error);
      }
    };

    playVideo();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setTimeout(playVideo, 250);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, videoUrl]);

  return (
    <View style={[style, styles.videoPreviewWrap]}>
      <ImageBackground
        source={{ uri: fallbackImage }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <VideoView
        key={videoUrl}
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        surfaceType="textureView"
      />

      <LinearGradient
        colors={["rgba(0,0,0,0.16)", "rgba(0,0,0,0.01)", "rgba(0,0,0,0.20)"]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {children}
    </View>
  );
};

type PannableImagePreviewProps = {
  imageUrl: string;
  style?: any;
  imageStyle?: any;
  children?: React.ReactNode;
  onImageError?: () => void;
  sourceWidth?: number | null;
  sourceHeight?: number | null;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const PannableImagePreview = ({
  imageUrl,
  style,
  imageStyle,
  children,
  onImageError,
  sourceWidth,
  sourceHeight,
}: PannableImagePreviewProps) => {
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const currentPosition = useRef({ x: 0, y: 0 });
  const gestureStartPosition = useRef({ x: 0, y: 0 });
  const panBounds = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let mounted = true;

    currentPosition.current = { x: 0, y: 0 };
    translateX.setValue(0);
    translateY.setValue(0);

    if (sourceWidth && sourceHeight) {
      setImageSize({ width: sourceWidth, height: sourceHeight });

      return () => {
        mounted = false;
      };
    }

    Image.getSize(
      imageUrl,
      (width, height) => {
        if (mounted) setImageSize({ width, height });
      },
      () => {
        // Keep vertical panning available if Android cannot inspect a remote URL.
        if (mounted) setImageSize({ width: 1080, height: 2340 });
      },
    );

    return () => {
      mounted = false;
    };
  }, [imageUrl, sourceHeight, sourceWidth, translateX, translateY]);

  const renderedImageSize = useMemo(() => {
    if (
      viewportSize.width <= 0 ||
      viewportSize.height <= 0 ||
      imageSize.width <= 0 ||
      imageSize.height <= 0
    ) {
      return null;
    }

    const coverScale = Math.max(
      viewportSize.width / imageSize.width,
      viewportSize.height / imageSize.height,
    );

    return {
      width: imageSize.width * coverScale,
      height: imageSize.height * coverScale,
    };
  }, [imageSize, viewportSize]);

  useEffect(() => {
    if (!renderedImageSize) {
      panBounds.current = { x: 0, y: 0 };
      return;
    }

    const bounds = {
      x: Math.max(0, (renderedImageSize.width - viewportSize.width) / 2),
      y: Math.max(0, (renderedImageSize.height - viewportSize.height) / 2),
    };

    panBounds.current = bounds;

    const nextX = clamp(currentPosition.current.x, -bounds.x, bounds.x);
    const nextY = clamp(currentPosition.current.y, -bounds.y, bounds.y);

    currentPosition.current = { x: nextX, y: nextY };
    translateX.setValue(nextX);
    translateY.setValue(nextY);
  }, [renderedImageSize, translateX, translateY, viewportSize]);

  const imagePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_event, gestureState) => {
          const hasHiddenImageArea =
            panBounds.current.x > 0.5 || panBounds.current.y > 0.5;
          const movedEnough =
            Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;

          return hasHiddenImageArea && movedEnough;
        },
        // Do not capture child gestures. This lets the dedicated drag handle
        // receive a normal one-finger gesture without fighting image panning.
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderGrant: () => {
          gestureStartPosition.current = { ...currentPosition.current };
        },
        onPanResponderMove: (_event, gestureState) => {
          const nextX = clamp(
            gestureStartPosition.current.x + gestureState.dx,
            -panBounds.current.x,
            panBounds.current.x,
          );
          const nextY = clamp(
            gestureStartPosition.current.y + gestureState.dy,
            -panBounds.current.y,
            panBounds.current.y,
          );

          currentPosition.current = { x: nextX, y: nextY };
          translateX.setValue(nextX);
          translateY.setValue(nextY);
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [translateX, translateY],
  );

  const positionedImageStyle = renderedImageSize
    ? {
        width: renderedImageSize.width,
        height: renderedImageSize.height,
        left: (viewportSize.width - renderedImageSize.width) / 2,
        top: (viewportSize.height - renderedImageSize.height) / 2,
      }
    : StyleSheet.absoluteFill;

  return (
    <View
      style={style}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setViewportSize({ width, height });
      }}
      {...imagePanResponder.panHandlers}
    >
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.pannableImageClip, imageStyle]}
      >
        <Animated.Image
          source={{ uri: imageUrl }}
          resizeMode="cover"
          onError={onImageError}
          style={[
            styles.pannableImage,
            positionedImageStyle,
            {
              transform: [{ translateX }, { translateY }],
            },
          ]}
        />
      </View>

      {children}
    </View>
  );
};

type MediaPreviewProps = {
  isVideo: boolean;
  videoUrl?: string;
  imageUrl: string;
  style?: any;
  imageStyle?: any;
  children?: React.ReactNode;
  onImageError?: () => void;
  sourceWidth?: number | null;
  sourceHeight?: number | null;
};

const MediaPreview = ({
  isVideo,
  videoUrl,
  imageUrl,
  style,
  imageStyle,
  children,
  onImageError,
  sourceWidth,
  sourceHeight,
}: MediaPreviewProps) => {
  if (isVideo && videoUrl) {
    return (
      <VideoWallpaperPreview
        videoUrl={videoUrl}
        fallbackImage={imageUrl}
        style={style}
      >
        {children}
      </VideoWallpaperPreview>
    );
  }

  return (
    <PannableImagePreview
      imageUrl={imageUrl}
      style={style}
      imageStyle={imageStyle}
      onImageError={onImageError}
      sourceWidth={sourceWidth}
      sourceHeight={sourceHeight}
    >
      {children}
    </PannableImagePreview>
  );
};

const WallpaperDetailsScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const [wallpaper, setWallpaper] = useState<any>(
    route.params?.wallpaper ?? {},
  );

  const wallpaperId = getWallpaperId(wallpaper);
  const isVideo = isVideoWallpaper(wallpaper);
  const videoUrl = getWallpaperVideoUrl(wallpaper);
  const image = getWallpaperPreviewImage(wallpaper);
  const fullImage = isVideo ? image : getWallpaperFullImage(wallpaper);

  const [status, setStatus] = useState<Status>("idle");
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(
    Boolean(wallpaper?.isFavorite || wallpaper?.is_favorite),
  );
  const [favoriteCount, setFavoriteCount] = useState(
    getFavoriteCountValue(wallpaper),
  );
  const [imageFailed, setImageFailed] = useState(false);
  const [savedPopupVisible, setSavedPopupVisible] = useState(false);
  const [appliedPopupVisible, setAppliedPopupVisible] = useState(false);
  const [applySheetVisible, setApplySheetVisible] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [safeAreaHeight, setSafeAreaHeight] = useState(0);
  const [expandOverlayVisible, setExpandOverlayVisible] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  const expandProgress = useRef(new Animated.Value(0)).current;
  const overlayFade = useRef(new Animated.Value(0)).current;

  const toast = useToast();

  const finalImage = imageFailed
    ? "https://picsum.photos/seed/flexiwalls-details-error/900/1600"
    : fullImage;

  const downloadFallbackUrl = getWallpaperDownloadUrl(wallpaper) || finalImage;

  useEffect(() => {
    if (!route.params?.applied) return;

    setAppliedPopupVisible(true);

    navigation.setParams({
      applied: undefined,
    } as any);
  }, [navigation, route.params?.applied]);

  useEffect(() => {
    if (!wallpaperId) return;

    const unsubscribeFavorite = appEvents.on("favoritesChanged", (payload) => {
      if (String(payload.wallpaperId) !== wallpaperId) return;

      setIsFavorite(Boolean(payload.isFavorite));

      if (payload.favoriteCount !== undefined) {
        setFavoriteCount(toNumber(payload.favoriteCount));
      }

      setWallpaper((prev: any) => ({
        ...prev,
        ...(payload.wallpaper || {}),
        isFavorite: Boolean(payload.isFavorite),
        is_favorite: Boolean(payload.isFavorite),
        favoriteCount:
          payload.favoriteCount !== undefined
            ? toNumber(payload.favoriteCount)
            : prev?.favoriteCount,
        favoritesCount:
          payload.favoriteCount !== undefined
            ? toNumber(payload.favoriteCount)
            : prev?.favoritesCount,
      }));
    });

    const unsubscribeDownload = appEvents.on("downloadsChanged", (payload) => {
      if (String(payload.wallpaperId) !== wallpaperId) return;
      if (payload.downloadCount === undefined) return;

      const nextDownloadCount = toNumber(payload.downloadCount);

      setWallpaper((prev: any) => ({
        ...prev,
        ...(payload.wallpaper || {}),
        downloadCount: nextDownloadCount,
        download_count: nextDownloadCount,
        downloads: nextDownloadCount,
      }));
    });

    return () => {
      unsubscribeFavorite();
      unsubscribeDownload();
    };
  }, [wallpaperId]);

  useEffect(() => {
    if (!wallpaperId || isPlaceholder(wallpaperId)) return;

    const loadWallpaper = async () => {
      try {
        const detailsResponse = await getWallpaperById(wallpaperId);
        const details = unwrapApiData(detailsResponse);

        if (details) {
          setWallpaper((prev: any) => {
            const previousVideoUrl =
              prev?.videoUrl ||
              prev?.video_url ||
              prev?.videoPath ||
              prev?.video_path ||
              null;

            const detailsVideoUrl =
              details?.videoUrl ||
              details?.video_url ||
              details?.videoPath ||
              details?.video_path ||
              null;

            const merged = {
              ...prev,
              ...details,
            };

            const nextIsVideo = isVideoWallpaper({
              ...merged,
              videoUrl: detailsVideoUrl || previousVideoUrl,
              video_url: detailsVideoUrl || previousVideoUrl,
            });

            if (!nextIsVideo) {
              return merged;
            }

            const preservedVideoUrl =
              detailsVideoUrl || previousVideoUrl || merged?.videoUrl || null;

            return {
              ...merged,
              mediaType: "VIDEO",
              media_type: "VIDEO",
              isVideo: true,
              is_video: true,
              videoUrl: preservedVideoUrl,
              video_url: preservedVideoUrl,
              videoPath: merged?.videoPath || preservedVideoUrl,
              video_path: merged?.video_path || preservedVideoUrl,
            };
          });

          if (hasFavoriteCountValue(details)) {
            setFavoriteCount(getFavoriteCountValue(details));
          }
        }
      } catch (error: any) {
        console.log(
          "Wallpaper details failed:",
          error?.response?.data || error,
        );
      }
    };

    const loadFavoriteStatus = async () => {
      try {
        const token =
          (await SecureStore.getItemAsync("token")) ||
          (await AsyncStorage.getItem("token"));

        if (!token) {
          setIsFavorite(false);
          return;
        }

        const response = await getFavoriteStatus(wallpaperId);
        const data = unwrapApiData(response);

        setIsFavorite(Boolean(data?.isFavorite ?? data?.favorite));
        setFavoriteCount(getFavoriteCountValue(data));
      } catch (error: any) {
        console.log("Favorite status failed:", error?.response?.data || error);

        if (getApiErrorStatus(error) === 401) {
          setIsFavorite(false);
        }
      }
    };

    const recordWallpaperView = async () => {
      try {
        await incrementView(wallpaperId);
      } catch (error: any) {
        console.log("Increment view failed:", error?.response?.data || error);
      }
    };

    loadWallpaper();
    loadFavoriteStatus();
    recordWallpaperView();
  }, [wallpaperId]);

  const closeSavedPopup = () => {
    setSavedPopupVisible(false);
    setStatus("idle");
  };

  const closeAppliedPopup = () => {
    setAppliedPopupVisible(false);
  };

  const onDownload = async () => {
    if (status === "downloading") return;

    try {
      await ensureDownloadAllowed();
    } catch (error: any) {
      toast.warning(
        error?.message ||
          "Wi-Fi only downloads are enabled. Please connect to Wi-Fi or turn this setting off from Settings.",
      );
      return;
    }

    setStatus("downloading");

    try {
      const token =
        (await SecureStore.getItemAsync("token")) ||
        (await AsyncStorage.getItem("token"));
      const loggedIn = !!token;
      const shouldSaveLocalDownload = !loggedIn;

      let downloadUrl = downloadFallbackUrl;

      if (!isPlaceholder(wallpaperId)) {
        try {
          const response = await addDownload(wallpaperId, loggedIn);

          downloadUrl = getDownloadUrlFromResponse(
            response,
            downloadFallbackUrl,
          );
        } catch (error: any) {
          console.log(
            "Download record failed:",
            error?.response?.data || error,
          );

          const statusCode = getApiErrorStatus(error);
          const message = getApiErrorMessage(error);

          if (statusCode === 401 && loggedIn) {
            await clearSavedToken();

            try {
              const guestResponse = await addDownload(wallpaperId, false);

              downloadUrl = getDownloadUrlFromResponse(
                guestResponse,
                downloadFallbackUrl,
              );
            } catch (guestError: any) {
              const guestStatusCode = getApiErrorStatus(guestError);
              const guestMessage = getApiErrorMessage(guestError);

              if (guestStatusCode === 403) {
                if (guestMessage.includes("Daily free download limit")) {
                  toast.warning(
                    "Daily limit reached! Upgrade to Premium for unlimited downloads.",
                  );

                  setStatus("idle");

                  setTimeout(() => {
                    navigation.navigate("Premium");
                  }, 1200);

                  return;
                }

                if (
                  guestMessage.includes("Premium subscription required") ||
                  guestMessage.includes("premium wallpapers") ||
                  guestMessage.includes("Premium wallpaper")
                ) {
                  toast.warning(
                    "This is a Premium wallpaper. Upgrade to unlock it.",
                  );

                  setStatus("idle");

                  setTimeout(() => {
                    navigation.navigate("Premium");
                  }, 1200);

                  return;
                }

                toast.warning(guestMessage || "Download not allowed.");
                setStatus("idle");
                return;
              }

              if (
                guestError?.message === "Network Error" ||
                !guestError?.response
              ) {
                toast.error("No internet connection. Please try again.");
                setStatus("idle");
                return;
              }

              toast.error(
                guestMessage || "Something went wrong while downloading.",
              );

              setStatus("idle");
              return;
            }
          } else if (statusCode === 401) {
            await clearSavedToken();

            toast.info("Please sign in again to continue downloading.");

            setStatus("idle");

            navigation.navigate("MainTabs", {
              screen: "Profile",
            });

            return;
          } else if (statusCode === 403) {
            if (message.includes("Daily free download limit")) {
              toast.warning(
                "Daily limit reached! Upgrade to Premium for unlimited downloads.",
              );

              setStatus("idle");

              setTimeout(() => {
                navigation.navigate("Premium");
              }, 1200);

              return;
            }

            if (
              message.includes("Premium subscription required") ||
              message.includes("premium wallpapers") ||
              message.includes("Premium wallpaper")
            ) {
              toast.warning(
                "This is a Premium wallpaper. Upgrade to unlock it.",
              );

              setStatus("idle");

              setTimeout(() => {
                navigation.navigate("Premium");
              }, 1200);

              return;
            }

            toast.warning(message || "Download not allowed.");
            setStatus("idle");
            return;
          } else if (error?.message === "Network Error" || !error?.response) {
            toast.error("No internet connection. Please try again.");
            setStatus("idle");
            return;
          } else {
            toast.error(message || "Something went wrong while downloading.");
            setStatus("idle");
            return;
          }
        }
      }

      if (isVideo) {
        const realVideoUrl =
          getWallpaperVideoUrl(wallpaper) || videoUrl || downloadUrl;

        downloadUrl = realVideoUrl;
      }

      const downloadResult: DownloadSaveResult = await downloadWallpaper(
        downloadUrl,
        wallpaper?.title || wallpaperId || "FlexiWalls Wallpaper",
        {
          mediaType: isVideo ? "VIDEO" : "IMAGE",
          isVideo,
          extension: isVideo ? "mp4" : wallpaper?.extension,
        },
      );

      if (!isDownloadSuccessful(downloadResult)) {
        setStatus("idle");
        return;
      }

      const savedDeviceInfo = getSavedDeviceInfo(downloadResult);

      const nextDownloadCount = getDownloads(wallpaper) + 1;
      const downloadedAt = new Date().toISOString();

      const updatedWallpaper = {
        ...wallpaper,
        mediaType: isVideo ? "VIDEO" : "IMAGE",
        isVideo,
        downloadUrl,
        localUri: savedDeviceInfo.localUri,
        fileUri: savedDeviceInfo.fileUri,
        savedUri: savedDeviceInfo.savedUri,
        assetId: savedDeviceInfo.assetId,
        mediaAssetId: savedDeviceInfo.mediaAssetId,
        videoUrl: isVideo ? videoUrl || downloadUrl : wallpaper?.videoUrl,
        downloadCount: nextDownloadCount,
        download_count: nextDownloadCount,
        downloads: nextDownloadCount,
        downloadedAt,
      };

      setWallpaper(updatedWallpaper);

      await saveLocalDownload({
        wallpaperId,
        wallpaper: updatedWallpaper,
        localUri: savedDeviceInfo.localUri,
        fileUri: savedDeviceInfo.fileUri,
        savedUri: savedDeviceInfo.savedUri,
        assetId: savedDeviceInfo.assetId,
        mediaAssetId: savedDeviceInfo.mediaAssetId,
        downloadedAt,
        downloadCount: nextDownloadCount,
      });

      if (shouldSaveLocalDownload) {
        await saveGuestDownloadHistory(
          updatedWallpaper,
          wallpaperId,
          downloadUrl,
          savedDeviceInfo,
        );
      }

      if (wallpaperId && !isPlaceholder(wallpaperId)) {
        appEvents.emit("downloadsChanged", {
          wallpaperId,
          downloadCount: nextDownloadCount,
          wallpaper: updatedWallpaper,
        });
      }

      setStatus("done");
      setSavedPopupVisible(true);
    } catch (error: any) {
      console.log("Download failed:", error?.response?.data || error);

      setStatus("idle");

      Alert.alert("Download failed", "Something went wrong while downloading.");
    }
  };

  const onAddFavorite = async () => {
    if (favoriteLoading) return;

    if (isPlaceholder(wallpaperId)) {
      Alert.alert(
        "Unavailable",
        "This placeholder wallpaper cannot be added to favorites.",
      );
      return;
    }

    const previousIsFavorite = isFavorite;
    const previousFavoriteCount = favoriteCount;
    const nextOptimisticFavorite = !previousIsFavorite;
    const nextOptimisticCount = Math.max(
      0,
      previousFavoriteCount + (nextOptimisticFavorite ? 1 : -1),
    );

    const optimisticWallpaper = {
      ...wallpaper,
      isFavorite: nextOptimisticFavorite,
      is_favorite: nextOptimisticFavorite,
      favoriteCount: nextOptimisticCount,
      favorite_count: nextOptimisticCount,
      favoritesCount: nextOptimisticCount,
    };

    try {
      setFavoriteLoading(true);
      setIsFavorite(nextOptimisticFavorite);
      setFavoriteCount(nextOptimisticCount);
      setWallpaper(optimisticWallpaper);

      appEvents.emit("favoritesChanged", {
        wallpaperId,
        isFavorite: nextOptimisticFavorite,
        favoriteCount: nextOptimisticCount,
        wallpaper: optimisticWallpaper,
      });

      const response = await toggleFavorite(wallpaperId);
      const data = unwrapApiData(response);

      const nextIsFavorite = Boolean(
        data?.isFavorite ?? data?.favorite ?? nextOptimisticFavorite,
      );

      const nextFavoriteCount = getFavoriteCountFromPayload(
        data,
        nextOptimisticCount,
      );

      const confirmedWallpaper = {
        ...optimisticWallpaper,
        isFavorite: nextIsFavorite,
        is_favorite: nextIsFavorite,
        favoriteCount: nextFavoriteCount,
        favorite_count: nextFavoriteCount,
        favoritesCount: nextFavoriteCount,
      };

      setIsFavorite(nextIsFavorite);
      setFavoriteCount(nextFavoriteCount);
      setWallpaper(confirmedWallpaper);

      appEvents.emit("favoritesChanged", {
        wallpaperId,
        isFavorite: nextIsFavorite,
        favoriteCount: nextFavoriteCount,
        wallpaper: confirmedWallpaper,
      });
    } catch (error: any) {
      console.log("Favorite toggle failed:", error?.response?.data || error);

      const rollbackWallpaper = {
        ...wallpaper,
        isFavorite: previousIsFavorite,
        is_favorite: previousIsFavorite,
        favoriteCount: previousFavoriteCount,
        favorite_count: previousFavoriteCount,
        favoritesCount: previousFavoriteCount,
      };

      setIsFavorite(previousIsFavorite);
      setFavoriteCount(previousFavoriteCount);
      setWallpaper(rollbackWallpaper);

      appEvents.emit("favoritesChanged", {
        wallpaperId,
        isFavorite: previousIsFavorite,
        favoriteCount: previousFavoriteCount,
        wallpaper: rollbackWallpaper,
      });

      if (getApiErrorStatus(error) === 401) {
        await clearSavedToken();

        Alert.alert(
          "Session expired",
          "Please login again to add wallpapers to favorites.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("MainTabs", {
                  screen: "Profile",
                });
              },
            },
          ],
          { cancelable: false },
        );

        return;
      }

      Alert.alert(
        "Failed",
        getApiErrorMessage(error) ||
          "Could not update this wallpaper favorite.",
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  const openImageApplySheet = () => {
    setApplySheetVisible(true);
  };

  const onApplyWallpaper = async (target: WallpaperApplyTarget) => {
    if (isVideo) {
      const liveWallpaperUrl =
        videoUrl ||
        getWallpaperVideoUrl(wallpaper) ||
        getWallpaperDownloadUrl(wallpaper);

      const previewImage = finalImage || getWallpaperPreviewImage(wallpaper);

      if (!liveWallpaperUrl) {
        Alert.alert("Missing video", "Video wallpaper URL is missing.");
        return;
      }

      if (!previewImage) {
        Alert.alert(
          "Missing preview",
          "Video wallpaper preview image is missing.",
        );
        return;
      }

      setApplySheetVisible(false);

      navigation.navigate("WallpaperCropPreview", {
        imageUrl: previewImage,
        videoUrl: liveWallpaperUrl,
        mediaType: "VIDEO",
        isVideo: true,
        target,
        title: wallpaper?.title || "FlexiWalls Video Wallpaper",
        videoWidth: getWallpaperSourceWidth(wallpaper),
        videoHeight: getWallpaperSourceHeight(wallpaper),
      });

      return;
    }

    if (!finalImage) {
      Alert.alert("Missing wallpaper", "Wallpaper image URL is missing.");
      return;
    }

    setApplySheetVisible(false);

    navigation.navigate("WallpaperCropPreview", {
      imageUrl: finalImage,
      mediaType: "IMAGE",
      isVideo: false,
      target,
      title: wallpaper?.title || "FlexiWalls Wallpaper",
    });
  };

  const expansionDistance = Math.max(1, safeAreaHeight - previewSize.height);

  const collapseExpandedPreview = () => {
    setIsPreviewFullscreen(false);

    Animated.parallel([
      Animated.spring(expandProgress, {
        toValue: 0,
        speed: 20,
        bounciness: 0,
        useNativeDriver: false,
      }),
      Animated.timing(overlayFade, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setExpandOverlayVisible(false);
    });
  };

  const previewHandlePanResponder = useMemo(
    () =>
      PanResponder.create({
        // The handle owns the gesture immediately, so one finger is enough.
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: () => {
          if (previewSize.height <= 0 || safeAreaHeight <= 0) return;

          setExpandOverlayVisible(true);
          setIsPreviewFullscreen(false);

          expandProgress.stopAnimation(() => {
            expandProgress.setValue(0);
          });

          overlayFade.stopAnimation(() => {
            overlayFade.setValue(0);

            requestAnimationFrame(() => {
              Animated.timing(overlayFade, {
                toValue: 1,
                duration: 240,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: false,
              }).start();
            });
          });
        },
        onPanResponderMove: (_event, gestureState) => {
          const nextProgress = clamp(
            Math.max(0, gestureState.dy) / expansionDistance,
            0,
            1,
          );

          expandProgress.setValue(nextProgress);
        },
        onPanResponderRelease: (_event, gestureState) => {
          const shouldOpen =
            gestureState.dy > Math.min(100, expansionDistance * 0.3) ||
            gestureState.vy > 0.65;

          Animated.parallel([
            Animated.spring(expandProgress, {
              toValue: shouldOpen ? 1 : 0,
              speed: shouldOpen ? 18 : 22,
              bounciness: 0,
              useNativeDriver: false,
            }),
            Animated.timing(overlayFade, {
              toValue: shouldOpen ? 1 : 0,
              duration: shouldOpen ? 180 : 240,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: false,
            }),
          ]).start(({ finished }) => {
            if (!finished) return;

            if (shouldOpen) {
              setIsPreviewFullscreen(true);
            } else {
              setExpandOverlayVisible(false);
            }
          });
        },
        onPanResponderTerminate: () => {
          Animated.parallel([
            Animated.spring(expandProgress, {
              toValue: 0,
              speed: 22,
              bounciness: 0,
              useNativeDriver: false,
            }),
            Animated.timing(overlayFade, {
              toValue: 0,
              duration: 240,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: false,
            }),
          ]).start(() => {
            setExpandOverlayVisible(false);
          });
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [
      expandProgress,
      expansionDistance,
      overlayFade,
      previewSize.height,
      safeAreaHeight,
    ],
  );

  const expandedPreviewHeight = expandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      previewSize.height,
      Math.max(previewSize.height, safeAreaHeight),
    ],
    extrapolate: "clamp",
  });

  const expandedPreviewRadius = expandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.root}>
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
        onLayout={(event) => {
          setSafeAreaHeight(event.nativeEvent.layout.height);
        }}
      >
        <View
          style={styles.wallpaperPreviewContainer}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;

            setPreviewSize((current) => {
              if (current.width === width && current.height === height) {
                return current;
              }

              return { width, height };
            });
          }}
        >
          <MediaPreview
            isVideo={isVideo}
            videoUrl={videoUrl}
            imageUrl={finalImage}
            style={styles.wallpaperPreview}
            imageStyle={styles.wallpaperImage}
            onImageError={() => setImageFailed(true)}
            sourceWidth={getWallpaperSourceWidth(wallpaper)}
            sourceHeight={getWallpaperSourceHeight(wallpaper)}
          >
            <LinearGradient
              colors={[
                "rgba(0,0,0,0.24)",
                "rgba(0,0,0,0.02)",
                "rgba(0,0,0,0.16)",
              ]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {isVideo ? (
              <BlurView intensity={30} tint="dark" style={styles.videoBadge}>
                <Ionicons
                  name="videocam-outline"
                  size={16}
                  color={colors.textPrimary}
                />

                <Text style={styles.videoBadgeText}>Video Wallpaper</Text>
              </BlurView>
            ) : null}

            <View
              style={styles.previewDragHandleTouchArea}
              {...previewHandlePanResponder.panHandlers}
            >
              <BlurView
                intensity={36}
                tint="dark"
                style={styles.previewDragHandleSurface}
              >
                <View style={styles.previewDragHandleBar} />
              </BlurView>
            </View>
          </MediaPreview>
        </View>
        <View style={styles.detailsSection}>
          <BlurView intensity={52} tint="dark" style={styles.detailsPanel}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.15)",
                "rgba(255,255,255,0.055)",
                "rgba(0,0,0,0.40)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <LinearGradient
              colors={[
                "rgba(96,165,250,0.16)",
                "rgba(168,85,247,0.10)",
                "rgba(236,72,153,0.08)",
                "rgba(0,0,0,0)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <Text style={styles.title} numberOfLines={2}>
              {wallpaper?.title || "FlexiWalls Wallpaper"}
            </Text>

            <View style={styles.infoRow}>
              <InfoPill
                icon={isVideo ? "videocam-outline" : "image-outline"}
                text={getCategoryName(wallpaper)}
              />

              <InfoPill icon="crop-outline" text={getDimensions(wallpaper)} />

              <InfoPill
                icon="download-outline"
                text={formatCount(getDownloads(wallpaper))}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.actionRow}>
              <Pressable
                onPress={onDownload}
                disabled={status === "downloading"}
                style={({ pressed }) => [
                  styles.downloadButtonWrap,
                  {
                    opacity: status === "downloading" ? 0.85 : 1,
                    transform: [
                      {
                        scale: pressed && status !== "downloading" ? 0.98 : 1,
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={DOWNLOAD_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.downloadButton}
                >
                  {status === "downloading" ? (
                    <>
                      <ActivityIndicator color={colors.textPrimary} />

                      <Text style={styles.downloadText}>Downloading...</Text>
                    </>
                  ) : status === "done" ? (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={21}
                        color={colors.textPrimary}
                      />

                      <Text style={styles.downloadText}>Saved</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="download-outline"
                        size={21}
                        color={colors.textPrimary}
                      />

                      <Text style={styles.downloadText}>Download</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (isVideo) {
                    onApplyWallpaper("lock");
                    return;
                  }

                  openImageApplySheet();
                }}
                style={({ pressed }) => [
                  styles.applyButtonWrap,
                  {
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <LinearGradient
                  colors={APPLY_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.applyButton}
                >
                  <ApplyButtonIcon />

                  <Text style={styles.applyButtonText}>Apply</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={onAddFavorite}
                disabled={favoriteLoading}
                style={({ pressed }) => [
                  styles.favoriteIconButtonWrap,
                  {
                    opacity: favoriteLoading ? 0.75 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <BlurView
                  intensity={24}
                  tint="dark"
                  style={styles.favoriteIconButton}
                >
                  {favoriteLoading ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={25}
                      color={isFavorite ? colors.heart : colors.textPrimary}
                    />
                  )}
                </BlurView>
              </Pressable>
            </View>
          </BlurView>
        </View>

        {previewSize.height > 0 &&
        (!isVideo || expandOverlayVisible || isPreviewFullscreen) ? (
          <Animated.View
            pointerEvents={isPreviewFullscreen ? "auto" : "none"}
            accessibilityLabel={
              isPreviewFullscreen
                ? "Fullscreen wallpaper preview"
                : "Expanding wallpaper preview"
            }
            style={[
              styles.expandedPreviewOverlay,
              {
                height: expandedPreviewHeight,
                opacity: overlayFade,
                borderBottomLeftRadius: expandedPreviewRadius,
                borderBottomRightRadius: expandedPreviewRadius,
              },
            ]}
          >
            <MediaPreview
              isVideo={isVideo}
              videoUrl={videoUrl}
              imageUrl={finalImage}
              style={styles.expandedWallpaperPreview}
              imageStyle={styles.expandedWallpaperImage}
              onImageError={() => setImageFailed(true)}
              sourceWidth={getWallpaperSourceWidth(wallpaper)}
              sourceHeight={getWallpaperSourceHeight(wallpaper)}
            >
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.24)",
                  "rgba(0,0,0,0.02)",
                  "rgba(0,0,0,0.16)",
                ]}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {isVideo ? (
                <BlurView intensity={30} tint="dark" style={styles.videoBadge}>
                  <Ionicons
                    name="videocam-outline"
                    size={16}
                    color={colors.textPrimary}
                  />

                  <Text style={styles.videoBadgeText}>Video Wallpaper</Text>
                </BlurView>
              ) : null}
            </MediaPreview>

          </Animated.View>
        ) : null}

        <View
          style={[
            styles.fixedBackButtonContainer,
            { top: insets.top + spacing.md },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => {
              if (expandOverlayVisible || isPreviewFullscreen) {
                collapseExpandedPreview();
                return;
              }

              navigation.goBack();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.topIconButtonWrap,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <BlurView intensity={30} tint="dark" style={styles.topIconButton}>
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.textPrimary}
              />
            </BlurView>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal
        visible={applySheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setApplySheetVisible(false)}
      >
        <View style={styles.applyOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setApplySheetVisible(false)}
          />

          <BlurView intensity={52} tint="dark" style={styles.applySheet}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.16)",
                "rgba(255,255,255,0.06)",
                "rgba(0,0,0,0.36)",
              ]}
              style={StyleSheet.absoluteFill}
            />

            <Text style={styles.applyTitle}>Apply Wallpaper</Text>

            <Text style={styles.applySubtitle}>
              Choose where you want to apply this wallpaper.
            </Text>

            <Pressable
              onPress={() => onApplyWallpaper("home")}
              style={({ pressed }) => [
                styles.applyOption,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name="home-outline"
                size={22}
                color={colors.textPrimary}
              />

              <Text style={styles.applyOptionText}>Home Screen</Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>

            <Pressable
              onPress={() => onApplyWallpaper("lock")}
              style={({ pressed }) => [
                styles.applyOption,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={colors.textPrimary}
              />

              <Text style={styles.applyOptionText}>Lock Screen</Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>

            <Pressable
              onPress={() => onApplyWallpaper("both")}
              style={({ pressed }) => [
                styles.applyOption,
                styles.applyOptionLast,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name="phone-portrait"
                size={22}
                color={colors.textPrimary}
              />

              <Text style={styles.applyOptionText}>Both</Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          </BlurView>
        </View>
      </Modal>

      <Modal
        visible={appliedPopupVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAppliedPopup}
      >
        <View style={styles.savedOverlay}>
          <BlurView
            intensity={34}
            tint="dark"
            style={styles.savedBackdrop}
            pointerEvents="none"
          />

          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeAppliedPopup}
          />

          <View style={styles.savedCardBorder}>
            <BlurView intensity={48} tint="dark" style={styles.savedCard}>
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.14)",
                  "rgba(255,255,255,0.055)",
                  "rgba(15,15,16,0.92)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <LinearGradient
                colors={[
                  "rgba(59,130,246,0.18)",
                  "rgba(139,92,246,0.12)",
                  "rgba(20,184,166,0.10)",
                  "rgba(0,0,0,0)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.savedIconRing}>
                <LinearGradient
                  colors={APPLY_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.savedIconCircle}
                >
                  <Ionicons
                    name="checkmark"
                    size={34}
                    color={colors.textPrimary}
                  />
                </LinearGradient>
              </View>

              <Text style={styles.appliedTitle}>
                Wallpaper Applied Successfully
              </Text>

              <Pressable
                onPress={closeAppliedPopup}
                style={({ pressed }) => [
                  styles.doneButtonWrap,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={APPLY_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </LinearGradient>
              </Pressable>
            </BlurView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={savedPopupVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSavedPopup}
      >
        <View style={styles.savedOverlay}>
          <BlurView
            intensity={34}
            tint="dark"
            style={styles.savedBackdrop}
            pointerEvents="none"
          />

          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeSavedPopup}
          />

          <View style={styles.savedCardBorder}>
            <BlurView intensity={48} tint="dark" style={styles.savedCard}>
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.14)",
                  "rgba(255,255,255,0.055)",
                  "rgba(15,15,16,0.92)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <LinearGradient
                colors={[
                  "rgba(59,130,246,0.18)",
                  "rgba(139,92,246,0.12)",
                  "rgba(236,72,153,0.08)",
                  "rgba(0,0,0,0)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.savedIconRing}>
                <LinearGradient
                  colors={POPUP_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.savedIconCircle}
                >
                  <Ionicons
                    name="checkmark"
                    size={34}
                    color={colors.textPrimary}
                  />
                </LinearGradient>
              </View>

              <Text style={styles.savedTitle}>Saved</Text>

              <Text style={styles.savedSubtitle}>
                {isVideo
                  ? "Video wallpaper saved to your gallery"
                  : "Wallpaper saved to your gallery"}
              </Text>

              <Pressable
                onPress={closeSavedPopup}
                style={({ pressed }) => [
                  styles.doneButtonWrap,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={POPUP_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </LinearGradient>
              </Pressable>
            </BlurView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WallpaperDetailsScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.base,
  },

  wallpaperPreviewContainer: {
    flex: 1,
    position: "relative",
  },

  wallpaperPreview: {
    flex: 1,
    backgroundColor: colors.baseElevated,
  },

  wallpaperImage: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  pannableImageClip: {
    overflow: "hidden",
  },

  pannableImage: {
    position: "absolute",
  },

  previewDragHandleTouchArea: {
    position: "absolute",
    left: "50%",
    bottom: 5,
    width: 72,
    height: 34,
    marginLeft: -36,
    zIndex: 30,
    elevation: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  previewDragHandleSurface: {
    width: 56,
    height: 22,
    borderRadius: 11,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.30)",
    backgroundColor: "rgba(5,8,18,0.34)",
  },

  previewDragHandleBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.88)",
  },

  expandedPreviewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    zIndex: 100,
    elevation: 100,
    backgroundColor: colors.baseElevated,
  },

  expandedWallpaperPreview: {
    flex: 1,
    backgroundColor: colors.baseElevated,
  },

  fixedBackButtonContainer: {
    position: "absolute",
    left: spacing.xl,
    zIndex: 140,
    elevation: 140,
  },

  expandedWallpaperImage: {
    overflow: "hidden",
  },

  videoPreviewWrap: {
    overflow: "hidden",
  },

  videoBadge: {
    position: "absolute",
    left: spacing.xl,
    bottom: spacing.xl,
    minHeight: 38,
    borderRadius: radius.pill,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.20)",
    backgroundColor: "rgba(5, 8, 18, 0.42)",
  },

  videoBadgeText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  topBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  topIconButtonWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },

  topIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },

  detailsSection: {
    backgroundColor: colors.base,
    paddingTop: spacing.md,
  },

  detailsPanel: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(5, 8, 18, 0.82)",
  },

  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },

  infoRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.lg,
  },

  infoPill: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.pill,
    overflow: "hidden",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  infoPillText: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: spacing.xl,
  },

  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },

  downloadButtonWrap: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 9,
  },

  downloadButton: {
    width: "100%",
    height: 52,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  downloadText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 18,
  },

  applyButtonWrap: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#14B8A6",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 9,
  },

  applyButton: {
    width: "100%",
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  applyButtonText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 0,
  },

  applyIconFrame: {
    width: 22,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 0,
  },

  favoriteIconButtonWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
  },

  favoriteIconButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: "rgba(5, 8, 18, 0.18)",
  },

  applyOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },

  applySheet: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: 30,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(6, 8, 20, 0.86)",
  },

  applyTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 24,
    lineHeight: 30,
  },

  applySubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    marginBottom: spacing.lg,
  },

  applyOption: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.14)",
  },

  applyOptionLast: {
    borderBottomWidth: 0,
  },

  applyOptionText: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },

  savedOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  savedBackdrop: {
    ...StyleSheet.absoluteFill,
  },

  savedCardBorder: {
    width: "100%",
    maxWidth: 292,
    borderRadius: 28,
    padding: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.20)",
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.24,
    shadowRadius: 26,
    elevation: 16,
  },

  savedCard: {
    borderRadius: 27,
    overflow: "hidden",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 26,
    paddingBottom: spacing.lg,
    backgroundColor: "rgba(15, 15, 16, 0.88)",
  },

  savedIconRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
  },

  savedIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },

  savedTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    textAlign: "center",
  },

  savedSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    textAlign: "center",
  },

  appliedTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.4,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
  },

  doneButtonWrap: {
    width: "100%",
    borderRadius: radius.pill,
    overflow: "hidden",
    marginTop: spacing.lg,
  },

  doneButton: {
    height: 46,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.32)",
  },

  doneButtonText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 20,
  },
});