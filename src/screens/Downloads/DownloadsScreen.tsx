import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

import MeshBackground from "../../components/MeshBackground";
import Card from "../../components/Card";
import { colors, gradients } from "../../styles/colors";
import { fontFamily } from "../../styles/typography";
import { spacing, radius } from "../../utils/constants";
import { RootStackParamList } from "../../navigation/RootStackParamList";
import { useAuth } from "../../context/AuthContext";
import { getDownloads } from "../../services/downloadService";
import API from "../../services/api";
import { Wallpaper } from "../../services/types";
import { appEvents } from "../../utils/appEvents";

type Props = NativeStackScreenProps<RootStackParamList, "Downloads">;

type DownloadWallpaper = Omit<Wallpaper, "category"> & {
  category?: Wallpaper["category"] | null;
  downloadedAt?: string | Date | null;
  downloadCount?: number;
  isPremium?: boolean;
  resolution?: string | null;
};

type Filter = "All" | "4K" | "Live" | "Premium";

const FILTERS: Filter[] = ["All", "4K", "Live", "Premium"];
const API_ORIGIN = String(API.defaults.baseURL || "").replace(/\/api\/?$/, "");
const LOCAL_DOWNLOADS_KEY = "@flexiwalls:guestDownloads";
const LOCAL_DELETED_DOWNLOADS_KEY = "@flexiwalls:locallyDeletedDownloads";

const fallbackImage = (seed: string) =>
  `https://picsum.photos/seed/flexiwalls-download-${seed}/700/1100`;

const toAbsoluteMediaUrl = (value?: string | null) => {
  if (!value) return undefined;

  const url = String(value).trim();

  if (!url) return undefined;

  if (/^(file|content|asset-library):\/\//i.test(url)) {
    return url;
  }

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

const getVariantUrl = (item: any, preferredTypes: string[]) => {
  const variants = Array.isArray(item?.wallpaperVariants)
    ? item.wallpaperVariants
    : Array.isArray(item?.variants)
      ? item.variants
      : [];

  for (const type of preferredTypes) {
    const found = variants.find(
      (variant: any) =>
        String(variant?.type || "").toUpperCase() === type.toUpperCase(),
    );

    const url =
      found?.url ||
      found?.path ||
      found?.imageUrl ||
      found?.image_url ||
      found?.thumbnailUrl ||
      found?.thumbnail_url ||
      found?.fileUrl ||
      found?.file_url;

    if (url) return url;
  }

  const defaultVariant = variants.find((variant: any) => variant?.isDefault);

  return (
    defaultVariant?.url ||
    defaultVariant?.path ||
    defaultVariant?.imageUrl ||
    defaultVariant?.image_url ||
    defaultVariant?.thumbnailUrl ||
    defaultVariant?.thumbnail_url ||
    defaultVariant?.fileUrl ||
    defaultVariant?.file_url
  );
};

const getRawThumbnailUrl = (item: any) =>
  item?.thumbnailUrl ||
  item?.thumbnail_url ||
  item?.thumbnailPath ||
  item?.thumbnail_path ||
  item?.thumbUrl ||
  item?.thumb_url ||
  item?.thumbnail ||
  item?.displayUrl ||
  item?.display_url ||
  item?.displayPath ||
  item?.display_path ||
  getVariantUrl(item, ["THUMBNAIL", "DISPLAY", "ORIGINAL"]) ||
  item?.imageUrl ||
  item?.image_url ||
  item?.downloadUrl ||
  item?.download_url;

const getRawImageUrl = (item: any) =>
  item?.imageUrl ||
  item?.image_url ||
  item?.downloadUrl ||
  item?.download_url ||
  item?.displayUrl ||
  item?.display_url ||
  item?.displayPath ||
  item?.display_path ||
  item?.url ||
  item?.image ||
  item?.photoUrl ||
  item?.photo_url ||
  item?.mediaUrl ||
  item?.media_url ||
  item?.originalUrl ||
  item?.original_url ||
  item?.originalPath ||
  item?.original_path ||
  getVariantUrl(item, ["DISPLAY", "ORIGINAL", "THUMBNAIL"]);

const getWallpaperImage = (item?: DownloadWallpaper | null) => {
  if (!item) return undefined;

  const record = item as DownloadWallpaper & Record<string, any>;

  return (
    toAbsoluteMediaUrl(getRawThumbnailUrl(record)) ||
    toAbsoluteMediaUrl(getRawImageUrl(record))
  );
};

const getPayloadArray = (response: any): any[] => {
  const payload = response?.data?.data ?? response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.downloads)) return payload.downloads;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;

  return [];
};

