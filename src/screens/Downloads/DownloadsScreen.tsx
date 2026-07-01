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

type Filter = "All" | "4K" | "8K" | "Premium";

const FILTERS: Filter[] = ["All", "4K", "8K", "Premium"];
const API_ORIGIN = String(API.defaults.baseURL || "").replace(/\/api\/?$/, "");
const LOCAL_DOWNLOADS_KEY = "@flexiwalls:guestDownloads";

const fallbackImage = (seed: string) =>
  `https://picsum.photos/seed/flexiwalls-download-${seed}/700/1100`;

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

const getWallpaperImage = (item?: DownloadWallpaper | null) => {
  if (!item) return undefined;

  const record = item as DownloadWallpaper & Record<string, any>;

  return (
    toAbsoluteMediaUrl(record.thumbnailUrl) ||
    toAbsoluteMediaUrl(record.imageUrl) ||
    toAbsoluteMediaUrl(record.thumbnail_url) ||
    toAbsoluteMediaUrl(record.image_url) ||
    toAbsoluteMediaUrl(record.url) ||
    toAbsoluteMediaUrl(record.image) ||
    toAbsoluteMediaUrl(record.thumbnail) ||
    toAbsoluteMediaUrl(record.photoUrl) ||
    toAbsoluteMediaUrl(record.photo_url) ||
    toAbsoluteMediaUrl(record.mediaUrl) ||
    toAbsoluteMediaUrl(record.media_url)
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

  const id =
    wallpaper.id ?? record?.wallpaperId ?? record?.wallpaper_id ?? record?.id;

  const imageUrl =
    wallpaper.imageUrl ??
    wallpaper.image_url ??
    wallpaper.url ??
    wallpaper.image ??
    wallpaper.mediaUrl ??
    record?.imageUrl ??
    record?.image_url;

  const thumbnailUrl =
    wallpaper.thumbnailUrl ??
    wallpaper.thumbnail_url ??
    wallpaper.thumbnail ??
    wallpaper.photoUrl ??
    record?.thumbnailUrl ??
    record?.thumbnail_url;

  if (!id && !imageUrl && !thumbnailUrl) {
    return null;
  }

  return {
    ...wallpaper,
    id: String(id ?? imageUrl ?? thumbnailUrl),
    title: wallpaper.title ?? wallpaper.name ?? "Downloaded Wallpaper",
    imageUrl,
    thumbnailUrl,
    quality: wallpaper.quality ?? wallpaper.type ?? "4K",
    category: wallpaper.category ?? record?.category ?? null,
    downloadedAt:
      record?.downloadedAt ??
      record?.createdAt ??
      record?.created_at ??
      wallpaper.downloadedAt ??
      wallpaper.createdAt ??
      null,
    isPremium: Boolean(wallpaper.isPremium ?? wallpaper.premium ?? false),
    resolution: wallpaper.resolution ?? wallpaper.dimensions ?? null,
    downloadCount:
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

const uniqueById = (items: DownloadWallpaper[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

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

const sortDownloads = (items: DownloadWallpaper[]) =>
  uniqueById(items).sort(
    (a, b) => parseTime(b.downloadedAt) - parseTime(a.downloadedAt),
  );

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

const DownloadsHeader = ({
  navigation,
  activeFilter,
  onFilterChange,
  onBrowse,
}: {
  navigation: Props["navigation"];
  activeFilter: Filter;
  onFilterChange: (filter: Filter) => void;
  onBrowse: () => void;
}) => {
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
          <Text style={styles.topSubtitle}>Your saved wallpaper gallery</Text>
        </View>

        <Pressable
          onPress={onBrowse}
          hitSlop={8}
          style={({ pressed }) => [
            styles.roundAction,
            { opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <BlurView intensity={30} tint="dark" style={styles.roundBlur}>
            <Ionicons
              name="grid-outline"
              size={20}
              color={colors.textPrimary}
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
  onOpenWallpaper,
}: {
  downloads: DownloadWallpaper[];
  onOpenWallpaper: (wallpaper: DownloadWallpaper) => void;
}) => {
  return (
    <View style={styles.downloadGrid}>
      {downloads.map((item) => {
        const image = getWallpaperImage(item) ?? fallbackImage(item.id);
        const downloadCount = getDownloadCount(item);

        return (
          <Pressable
            key={item.id}
            onPress={() => onOpenWallpaper(item)}
            style={({ pressed }) => [
              styles.wallpaperButton,
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

export default function DownloadsScreen({ navigation }: Props) {
  const { user } = useAuth();

  const [downloads, setDownloads] = useState<DownloadWallpaper[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDownloads = useCallback(async () => {
    let localItems: DownloadWallpaper[] = [];

    try {
      localItems = await getLocalDownloads();

      if (!user) {
        const sortedLocal = sortDownloads(localItems);

        setDownloads(sortedLocal);
        return;
      }

      const response = await getDownloads();
      const serverItems = getPayloadArray(response)
        .map(normalizeDownload)
        .filter(Boolean) as DownloadWallpaper[];

      const sorted = sortDownloads([...serverItems, ...localItems]);

      setDownloads(sorted);
    } catch (error) {
      console.log(
        "DOWNLOADS LOAD ERROR",
        (error as any)?.response?.data || (error as any)?.message || error,
      );

      const sortedLocal = sortDownloads(localItems);

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

      setDownloads((current) => sortDownloads([nextDownload, ...current]));
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

  const openWallpaper = (wallpaper: DownloadWallpaper) => {
    navigation.navigate("WallpaperDetails", {
      wallpaper,
    });
  };

  const browseWallpapers = () => {
    navigation.navigate("MainTabs");
  };

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
          contentContainerStyle={styles.scrollContent}
        >
          <DownloadsHeader
            navigation={navigation}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onBrowse={browseWallpapers}
          />

          {filteredDownloads.length > 0 ? (
            <DownloadsGrid
              downloads={filteredDownloads}
              onOpenWallpaper={openWallpaper}
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
});