import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

type Props = NativeStackScreenProps<RootStackParamList, "Downloads">;

type DownloadWallpaper = Omit<Wallpaper, "category"> & {
  category?: Wallpaper["category"] | null;
  downloadedAt?: string | Date | null;
  downloadCount?: number;
  downloads?: number;
  isPremium?: boolean;
  resolution?: string | null;
};

type Filter = "All" | "4K" | "8K" | "Premium";

const FILTERS: Filter[] = ["All", "4K", "8K", "Premium"];
const API_ORIGIN = String(API.defaults.baseURL || "").replace(/\/api\/?$/, "");

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
  return Array.isArray(payload) ? payload : [];
};

const normalizeDownload = (record: any): DownloadWallpaper | null => {
  const wallpaper = record?.wallpaper ?? record?.Wallpaper ?? record;

  if (!wallpaper || typeof wallpaper !== "object") {
    return null;
  }

  const id = wallpaper.id ?? record?.wallpaperId ?? record?.id;
  const imageUrl =
    wallpaper.imageUrl ??
    wallpaper.image_url ??
    wallpaper.url ??
    wallpaper.image ??
    wallpaper.mediaUrl;
  const thumbnailUrl =
    wallpaper.thumbnailUrl ??
    wallpaper.thumbnail_url ??
    wallpaper.thumbnail ??
    wallpaper.photoUrl;

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
    downloads:
      wallpaper.downloads ??
      wallpaper.downloadCount ??
      wallpaper.totalDownloads ??
      record?.downloads ??
      record?.downloadCount ??
      0,
  };
};

const parseTime = (value?: string | Date | null) => {
  if (!value) return 0;

  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
};

const uniqueById = (items: DownloadWallpaper[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
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

const DownloadsAreaCard = ({
  downloads,
  totalDownloads,
  activeFilter,
  onOpenWallpaper,
  onViewAll,
}: {
  downloads: DownloadWallpaper[];
  totalDownloads: number;
  activeFilter: Filter;
  onOpenWallpaper: (wallpaper: DownloadWallpaper) => void;
  onViewAll: () => void;
}) => {
  return (
    <Card style={styles.card} padding={20} strong>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.cardTitle}>All Downloads</Text>

          <Text style={styles.downloadCount}>
            {activeFilter === "All"
              ? `${totalDownloads} Wallpaper${totalDownloads !== 1 ? "s" : ""}`
              : `${downloads.length} ${activeFilter} Wallpaper${
                  downloads.length !== 1 ? "s" : ""
                }`}
          </Text>
        </View>

        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.downloadGrid}>
        {downloads.map((item) => {
          const image = getWallpaperImage(item) ?? fallbackImage(item.id);

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
              <Image
                source={{ uri: image }}
                style={styles.wallpaper}
                resizeMode="cover"
              />
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
};

const EmptyState = ({
  signedIn,
  authLoading,
  title,
  subtitle,
  onBrowse,
  onSignIn,
}: {
  signedIn: boolean;
  authLoading: boolean;
  title?: string;
  subtitle?: string;
  onBrowse: () => void;
  onSignIn: () => void;
}) => (
  <View style={styles.emptyWrap}>
    <Card style={styles.cardNoMargin} padding={24} strong>
      <View style={styles.emptyContent}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name={signedIn ? "download-outline" : "person-circle-outline"}
            size={46}
            color={colors.accent}
          />
        </View>

        <Text style={styles.emptyTitle}>
          {title ??
            (signedIn ? "No Downloads Yet" : "Sign in to sync downloads")}
        </Text>

        <Text style={styles.emptySubtitle}>
          {subtitle ??
            (signedIn
              ? "Wallpapers you download will appear here."
              : "Create your account to save favorites, synchronize downloads and access premium features across all your devices.")}
        </Text>

        <View style={styles.emptyActions}>
          <Pressable
            disabled={authLoading}
            style={styles.googleButton}
            onPress={signedIn ? onBrowse : onSignIn}
          >
            {authLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={signedIn ? "grid-outline" : "logo-google"}
                  size={22}
                  color="#fff"
                />

                <Text style={styles.googleText}>
                  {signedIn ? "Browse Wallpapers" : "Continue with Google"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Card>
  </View>
);

export default function DownloadsScreen({ navigation }: Props) {
  const { user, authLoading, signInGoogle } = useAuth();

  const [downloads, setDownloads] = useState<DownloadWallpaper[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDownloads = useCallback(async () => {
    if (!user) {
      setDownloads([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await getDownloads();
      const items = getPayloadArray(response)
        .map(normalizeDownload)
        .filter(Boolean) as DownloadWallpaper[];

      const sorted = uniqueById(items).sort(
        (a, b) => parseTime(b.downloadedAt) - parseTime(a.downloadedAt),
      );

      setDownloads(sorted);
    } catch (error) {
      console.log(
        "DOWNLOADS LOAD ERROR",
        (error as any)?.response?.data || (error as any)?.message || error,
      );
      setDownloads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadDownloads();
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
            <DownloadsAreaCard
              downloads={filteredDownloads}
              totalDownloads={downloads.length}
              activeFilter={activeFilter}
              onOpenWallpaper={openWallpaper}
              onViewAll={() => setActiveFilter("All")}
            />
          ) : (
            <EmptyState
              signedIn={!!user}
              authLoading={authLoading}
              title={
                user && downloads.length > 0
                  ? `No ${activeFilter} Downloads`
                  : undefined
              }
              subtitle={
                user && downloads.length > 0
                  ? "Try another filter or download more wallpapers from the gallery."
                  : undefined
              }
              onBrowse={browseWallpapers}
              onSignIn={signInGoogle}
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

  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  cardNoMargin: {
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "left",
  },
  downloadCount: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  viewAll: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: 15,
  },
  downloadGrid: {
    marginTop: 20,
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
  },
  wallpaper: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#1d1d1d",
  },

  emptyWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  emptySubtitle: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    fontSize: 15,
    marginBottom: 24,
  },
  emptyActions: {
    width: "100%",
  },
  googleButton: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});