const normalizeDownload = (record: any): DownloadWallpaper | null => {
  const wallpaper = record?.wallpaper ?? record?.Wallpaper ?? record;

  if (!wallpaper || typeof wallpaper !== "object") {
    return null;
  }

  const merged = {
    ...(typeof wallpaper === "object" ? wallpaper : {}),
    ...(typeof record === "object" ? record : {}),
  };

  const id =
    wallpaper.id ??
    wallpaper._id ??
    record?.wallpaperId ??
    record?.wallpaper_id ??
    record?.id;

  const rawImageUrl = getRawImageUrl(merged) || getRawImageUrl(wallpaper);
  const rawThumbnailUrl =
    getRawThumbnailUrl(merged) ||
    getRawThumbnailUrl(wallpaper) ||
    rawImageUrl;

  const imageUrl = toAbsoluteMediaUrl(rawImageUrl);
  const thumbnailUrl = toAbsoluteMediaUrl(rawThumbnailUrl) || imageUrl;

  if (!id && !imageUrl && !thumbnailUrl) {
    return null;
  }

  const finalId = String(id ?? imageUrl ?? thumbnailUrl);

  return {
    ...merged,
    id: finalId,
    wallpaperId: finalId,
    title:
      merged.title ??
      wallpaper.title ??
      wallpaper.name ??
      "Downloaded Wallpaper",
    imageUrl,
    thumbnailUrl,
    quality: merged.quality ?? wallpaper.quality ?? wallpaper.type ?? "4K",
    category: merged.category ?? wallpaper.category ?? record?.category ?? null,
    downloadedAt:
      merged.downloadedAt ??
      record?.downloadedAt ??
      record?.createdAt ??
      record?.created_at ??
      wallpaper.downloadedAt ??
      wallpaper.createdAt ??
      null,
    isPremium: Boolean(
      merged.isPremium ?? wallpaper.isPremium ?? wallpaper.premium ?? false,
    ),
    resolution:
      merged.resolution ?? wallpaper.resolution ?? wallpaper.dimensions ?? null,

    localUri: merged.localUri ?? merged.local_uri ?? null,
    local_uri: merged.local_uri ?? merged.localUri ?? null,
    fileUri: merged.fileUri ?? merged.file_uri ?? null,
    file_uri: merged.file_uri ?? merged.fileUri ?? null,
    savedUri: merged.savedUri ?? merged.saved_uri ?? null,
    saved_uri: merged.saved_uri ?? merged.savedUri ?? null,
    assetId: merged.assetId ?? merged.asset_id ?? null,
    asset_id: merged.asset_id ?? merged.assetId ?? null,
    mediaAssetId: merged.mediaAssetId ?? merged.media_asset_id ?? null,
    media_asset_id: merged.media_asset_id ?? merged.mediaAssetId ?? null,
    mediaLibraryAssetId:
      merged.mediaLibraryAssetId ?? merged.media_library_asset_id ?? null,
    media_library_asset_id:
      merged.media_library_asset_id ?? merged.mediaLibraryAssetId ?? null,
    galleryAssetId: merged.galleryAssetId ?? merged.gallery_asset_id ?? null,
    gallery_asset_id: merged.gallery_asset_id ?? merged.galleryAssetId ?? null,

    downloadCount:
      merged.downloadCount ??
      merged.download_count ??
      wallpaper.downloadCount ??
      wallpaper.download_count ??
      wallpaper.downloads ??
      wallpaper.totalDownloads ??
      wallpaper.total_downloads ??
      record?.downloadCount ??
      record?.download_count ??
      record?.downloads ??
      record?.totalDownloads ??
      record?.total_downloads ??
      0,
  };
};

