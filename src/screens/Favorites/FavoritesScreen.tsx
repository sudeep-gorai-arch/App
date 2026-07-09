import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
  ImageBackground,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import MeshBackground from "../../components/MeshBackground";
import Card from "../../components/Card";
import PremiumActionButton from "../../components/PremiumActionButton";

import API from "../../services/api";
import { colors, gradients } from "../../styles/colors";
import { fontFamily } from "../../styles/typography";

import { spacing, radius, SCREEN } from "../../utils/constants";

import { getFavorites, removeFavorite } from "../../services/favoriteService";

import { Wallpaper } from "../../services/types";
import { appEvents } from "../../utils/appEvents";

const flexiWallsLogo = require("../../assets/images/flexiwalls-logo.png");

const GAP = spacing.lg;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.4;

const FILTERS = ["All", "Recent", "Live"] as const;

type Filter = (typeof FILTERS)[number];

type FavoriteWallpaper = Wallpaper & Record<string, any>;

type FavoriteItem = {
  id: string;
  favoriteKey: string;
  wallpaper: FavoriteWallpaper;
  createdAt?: string;
};

const API_ORIGIN = String(API.defaults.baseURL || "").replace(/\/api\/?$/, "");

const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

const isBlankishValue = (value: unknown) => {
  const text = String(value ?? "").trim().toLowerCase();

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

const getWallpaperMediaType = (item: Record<string, any>) => {
  return String(item?.mediaType || item?.media_type || item?.type || "")
    .trim()
    .toUpperCase();
};

const isVideoWallpaper = (item?: Record<string, any> | null) => {
  if (!item) return false;

  const mediaType = getWallpaperMediaType(item);

  if (mediaType === "IMAGE") return false;
  if (mediaType === "VIDEO") return true;
  if (item?.isVideo === true || item?.is_video === true) return true;

  return (
    isRealVideoUrlValue(item?.videoUrl) ||
    isRealVideoUrlValue(item?.video_url) ||
    isRealVideoUrlValue(item?.videoPath) ||
    isRealVideoUrlValue(item?.video_path) ||
    isRealVideoUrlValue(item?.downloadUrl) ||
    isRealVideoUrlValue(item?.download_url) ||
    isRealVideoUrlValue(item?.url)
  );
};

const toAbsoluteMediaUrl = (value?: string | null) => {
  if (!value) return "";

  const url = String(value).trim();

  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    if (!API_ORIGIN) return url;

    return url.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
      API_ORIGIN,
    );
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (url.startsWith("/")) {
    return API_ORIGIN ? `${API_ORIGIN}${url}` : url;
  }

  return API_ORIGIN ? `${API_ORIGIN}/${url}` : url;
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

const getFavoriteCount = (wallpaper: FavoriteWallpaper) => {
  return Math.max(
    toNumber(wallpaper.favoriteCount),
    toNumber(wallpaper.favorite_count),
    toNumber(wallpaper.favoritesCount),
    toNumber(wallpaper.favorites_count),
    toNumber(wallpaper._count?.favorites),
    toNumber(wallpaper.favorites),
  );
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

const getRawImageUrl = (item: any) =>
  item?.videoPreviewUrl ||
  item?.video_preview_url ||
  item?.videoPreviewPath ||
  item?.video_preview_path ||
  item?.imageUrl ||
  item?.image_url ||
  item?.downloadUrl ||
  item?.download_url ||
  item?.displayUrl ||
  item?.display_url ||
  item?.displayPath ||
  item?.display_path ||
  getVariantUrl(item, ["DISPLAY", "ORIGINAL", "THUMBNAIL"]) ||
  item?.url ||
  item?.image ||
  item?.photoUrl ||
  item?.photo_url ||
  item?.mediaUrl ||
  item?.media_url ||
  item?.originalUrl ||
  item?.original_url ||
  item?.originalPath ||
  item?.original_path;

const getRawThumbnailUrl = (item: any) =>
  item?.videoThumbnailUrl ||
  item?.video_thumbnail_url ||
  item?.videoThumbnailPath ||
  item?.video_thumbnail_path ||
  item?.videoPreviewUrl ||
  item?.video_preview_url ||
  item?.videoPreviewPath ||
  item?.video_preview_path ||
  item?.thumbnailUrl ||
  item?.thumbnail_url ||
  item?.thumbnailPath ||
  item?.thumbnail_path ||
  item?.displayUrl ||
  item?.display_url ||
  getVariantUrl(item, ["THUMBNAIL", "DISPLAY", "ORIGINAL"]) ||
  item?.thumbnail ||
  item?.thumbUrl ||
  item?.thumb_url ||
  item?.displayPath ||
  item?.display_path ||
  item?.imageUrl ||
  item?.image_url ||
  item?.downloadUrl ||
  item?.download_url;

const normalizeWallpaper = (
  wallpaperInput: FavoriteWallpaper,
  index: number,
): FavoriteWallpaper => {
  const wallpaper = wallpaperInput as FavoriteWallpaper;

  const id = String(
    wallpaper.id ||
      wallpaper._id ||
      wallpaper.wallpaperId ||
      wallpaper.wallpaper_id ||
      `wallpaper-${index}`,
  );

  const favoriteCount = getFavoriteCount(wallpaper);

  return {
    ...wallpaper,

    id,

    title: String(wallpaper.title || wallpaper.name || "Wallpaper"),

    imageUrl: toAbsoluteMediaUrl(getRawImageUrl(wallpaper)),

    thumbnailUrl: toAbsoluteMediaUrl(getRawThumbnailUrl(wallpaper)),

    quality: wallpaper.quality || "",

    likes: toNumber(
      wallpaper.likes ?? wallpaper.likeCount ?? wallpaper.like_count,
    ),

    downloadCount: toNumber(
      wallpaper.downloadCount ??
        wallpaper.download_count ??
        wallpaper.downloads ??
        0,
    ),

    favoriteCount,

    favoritesCount: favoriteCount,

    isPremium: Boolean(
      wallpaper.isPremium ||
        wallpaper.is_premium ||
        wallpaper.premium ||
        wallpaper.premiumOnly,
    ),

    category: wallpaper.category,

    categoryId: wallpaper.categoryId || wallpaper.category_id,

    createdAt: wallpaper.createdAt || wallpaper.created_at || "",

    updatedAt:
      wallpaper.updatedAt ||
      wallpaper.updated_at ||
      wallpaper.createdAt ||
      wallpaper.created_at ||
      "",

    isFavorite: true,
  } as FavoriteWallpaper;
};

const extractFavoriteArray = (payload: any): any[] => {
  if (Array.isArray(payload?.data?.data?.favorites)) {
    return payload.data.data.favorites;
  }

  if (Array.isArray(payload?.data?.data?.items)) {
    return payload.data.data.items;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  if (Array.isArray(payload?.data?.favorites)) {
    return payload.data.favorites;
  }

  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.favorites)) {
    return payload.favorites;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

const normalizeFavoriteItem = (
  item: any,
  index: number,
): FavoriteItem | null => {
  const rawWallpaper =
    item?.wallpaper ||
    item?.Wallpaper ||
    item?.wallpaperData ||
    item?.wallpaper_data ||
    item?.data?.wallpaper ||
    item?.data?.Wallpaper ||
    item?.data ||
    item;

  if (!rawWallpaper) return null;

  const wallpaper = normalizeWallpaper(rawWallpaper, index);

  if (!wallpaper?.id) return null;

  const favoriteId = String(
    item?.id ||
      item?.favoriteId ||
      item?.favorite_id ||
      `${wallpaper.id}-${index}`,
  );

  return {
    id: favoriteId,
    favoriteKey: `${favoriteId}-${wallpaper.id}`,
    wallpaper,
    createdAt: item?.createdAt || item?.created_at || wallpaper.createdAt,
  };
};

const extractFavoriteWallpapers = (payload: any): FavoriteItem[] => {
  const list = extractFavoriteArray(payload);
  const seen = new Set<string>();

  return list
    .map(normalizeFavoriteItem)
    .filter((item): item is FavoriteItem => Boolean(item?.wallpaper?.id))
    .filter((item) => {
      const wallpaperId = String(item.wallpaper.id);

      if (seen.has(wallpaperId)) return false;

      seen.add(wallpaperId);
      return true;
    });
};

const getWallpaperImage = (wallpaper: FavoriteWallpaper) => {
  return (
    toAbsoluteMediaUrl(wallpaper.thumbnailUrl) ||
    toAbsoluteMediaUrl(wallpaper.imageUrl) ||
    toAbsoluteMediaUrl(getRawThumbnailUrl(wallpaper)) ||
    toAbsoluteMediaUrl(getRawImageUrl(wallpaper)) ||
    ""
  );
};

const getWallpaperEventId = (
  wallpaper: FavoriteWallpaper | Record<string, any>,
) => {
  return String(
    wallpaper?.id ||
      wallpaper?._id ||
      wallpaper?.wallpaperId ||
      wallpaper?.wallpaper_id ||
      wallpaper?.uuid ||
      "",
  );
};

const createFavoriteItemFromWallpaper = (
  wallpaperInput: FavoriteWallpaper,
  index = 0,
): FavoriteItem | null => {
  const wallpaper = normalizeWallpaper(
    {
      ...wallpaperInput,
      isFavorite: true,
      is_favorite: true,
    },
    index,
  );

  if (!wallpaper?.id) return null;

  return {
    id: `event-${wallpaper.id}`,
    favoriteKey: `event-${wallpaper.id}-${wallpaper.id}`,
    wallpaper,
    createdAt:
      wallpaper.createdAt || wallpaper.created_at || new Date().toISOString(),
  };
};

const patchFavoriteWallpaper = (
  wallpaper: FavoriteWallpaper,
  patch: Record<string, any>,
  index = 0,
) => {
  const nextFavoriteCount =
    patch.favoriteCount ??
    patch.favorite_count ??
    patch.favoritesCount ??
    patch.favorites_count ??
    getFavoriteCount(wallpaper);

  return normalizeWallpaper(
    {
      ...wallpaper,
      ...patch,
      favoriteCount: nextFavoriteCount,
      favorite_count: nextFavoriteCount,
      favoritesCount: nextFavoriteCount,
      favorites_count: nextFavoriteCount,
      isFavorite: true,
      is_favorite: true,
    },
    index,
  );
};

const FavoritesTopHeader = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.favoritesHeader}>
      <View style={styles.favoritesActionRow}>
        <Image
          source={flexiWallsLogo}
          style={styles.favoritesLogoLeft}
          resizeMode="contain"
        />

        <View style={styles.favoritesRightActions}>
          <PremiumActionButton
            returnTo="Favorites"
            style={styles.favoritesPremiumButton}
          />

          <Pressable
            onPress={() => navigation.navigate("Search")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.favoritesRightButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <BlurView
              intensity={30}
              tint="dark"
              style={styles.favoritesRoundButton}
            >
              <Ionicons name="search" size={20} color={colors.textPrimary} />
            </BlurView>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const QualityChip = ({ wallpaper }: { wallpaper: FavoriteWallpaper }) => {
  if (isVideoWallpaper(wallpaper)) {
    return (
      <BlurView
        intensity={26}
        tint="dark"
        style={[styles.qualityChip, styles.videoQualityChip]}
      >
        <Ionicons name="videocam" size={14} color={colors.textPrimary} />
      </BlurView>
    );
  }

  return (
    <BlurView intensity={26} tint="dark" style={styles.qualityChip}>
      <Text style={styles.qualityText}>{wallpaper.quality || "HD"}</Text>
    </BlurView>
  );
};

const FavoriteCard = ({
  item,
  onRemove,
  onPress,
}: {
  item: FavoriteItem;
  onRemove: (wallpaperId: string) => void;
  onPress: (wallpaper: FavoriteWallpaper) => void;
}) => {
  const wallpaper = item.wallpaper;
  const image = getWallpaperImage(wallpaper);

  return (
    <Pressable
      onPress={() => onPress(wallpaper)}
      style={({ pressed }) => [
        styles.card,
        {
          transform: [
            {
              scale: pressed ? 0.98 : 1,
            },
          ],
        },
      ]}
    >
      {image ? (
        <ImageBackground
          source={{ uri: image }}
          style={styles.cardImage}
          imageStyle={{
            borderRadius: radius.lg,
          }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              "rgba(8,6,20,0.05)",
              "rgba(8,6,20,0.2)",
              "rgba(8,6,20,0.82)",
            ]}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: radius.lg,
              },
            ]}
          />

          <QualityChip wallpaper={wallpaper} />

          <Pressable
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onRemove(wallpaper.id);
            }}
            style={styles.heartWrap}
          >
            <BlurView intensity={30} tint="dark" style={styles.heartChip}>
              <Ionicons name="heart" size={18} color={colors.heart} />
            </BlurView>
          </Pressable>

          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {wallpaper.title || "Wallpaper"}
            </Text>

            <View style={styles.cardMetaRow}>
              <Text style={styles.cardCategory} numberOfLines={1}>
                {wallpaper.category?.name ?? "Wallpaper"}
              </Text>

              <View style={styles.likeRow}>
                <Ionicons name="heart" size={12} color={colors.textSecondary} />

                <Text style={styles.likeText}>
                  {formatCount(getFavoriteCount(wallpaper))}
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.cardPlaceholder}>
          <Ionicons
            name="image-outline"
            size={30}
            color={colors.textSecondary}
          />

          <QualityChip wallpaper={wallpaper} />

          <Pressable
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onRemove(wallpaper.id);
            }}
            style={styles.heartWrap}
          >
            <BlurView intensity={30} tint="dark" style={styles.heartChip}>
              <Ionicons name="heart" size={18} color={colors.heart} />
            </BlurView>
          </Pressable>

          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {wallpaper.title || "Wallpaper"}
            </Text>

            <View style={styles.cardMetaRow}>
              <Text style={styles.cardCategory} numberOfLines={1}>
                {wallpaper.category?.name ?? "Wallpaper"}
              </Text>

              <View style={styles.likeRow}>
                <Ionicons name="heart" size={12} color={colors.textSecondary} />

                <Text style={styles.likeText}>
                  {formatCount(getFavoriteCount(wallpaper))}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const EmptyState = () => (
  <View style={styles.emptyWrap}>
    <Card
      padding={spacing.xxl}
      style={{
        alignItems: "center",
      }}
      glowBorder
    >
      <View style={styles.emptyIcon}>
        <Ionicons name="heart-outline" size={34} color={colors.textPrimary} />
      </View>

      <Text style={styles.emptyTitle}>No favorites yet</Text>

      <Text style={styles.emptySubtitle}>
        Tap the heart on any wallpaper to save it here.
      </Text>
    </Card>
  </View>
);