const parseTime = (value?: string | Date | null) => {
  if (!value) return 0;

  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? "").replace(/[^\d]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
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

const getDownloadCount = (item?: DownloadWallpaper | null) => {
  if (!item) return 0;

  const record = item as DownloadWallpaper & Record<string, any>;

  return Math.max(
    toNumber(record.downloadCount),
    toNumber(record.download_count),
    toNumber(record.downloads),
    toNumber(record.totalDownloads),
    toNumber(record.total_downloads),
    toNumber(record._count?.downloads),
  );
};

const getDownloadEventId = (
  item?: DownloadWallpaper | Record<string, any> | null,
) => {
  if (!item) return "";

  const record = item as DownloadWallpaper & Record<string, any>;

  return String(
    record.id ||
      record._id ||
      record.wallpaperId ||
      record.wallpaper_id ||
      record.uuid ||
      "",
  );
};

const mergeDownloadRecords = (
  current: DownloadWallpaper,
  incoming: DownloadWallpaper,
) => {
  const currentRecord = current as DownloadWallpaper & Record<string, any>;
  const incomingRecord = incoming as DownloadWallpaper & Record<string, any>;

  return {
    ...currentRecord,
    ...incomingRecord,

    localUri:
      incomingRecord.localUri ||
      incomingRecord.local_uri ||
      currentRecord.localUri ||
      currentRecord.local_uri ||
      null,
    local_uri:
      incomingRecord.local_uri ||
      incomingRecord.localUri ||
      currentRecord.local_uri ||
      currentRecord.localUri ||
      null,

    fileUri:
      incomingRecord.fileUri ||
      incomingRecord.file_uri ||
      currentRecord.fileUri ||
      currentRecord.file_uri ||
      null,
    file_uri:
      incomingRecord.file_uri ||
      incomingRecord.fileUri ||
      currentRecord.file_uri ||
      currentRecord.fileUri ||
      null,

    savedUri:
      incomingRecord.savedUri ||
      incomingRecord.saved_uri ||
      currentRecord.savedUri ||
      currentRecord.saved_uri ||
      null,
    saved_uri:
      incomingRecord.saved_uri ||
      incomingRecord.savedUri ||
      currentRecord.saved_uri ||
      currentRecord.savedUri ||
      null,

    assetId:
      incomingRecord.assetId ||
      incomingRecord.asset_id ||
      currentRecord.assetId ||
      currentRecord.asset_id ||
      null,
    asset_id:
      incomingRecord.asset_id ||
      incomingRecord.assetId ||
      currentRecord.asset_id ||
      currentRecord.assetId ||
      null,

    mediaAssetId:
      incomingRecord.mediaAssetId ||
      incomingRecord.media_asset_id ||
      currentRecord.mediaAssetId ||
      currentRecord.media_asset_id ||
      null,
    media_asset_id:
      incomingRecord.media_asset_id ||
      incomingRecord.mediaAssetId ||
      currentRecord.media_asset_id ||
      currentRecord.mediaAssetId ||
      null,

    mediaLibraryAssetId:
      incomingRecord.mediaLibraryAssetId ||
      incomingRecord.media_library_asset_id ||
      currentRecord.mediaLibraryAssetId ||
      currentRecord.media_library_asset_id ||
      null,
    media_library_asset_id:
      incomingRecord.media_library_asset_id ||
      incomingRecord.mediaLibraryAssetId ||
      currentRecord.media_library_asset_id ||
      currentRecord.mediaLibraryAssetId ||
      null,

    galleryAssetId:
      incomingRecord.galleryAssetId ||
      incomingRecord.gallery_asset_id ||
      currentRecord.galleryAssetId ||
      currentRecord.gallery_asset_id ||
      null,
    gallery_asset_id:
      incomingRecord.gallery_asset_id ||
      incomingRecord.galleryAssetId ||
      currentRecord.gallery_asset_id ||
      currentRecord.galleryAssetId ||
      null,

    downloadedAt:
      parseTime(incomingRecord.downloadedAt) >=
      parseTime(currentRecord.downloadedAt)
        ? incomingRecord.downloadedAt
        : currentRecord.downloadedAt,
  } as DownloadWallpaper;
};

const uniqueById = (items: DownloadWallpaper[]) => {
  const map = new Map<string, DownloadWallpaper>();

  items.forEach((item) => {
    const id = getDownloadEventId(item) || item.id;

    if (!id) return;

    const existing = map.get(id);

    if (!existing) {
      map.set(id, item);
      return;
    }

    map.set(id, mergeDownloadRecords(existing, item));
  });

  return Array.from(map.values());
};

const sortDownloads = (items: DownloadWallpaper[]) =>
  uniqueById(items).sort(
    (a, b) => parseTime(b.downloadedAt) - parseTime(a.downloadedAt),
  );

const getLocalDownloads = async (): Promise<DownloadWallpaper[]> => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_DOWNLOADS_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeDownload).filter(Boolean) as DownloadWallpaper[];
  } catch (error) {
    console.log("LOCAL DOWNLOADS LOAD ERROR", error);
    return [];
  }
};

const getLocallyDeletedDownloadIds = async (): Promise<Set<string>> => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_DELETED_DOWNLOADS_KEY);

    if (!raw) return new Set();

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return new Set();

    return new Set(
      parsed
        .map((value) => String(value || "").trim())
        .filter((value) => Boolean(value)),
    );
  } catch (error) {
    console.log("LOCAL DELETED DOWNLOAD IDS LOAD ERROR", error);
    return new Set();
  }
};

const saveLocallyDeletedDownloadIds = async (ids: Set<string>) => {
  try {
    const values = Array.from(ids).filter(Boolean);

    if (values.length === 0) {
      await AsyncStorage.removeItem(LOCAL_DELETED_DOWNLOADS_KEY);
      return;
    }

    await AsyncStorage.setItem(
      LOCAL_DELETED_DOWNLOADS_KEY,
      JSON.stringify(values),
    );
  } catch (error) {
    console.log("LOCAL DELETED DOWNLOAD IDS SAVE ERROR", error);
  }
};

const addLocallyDeletedDownloadIds = async (ids: Set<string>) => {
  const current = await getLocallyDeletedDownloadIds();

  ids.forEach((id) => {
    if (id) {
      current.add(id);
    }
  });

  await saveLocallyDeletedDownloadIds(current);
};

const removeLocallyDeletedDownloadIds = async (ids: Set<string>) => {
  const current = await getLocallyDeletedDownloadIds();

  ids.forEach((id) => {
    if (id) {
      current.delete(id);
    }
  });

  await saveLocallyDeletedDownloadIds(current);
};

const filterOutLocallyDeletedDownloads = (
  items: DownloadWallpaper[],
  locallyDeletedIds: Set<string>,
) => {
  if (locallyDeletedIds.size === 0) return items;

  return items.filter((item) => {
    const id = getDownloadEventId(item);

    return !id || !locallyDeletedIds.has(id);
  });
};

const createDownloadFromEvent = (payload: {
  wallpaperId: string;
  downloadCount?: number;
  wallpaper?: any;
}) => {
  const downloadedAt = new Date().toISOString();

  const normalized = normalizeDownload({
    ...(payload.wallpaper || {}),
    id: payload.wallpaperId || payload.wallpaper?.id,
    wallpaperId: payload.wallpaperId,
    downloadedAt,
    createdAt: downloadedAt,
    downloadCount:
      payload.downloadCount ??
      payload.wallpaper?.downloadCount ??
      payload.wallpaper?.download_count ??
      payload.wallpaper?.downloads,
  });

  if (!normalized) return null;

  return {
    ...normalized,
    id: String(payload.wallpaperId || normalized.id),
    wallpaperId: String(payload.wallpaperId || normalized.id),
    downloadedAt,
    downloadCount: payload.downloadCount ?? getDownloadCount(normalized),
    download_count: payload.downloadCount ?? getDownloadCount(normalized),
    downloads: payload.downloadCount ?? getDownloadCount(normalized),
  } as DownloadWallpaper & Record<string, any>;
};

const patchDownloadedWallpaper = (
  item: DownloadWallpaper,
  patch: Record<string, any>,
) => {
  const nextDownloadCount = Math.max(
    toNumber(patch.downloadCount),
    toNumber(patch.download_count),
    toNumber(patch.downloads),
    getDownloadCount(item),
  );

  const normalized = normalizeDownload({
    ...item,
    ...patch,
    downloadCount: nextDownloadCount,
    download_count: nextDownloadCount,
    downloads: nextDownloadCount,
  });

  return normalized || item;
};