const FavoritesScreen = () => {
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const loadFavorites = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      const response = await getFavorites();

      setItems(extractFavoriteWallpapers(response));
    } catch (error) {
      console.log("FAVORITES ERROR", error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    await loadFavorites(true);
  };

  useEffect(() => {
    const unsubscribeFavorites = appEvents.on("favoritesChanged", (payload) => {
      const wallpaperId = String(
        payload.wallpaperId || payload.wallpaper?.id || "",
      );

      if (!wallpaperId) {
        return;
      }

      if (!payload.isFavorite) {
        setItems((current) =>
          current.filter(
            (item) => getWallpaperEventId(item.wallpaper) !== wallpaperId,
          ),
        );
        return;
      }

      setItems((current) => {
        const existingIndex = current.findIndex(
          (item) => getWallpaperEventId(item.wallpaper) === wallpaperId,
        );

        const existingItem =
          existingIndex >= 0 ? current[existingIndex] : undefined;

        const sourceWallpaper =
          payload.wallpaper || existingItem?.wallpaper || undefined;

        if (!sourceWallpaper) {
          loadFavorites();
          return current;
        }

        const nextFavoriteCount =
          payload.favoriteCount ?? getFavoriteCount(sourceWallpaper);

        const nextWallpaper = patchFavoriteWallpaper(
          {
            ...sourceWallpaper,
            id: wallpaperId,
          },
          {
            favoriteCount: nextFavoriteCount,
            favorite_count: nextFavoriteCount,
            favoritesCount: nextFavoriteCount,
            favorites_count: nextFavoriteCount,
          },
          existingIndex >= 0 ? existingIndex : current.length,
        );

        if (existingItem) {
          return current.map((item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  wallpaper: nextWallpaper,
                }
              : item,
          );
        }

        const nextItem = createFavoriteItemFromWallpaper(
          nextWallpaper,
          current.length,
        );

        if (!nextItem) {
          return current;
        }

        return [nextItem, ...current];
      });
    });

    const unsubscribeWallpaper = appEvents.on("wallpaperChanged", (payload) => {
      const wallpaperId = String(
        payload.wallpaperId || payload.wallpaper?.id || "",
      );

      if (!wallpaperId || !payload.wallpaper) {
        return;
      }

      setItems((current) =>
        current.map((item, index) => {
          if (getWallpaperEventId(item.wallpaper) !== wallpaperId) {
            return item;
          }

          return {
            ...item,
            wallpaper: patchFavoriteWallpaper(
              item.wallpaper,
              payload.wallpaper,
              index,
            ),
          };
        }),
      );
    });

    const unsubscribeWallpapers = appEvents.on("wallpapersChanged", () => {
      loadFavorites();
    });

    return () => {
      unsubscribeFavorites();
      unsubscribeWallpaper();
      unsubscribeWallpapers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (wallpaperId: string) => {
    const previousItems = items;
    const removedItem = items.find(
      (item) => getWallpaperEventId(item.wallpaper) === wallpaperId,
    );

    if (!removedItem) {
      return;
    }

    const rollbackWallpaper = removedItem.wallpaper;
    const nextFavoriteCount = Math.max(
      0,
      getFavoriteCount(rollbackWallpaper) - 1,
    );

    setItems((prev) =>
      prev.filter(
        (item) => getWallpaperEventId(item.wallpaper) !== wallpaperId,
      ),
    );

    appEvents.emit("favoritesChanged", {
      wallpaperId,
      isFavorite: false,
      favoriteCount: nextFavoriteCount,
      wallpaper: {
        ...rollbackWallpaper,
        isFavorite: false,
        is_favorite: false,
        favoriteCount: nextFavoriteCount,
        favorite_count: nextFavoriteCount,
        favoritesCount: nextFavoriteCount,
        favorites_count: nextFavoriteCount,
      },
    });

    try {
      const data = await removeFavorite(wallpaperId);

      const confirmedFavoriteCount =
        data?.favoriteCount ??
        data?.favorite_count ??
        data?.favoritesCount ??
        data?.favorites_count ??
        nextFavoriteCount;

      appEvents.emit("favoritesChanged", {
        wallpaperId,
        isFavorite: false,
        favoriteCount: toNumber(confirmedFavoriteCount),
        wallpaper: {
          ...rollbackWallpaper,
          isFavorite: false,
          is_favorite: false,
          favoriteCount: toNumber(confirmedFavoriteCount),
          favorite_count: toNumber(confirmedFavoriteCount),
          favoritesCount: toNumber(confirmedFavoriteCount),
          favorites_count: toNumber(confirmedFavoriteCount),
        },
      });
    } catch (error) {
      console.log("REMOVE FAVORITE ERROR", error);

      setItems(previousItems);

      appEvents.emit("favoritesChanged", {
        wallpaperId,
        isFavorite: true,
        favoriteCount: getFavoriteCount(rollbackWallpaper),
        wallpaper: {
          ...rollbackWallpaper,
          isFavorite: true,
          is_favorite: true,
        },
      });
    }
  };

  const data = useMemo(() => {
    const copy = items.filter((item) => item?.wallpaper?.id);

    if (filter === "Recent") {
      return copy.sort((a, b) => {
        const bTime = new Date(b.createdAt || "").getTime();
        const aTime = new Date(a.createdAt || "").getTime();

        return (
          (Number.isFinite(bTime) ? bTime : 0) -
          (Number.isFinite(aTime) ? aTime : 0)
        );
      });
    }

    if (filter === "Live") {
      return copy.sort(
        (a, b) => getFavoriteCount(b.wallpaper) - getFavoriteCount(a.wallpaper),
      );
    }

    return copy;
  }, [items, filter]);

  const openWallpaper = (wallpaper: FavoriteWallpaper) => {
    const parentNavigation = navigation.getParent?.();

    if (parentNavigation) {
      parentNavigation.navigate("WallpaperDetails", { wallpaper });
      return;
    }

    navigation.navigate("WallpaperDetails", { wallpaper });
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.loadingRoot]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <FlatList
          data={data}
          keyExtractor={(item, index) =>
            String(
              item?.favoriteKey ?? item?.wallpaper?.id ?? `favorite-${index}`,
            )
          }
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={data.length ? styles.columnWrapper : undefined}
          contentContainerStyle={[
            styles.listContent,
            !data.length && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textPrimary}
            />
          }
          ListHeaderComponent={
            <View>
              <FavoritesTopHeader navigation={navigation} />

              <View style={styles.titleBlock}>
                <Text style={styles.title}>Favorites</Text>
                <Text style={styles.subtitle}>
                  Your saved wallpapers collection
                </Text>
              </View>

              <BlurView intensity={30} tint="dark" style={styles.filterBar}>
                {FILTERS.map((f) => {
                  const active = f === filter;

                  return (
                    <Pressable
                      key={f}
                      style={styles.filterItem}
                      onPress={() => setFilter(f)}
                    >
                      {active ? (
                        <LinearGradient
                          colors={gradients.blueViolet}
                          style={styles.filterActive}
                        >
                          <Text style={styles.filterTextActive}>{f}</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.filterText}>{f}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </BlurView>
            </View>
          }
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item }) =>
            item?.wallpaper ? (
              <FavoriteCard
                item={item}
                onRemove={remove}
                onPress={openWallpaper}
              />
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
};

export default FavoritesScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  loadingRoot: {
    justifyContent: "center",
    alignItems: "center",
  },

  favoritesHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 0,
  },

  favoritesActionRow: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "visible",
    marginBottom: -8,
  },

  favoritesLogoLeft: {
    width: 175,
    height: 120,
    marginLeft: -18,
    marginTop: 8,
  },

  favoritesRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 5,
  },

  favoritesPremiumButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    backgroundColor: "transparent",
  },

  favoritesRightButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },

  favoritesRoundButton: {
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

  titleBlock: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 28,
    letterSpacing: -0.5,
  },

  subtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    marginTop: 4,
  },

  listContent: {
    paddingBottom: 130,
    gap: GAP,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  columnWrapper: {
    paddingHorizontal: spacing.xl,
    gap: GAP,
  },

  filterBar: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
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
    fontSize: 15,
    paddingVertical: 10,
  },

  filterTextActive: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
  },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillSoft,
  },

  cardImage: {
    flex: 1,
  },

  cardPlaceholder: {
    flex: 1,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glassFillSoft,
  },

  qualityChip: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  videoQualityChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  qualityText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },

  heartWrap: {
    position: "absolute",
    top: 10,
    right: 10,
  },

  heartChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  cardMeta: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },

  cardTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },

  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
    gap: 8,
  },

  cardCategory: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  likeText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  emptyWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillSoft,
    marginBottom: spacing.lg,
  },

  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
  },

  emptySubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
});