const getUniqueStrings = (values: unknown[]) => {
  const seen = new Set<string>();

  values.forEach((value) => {
    if (typeof value !== "string") return;

    const clean = value.trim();

    if (clean) {
      seen.add(clean);
    }
  });

  return Array.from(seen);
};

const getDeviceFileUris = (item: DownloadWallpaper) => {
  const record = item as DownloadWallpaper & Record<string, any>;

  return getUniqueStrings([
    record.localUri,
    record.local_uri,
    record.fileUri,
    record.file_uri,
    record.savedUri,
    record.saved_uri,
    record.deviceUri,
    record.device_uri,
    record.downloadedUri,
    record.downloaded_uri,
    record.localPath,
    record.local_path,
    record.filePath,
    record.file_path,
    record.path,
    record.uri,
    record.imageUri,
    record.image_uri,
    record.thumbnailUri,
    record.thumbnail_uri,
  ]).filter((uri) => /^file:\/\//i.test(uri));
};

const getMediaAssetIds = (item: DownloadWallpaper) => {
  const record = item as DownloadWallpaper & Record<string, any>;

  return getUniqueStrings([
    record.assetId,
    record.asset_id,
    record.localAssetId,
    record.local_asset_id,
    record.mediaAssetId,
    record.media_asset_id,
    record.mediaLibraryAssetId,
    record.media_library_asset_id,
    record.galleryAssetId,
    record.gallery_asset_id,
  ]);
};

const deleteDeviceFiles = async (items: DownloadWallpaper[]) => {
  const assetIds = getUniqueStrings(items.flatMap(getMediaAssetIds));

  console.log("DELETE_DEVICE_DEBUG_ASSETS", assetIds);

  if (assetIds.length > 0) {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (permission.granted) {
        await MediaLibrary.deleteAssetsAsync(assetIds);
      } else {
        console.log("MEDIA LIBRARY DELETE PERMISSION DENIED");
      }
    } catch (error) {
      console.log("MEDIA LIBRARY DELETE ERROR", error);
    }
  }

  const fileUris = getUniqueStrings(items.flatMap(getDeviceFileUris));

  console.log("DELETE_DEVICE_DEBUG_FILES", fileUris);

  await Promise.all(
    fileUris.map(async (uri) => {
      try {
        const info = await FileSystem.getInfoAsync(uri);

        if (info.exists) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      } catch (error) {
        console.log("DEVICE FILE DELETE ERROR", uri, error);
      }
    }),
  );
};

const removeLocalDownloadsByIds = async (ids: Set<string>) => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_DOWNLOADS_KEY);

    if (!raw) return;

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return;

    const next = parsed.filter((record) => {
      const normalized = normalizeDownload(record);
      const id = getDownloadEventId(normalized || record);

      return !ids.has(id);
    });

    if (next.length === 0) {
      await AsyncStorage.removeItem(LOCAL_DOWNLOADS_KEY);
      return;
    }

    await AsyncStorage.setItem(LOCAL_DOWNLOADS_KEY, JSON.stringify(next));
  } catch (error) {
    console.log("LOCAL DOWNLOADS DELETE ERROR", error);
  }
};

const DownloadsHeader = ({
  navigation,
  activeFilter,
  onFilterChange,
  selectionMode,
  selectedCount,
  hasDownloads,
  onDeletePress,
}: {
  navigation: Props["navigation"];
  activeFilter: Filter;
  onFilterChange: (filter: Filter) => void;
  selectionMode: boolean;
  selectedCount: number;
  hasDownloads: boolean;
  onDeletePress: () => void;
}) => {
  const subtitle = selectionMode
    ? selectedCount > 0
      ? `${selectedCount} selected`
      : "Select wallpapers to delete"
    : "Your saved wallpaper gallery";

  return (
    <View>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.roundAction,
            { opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <BlurView intensity={30} tint="dark" style={styles.roundBlur}>
            <Ionicons
              name="chevron-back"
              size={21}
              color={colors.textPrimary}
            />
          </BlurView>
        </Pressable>

        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>Downloads</Text>
          <Text style={styles.topSubtitle}>{subtitle}</Text>
        </View>

        <Pressable
          onPress={onDeletePress}
          disabled={!hasDownloads}
          hitSlop={8}
          style={({ pressed }) => [
            styles.roundAction,
            { opacity: !hasDownloads ? 0.35 : pressed ? 0.65 : 1 },
          ]}
        >
          <BlurView intensity={30} tint="dark" style={styles.roundBlur}>
            <Ionicons
              name={selectionMode ? "close" : "trash-outline"}
              size={20}
              color={selectionMode ? colors.textPrimary : colors.accent}
            />
          </BlurView>
        </Pressable>
      </View>

      <View style={styles.filterWrap}>
        <BlurView intensity={32} tint="dark" style={styles.filterBar}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() => onFilterChange(filter)}
                style={styles.filterItem}
              >
                {active ? (
                  <LinearGradient
                    colors={gradients.blueViolet}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.filterActive}
                  >
                    <Text style={styles.filterTextActive}>{filter}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.filterText}>{filter}</Text>
                )}
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
};

const DownloadsGrid = ({
  downloads,
  selectionMode,
  selectedIds,
  onOpenWallpaper,
  onToggleSelect,
}: {
  downloads: DownloadWallpaper[];
  selectionMode: boolean;
  selectedIds: Set<string>;
  onOpenWallpaper: (wallpaper: DownloadWallpaper) => void;
  onToggleSelect: (wallpaper: DownloadWallpaper) => void;
}) => {
  return (
    <View style={styles.downloadGrid}>
      {downloads.map((item) => {
        const image = getWallpaperImage(item) ?? fallbackImage(item.id);
        const downloadCount = getDownloadCount(item);
        const itemId = getDownloadEventId(item);
        const selected = selectedIds.has(itemId);

        return (
          <Pressable
            key={item.id}
            onPress={() =>
              selectionMode ? onToggleSelect(item) : onOpenWallpaper(item)
            }
            style={({ pressed }) => [
              styles.wallpaperButton,
              selectionMode && selected ? styles.wallpaperButtonSelected : null,
              {
                opacity: pressed ? 0.78 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <ImageBackground
              source={{ uri: image }}
              style={styles.wallpaperImage}
              imageStyle={styles.wallpaperImageStyle}
              resizeMode="cover"
            >
              <LinearGradient
                colors={[
                  "rgba(8,6,20,0.02)",
                  "rgba(8,6,20,0.08)",
                  "rgba(8,6,20,0.72)",
                ]}
                style={StyleSheet.absoluteFill}
              />

              <BlurView intensity={26} tint="dark" style={styles.qualityChip}>
                <Text style={styles.qualityText}>{item.quality || "HD"}</Text>
              </BlurView>

              {selectionMode ? (
                <View style={styles.selectionLayer}>
                  <View
                    style={[
                      styles.selectionCircle,
                      selected ? styles.selectionCircleActive : null,
                    ]}
                  >
                    {selected ? (
                      <Ionicons name="checkmark" size={17} color="#fff" />
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View style={styles.wallpaperMetaLayer}>
                <View style={styles.downloadPill}>
                  <Ionicons
                    name="download-outline"
                    size={13}
                    color={colors.textPrimary}
                  />

                  <Text style={styles.downloadPillText}>
                    {formatCount(downloadCount)}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </Pressable>
        );
      })}
    </View>
  );
};

const EmptyState = ({
  title,
  subtitle,
  onBrowse,
}: {
  title?: string;
  subtitle?: string;
  onBrowse: () => void;
}) => (
  <View style={styles.emptyWrap}>
    <Card style={styles.cardNoMargin} padding={20} strong>
      <View style={styles.emptyDownloads}>
        <Ionicons
          name="download-outline"
          size={55}
          color={colors.textSecondary}
        />

        <Text style={styles.emptyTitle}>{title ?? "No Downloads Yet"}</Text>

        <Text style={styles.emptySubtitle}>
          {subtitle ?? "Wallpapers you download will appear here."}
        </Text>

        <Pressable style={styles.browseButton} onPress={onBrowse}>
          <Text style={styles.browseText}>Browse Wallpapers</Text>
        </Pressable>
      </View>
    </Card>
  </View>
);

const DeleteBottomOverlay = ({
  selectedCount,
  onDelete,
}: {
  selectedCount: number;
  onDelete: () => void;
}) => {
  const disabled = selectedCount === 0;

  return (
    <SafeAreaView edges={["bottom"]} style={styles.deleteDock}>
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />

      <Pressable
        disabled={disabled}
        onPress={onDelete}
        style={({ pressed }) => [
          styles.deleteDeviceButton,
          disabled ? styles.deleteDeviceButtonDisabled : null,
          {
            transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
          },
        ]}
      >
        <Text style={styles.deleteDeviceText}>Delete from device</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default function DownloadsScreen({ navigation }: Props) {
  const { user } = useAuth();

  const [downloads, setDownloads] = useState<DownloadWallpaper[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const loadDownloads = useCallback(async () => {
    let localItems: DownloadWallpaper[] = [];
    let locallyDeletedIds = new Set<string>();

    try {
      localItems = await getLocalDownloads();
      locallyDeletedIds = await getLocallyDeletedDownloadIds();

      if (!user) {
        const sortedLocal = filterOutLocallyDeletedDownloads(
          sortDownloads(localItems),
          locallyDeletedIds,
        );

        setDownloads(sortedLocal);
        return;
      }

      const response = await getDownloads();

      const serverItems = getPayloadArray(response)
        .map(normalizeDownload)
        .filter(Boolean) as DownloadWallpaper[];

      const sorted = filterOutLocallyDeletedDownloads(
        sortDownloads([...serverItems, ...localItems]),
        locallyDeletedIds,
      );

      setDownloads(sorted);
    } catch (error) {
      console.log(
        "DOWNLOADS LOAD ERROR",
        (error as any)?.response?.data || (error as any)?.message || error,
      );

      const sortedLocal = filterOutLocallyDeletedDownloads(
        sortDownloads(localItems),
        locallyDeletedIds,
      );

      setDownloads(sortedLocal);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  useEffect(() => {
    const unsubscribeDownloads = appEvents.on("downloadsChanged", (payload) => {
      const nextDownload = createDownloadFromEvent(payload);

      if (!nextDownload) {
        loadDownloads();
        return;
      }

      const nextId = getDownloadEventId(nextDownload);

      if (nextId) {
        void removeLocallyDeletedDownloadIds(new Set([nextId]));
      }

      setDownloads((current) =>
        sortDownloads([
          nextDownload,
          ...current.filter((item) => getDownloadEventId(item) !== nextId),
        ]),
      );
    });

    const unsubscribeWallpaper = appEvents.on("wallpaperChanged", (payload) => {
      const wallpaperId = String(
        payload.wallpaperId || payload.wallpaper?.id || "",
      );

      if (!wallpaperId || !payload.wallpaper) {
        return;
      }

      setDownloads((current) =>
        current.map((item) => {
          if (getDownloadEventId(item) !== wallpaperId) {
            return item;
          }

          return patchDownloadedWallpaper(item, payload.wallpaper);
        }),
      );
    });

    const unsubscribeWallpapers = appEvents.on("wallpapersChanged", () => {
      loadDownloads();
    });

    return () => {
      unsubscribeDownloads();
      unsubscribeWallpaper();
      unsubscribeWallpapers();
    };
  }, [loadDownloads]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDownloads();
  }, [loadDownloads]);

  const filteredDownloads = useMemo(() => {
    if (activeFilter === "All") return downloads;

    if (activeFilter === "Premium") {
      return downloads.filter((item) => item.isPremium);
    }

    return downloads.filter((item) =>
      String(item.quality ?? "")
        .toUpperCase()
        .includes(activeFilter),
    );
  }, [activeFilter, downloads]);

  const handleFilterChange = useCallback((filter: Filter) => {
    setActiveFilter(filter);
    setSelectedIds(new Set());
  }, []);

  const openWallpaper = (wallpaper: DownloadWallpaper) => {
    navigation.navigate("WallpaperDetails", {
      wallpaper,
    });
  };

  const browseWallpapers = () => {
    navigation.navigate("MainTabs");
  };

  const toggleSelectionMode = useCallback(() => {
    if (!selectionMode && filteredDownloads.length === 0) return;

    setSelectionMode((current) => !current);
    setSelectedIds(new Set());
  }, [filteredDownloads.length, selectionMode]);

  const toggleWallpaperSelection = useCallback((wallpaper: DownloadWallpaper) => {
    const id = getDownloadEventId(wallpaper);

    if (!id) return;

    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const deleteSelectedWallpapers = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const idsToDelete = new Set(selectedIds);

    const selectedItems = downloads.filter((item) =>
      idsToDelete.has(getDownloadEventId(item)),
    );

    setDownloads((current) =>
      current.filter((item) => !idsToDelete.has(getDownloadEventId(item))),
    );

    setSelectedIds(new Set());
    setSelectionMode(false);

    try {
      await deleteDeviceFiles(selectedItems);
      await removeLocalDownloadsByIds(idsToDelete);
      await addLocallyDeletedDownloadIds(idsToDelete);
    } catch (error) {
      console.log(
        "DELETE LOCAL DOWNLOADS ERROR",
        (error as any)?.message || error,
      );
    }
  }, [downloads, selectedIds]);

  if (loading) {
    return (
      <View style={[styles.root, styles.loadingRoot]}>
        <MeshBackground variant="profile" />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading downloads...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            selectionMode ? styles.scrollContentWithDelete : null,
          ]}
        >
          <DownloadsHeader
            navigation={navigation}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            selectionMode={selectionMode}
            selectedCount={selectedIds.size}
            hasDownloads={filteredDownloads.length > 0}
            onDeletePress={toggleSelectionMode}
          />

          {filteredDownloads.length > 0 ? (
            <DownloadsGrid
              downloads={filteredDownloads}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onOpenWallpaper={openWallpaper}
              onToggleSelect={toggleWallpaperSelection}
            />
          ) : (
            <EmptyState
              title={
                downloads.length > 0
                  ? `No ${activeFilter} Downloads`
                  : undefined
              }
              subtitle={
                downloads.length > 0
                  ? "Try another filter or download more wallpapers from the gallery."
                  : undefined
              }
              onBrowse={browseWallpapers}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {selectionMode ? (
        <DeleteBottomOverlay
          selectedCount={selectedIds.size}
          onDelete={deleteSelectedWallpapers}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  safe: {
    flex: 1,
  },

  loadingRoot: {
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    marginTop: spacing.md,
  },

  scrollContent: {
    paddingBottom: 130,
  },

  scrollContentWithDelete: {
    paddingBottom: 210,
  },

  topBar: {
    minHeight: 72,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topTitleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },

  topTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 24,
    letterSpacing: -0.4,
  },

  topSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    marginTop: 2,
  },

  roundAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },

  roundBlur: {
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

  filterWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },

  filterBar: {
    flexDirection: "row",
    padding: 5,
    borderRadius: radius.pill,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillSoft,
  },

  filterItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  filterActive: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: "center",
  },

  filterText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    paddingVertical: 10,
  },

  filterTextActive: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
  },

  cardNoMargin: {
    marginTop: 0,
  },

  downloadGrid: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  wallpaperButton: {
    width: "48%",
    aspectRatio: 0.68,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: "#1d1d1d",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  wallpaperButtonSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },

  wallpaperImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1d1d1d",
  },

  wallpaperImageStyle: {
    borderRadius: 18,
  },

  qualityChip: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  qualityText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },

  selectionLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.24)",
  },

  selectionCircle: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.56)",
  },

  selectionCircleActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  wallpaperMetaLayer: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    alignItems: "flex-start",
  },

  downloadPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  downloadPillText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },

  emptyWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },

  emptyDownloads: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },

  emptyTitle: {
    marginTop: 15,
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    textAlign: "center",
  },

  emptySubtitle: {
    marginTop: 10,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 22,
  },

  browseButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  browseText: {
    color: "#fff",
    fontWeight: "800",
  },

  deleteDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: 18,
    paddingBottom: 18,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(15,15,16,0.82)",
  },

  deleteDeviceButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 12,
  },

  deleteDeviceButtonDisabled: {
    opacity: 0.55,
  },

  deleteDeviceText: {
    color: colors.accent,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});