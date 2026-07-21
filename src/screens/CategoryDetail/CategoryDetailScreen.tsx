import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import MeshBackground from '../../components/MeshBackground';
import { RoundButton } from '../../components/Header';

import API from '../../services/api';
import { getCategoryWallpapers } from '../../services/wallpaperService';
import { Wallpaper } from '../../services/types';

import { colors } from '../../styles/colors';
import { fontFamily } from '../../styles/typography';
import { spacing, radius, SCREEN } from '../../utils/constants';

import { RootStackParamList } from '../../navigation/RootStackParamList';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryDetail'>;

type CategoryFilter = 'All' | 'Popular' | 'New' | 'Premium';

const GAP = spacing.lg;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.5;

const API_ORIGIN = String(API.defaults.baseURL || '').replace(/\/api\/?$/, '');

const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

const isBlankishValue = (value: unknown) => {
  const text = String(value ?? '').trim().toLowerCase();

  return (
    !text ||
    text === 'null' ||
    text === 'undefined' ||
    text === 'false' ||
    text === '0'
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
  return String(item?.mediaType || item?.media_type || item?.type || '')
    .trim()
    .toUpperCase();
};

const isVideoWallpaper = (item?: Record<string, any> | null) => {
  if (!item) return false;

  const mediaType = getWallpaperMediaType(item);

  if (mediaType === 'IMAGE') return false;
  if (mediaType === 'VIDEO') return true;
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

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  if (url.startsWith('/')) {
    return API_ORIGIN ? `${API_ORIGIN}${url}` : url;
  }

  return API_ORIGIN ? `${API_ORIGIN}/${url}` : url;
};

const getWallpaperId = (item: Wallpaper, index = 0) => {
  const wallpaper = item as Wallpaper & Record<string, any>;

  return String(
    wallpaper.id ||
    wallpaper._id ||
    wallpaper.wallpaperId ||
    wallpaper.wallpaper_id ||
    wallpaper.uuid ||
    `wallpaper-${index}`,
  );
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? '').replace(/[^\d]/g, ''));

  return Number.isFinite(parsed) ? parsed : 0;
};

const getDownloadCount = (item: Wallpaper) => {
  const wallpaper = item as Wallpaper & Record<string, any>;

  return Math.max(
    toNumber(wallpaper.downloadCount),
    toNumber(wallpaper.download_count),
    toNumber(wallpaper.downloads),
    toNumber(wallpaper.downloadsThisWeek),
    toNumber(wallpaper.weeklyDownloads),
  );
};

const getCreatedTime = (item: Wallpaper) => {
  const wallpaper = item as Wallpaper & Record<string, any>;

  const value =
    wallpaper.createdAt ||
    wallpaper.created_at ||
    wallpaper.updatedAt ||
    wallpaper.updated_at;

  if (!value) return 0;

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
};

const isPremiumWallpaper = (item: Wallpaper) => {
  const wallpaper = item as Wallpaper & Record<string, any>;

  return Boolean(
    wallpaper.isPremium ||
    wallpaper.is_premium ||
    wallpaper.premium ||
    wallpaper.premiumOnly,
  );
};

const normalizeWallpaper = (item: Wallpaper, index: number): Wallpaper => {
  const wallpaper = item as Wallpaper & Record<string, any>;

  return {
    ...item,

    id: getWallpaperId(item, index),

    title: String(wallpaper.title || wallpaper.name || 'Wallpaper'),

    subtitle: wallpaper.subtitle,

    description: wallpaper.description,

    slug: wallpaper.slug,

    mediaType: wallpaper.mediaType || wallpaper.media_type,

    isVideo: Boolean(wallpaper.isVideo || wallpaper.is_video),

    imageUrl:
      toAbsoluteMediaUrl(wallpaper.videoPreviewUrl) ||
      toAbsoluteMediaUrl(wallpaper.video_preview_url) ||
      toAbsoluteMediaUrl(wallpaper.videoPreviewPath) ||
      toAbsoluteMediaUrl(wallpaper.video_preview_path) ||
      toAbsoluteMediaUrl(wallpaper.imageUrl) ||
      toAbsoluteMediaUrl(wallpaper.image_url) ||
      toAbsoluteMediaUrl(wallpaper.url) ||
      toAbsoluteMediaUrl(wallpaper.image) ||
      toAbsoluteMediaUrl(wallpaper.photoUrl) ||
      toAbsoluteMediaUrl(wallpaper.photo_url) ||
      toAbsoluteMediaUrl(wallpaper.mediaUrl) ||
      toAbsoluteMediaUrl(wallpaper.media_url) ||
      '',

    thumbnailUrl:
      toAbsoluteMediaUrl(wallpaper.videoThumbnailUrl) ||
      toAbsoluteMediaUrl(wallpaper.video_thumbnail_url) ||
      toAbsoluteMediaUrl(wallpaper.videoThumbnailPath) ||
      toAbsoluteMediaUrl(wallpaper.video_thumbnail_path) ||
      toAbsoluteMediaUrl(wallpaper.videoPreviewUrl) ||
      toAbsoluteMediaUrl(wallpaper.video_preview_url) ||
      toAbsoluteMediaUrl(wallpaper.videoPreviewPath) ||
      toAbsoluteMediaUrl(wallpaper.video_preview_path) ||
      toAbsoluteMediaUrl(wallpaper.thumbnailUrl) ||
      toAbsoluteMediaUrl(wallpaper.thumbnail_url) ||
      toAbsoluteMediaUrl(wallpaper.thumbnail) ||
      toAbsoluteMediaUrl(wallpaper.thumbUrl) ||
      toAbsoluteMediaUrl(wallpaper.thumb_url) ||
      '',

    videoUrl: wallpaper.videoUrl || wallpaper.video_url,

    videoPreviewUrl: wallpaper.videoPreviewUrl || wallpaper.video_preview_url,

    videoThumbnailUrl: wallpaper.videoThumbnailUrl || wallpaper.video_thumbnail_url,

    quality: wallpaper.quality || '',

    resolution: wallpaper.resolution,

    isFeatured: Boolean(wallpaper.isFeatured || wallpaper.is_featured),

    isPremium: isPremiumWallpaper(item),

    active: wallpaper.active === undefined ? true : Boolean(wallpaper.active),

    likes: toNumber(wallpaper.likes || wallpaper.likeCount || wallpaper.like_count),

    downloadCount: getDownloadCount(item),

    createdAt: wallpaper.createdAt || wallpaper.created_at || '',

    updatedAt:
      wallpaper.updatedAt ||
      wallpaper.updated_at ||
      wallpaper.createdAt ||
      wallpaper.created_at ||
      '',

    category: wallpaper.category,

    categoryId: wallpaper.categoryId || wallpaper.category_id,

    isFavorite: Boolean(wallpaper.isFavorite || wallpaper.is_favorite),

    isLiked: Boolean(wallpaper.isLiked || wallpaper.is_liked),
  };
};

const extractWallpapers = (payload: any): Wallpaper[] => {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.data?.wallpapers)) {
    return payload.data.wallpapers;
  }

  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.wallpapers)) {
    return payload.wallpapers;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

const uniqueWallpapers = (items: Wallpaper[]) => {
  const seen = new Set<string>();

  return items
    .map((item, index) => normalizeWallpaper(item, index))
    .filter((item, index) => {
      const id = getWallpaperId(item, index);

      if (seen.has(id)) return false;

      seen.add(id);
      return true;
    });
};

const getWallpaperImage = (item: Wallpaper) => {
  const wallpaper = item as Wallpaper & Record<string, any>;

  return (
    toAbsoluteMediaUrl(wallpaper.videoThumbnailUrl) ||
    toAbsoluteMediaUrl(wallpaper.video_thumbnail_url) ||
    toAbsoluteMediaUrl(wallpaper.videoPreviewUrl) ||
    toAbsoluteMediaUrl(wallpaper.video_preview_url) ||
    toAbsoluteMediaUrl(wallpaper.thumbnailUrl) ||
    toAbsoluteMediaUrl(wallpaper.imageUrl) ||
    toAbsoluteMediaUrl(wallpaper.thumbnail_url) ||
    toAbsoluteMediaUrl(wallpaper.image_url) ||
    toAbsoluteMediaUrl(wallpaper.url) ||
    toAbsoluteMediaUrl(wallpaper.image) ||
    toAbsoluteMediaUrl(wallpaper.thumbnail)
  );
};

const getCategoryName = (category: any) => {
  return String(category?.name || category?.title || 'Category');
};

const getCategorySlug = (category: any) => {
  return String(category?.slug || category?.categorySlug || category?.category_slug || '');
};


const VideoBadge = ({ item }: { item: Wallpaper }) => {
  if (!isVideoWallpaper(item as Wallpaper & Record<string, any>)) return null;

  return (
    <BlurView intensity={26} tint='dark' style={styles.videoBadge}>
      <Ionicons name='videocam' size={14} color={colors.textPrimary} />
    </BlurView>
  );
};

const WallpaperTile = ({
  item,
  onPress,
}: {
  item: Wallpaper;
  onPress: () => void;
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const image = imageFailed ? undefined : getWallpaperImage(item);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {image ? (
        <ImageBackground
          source={{ uri: image }}
          style={styles.cardImage}
          imageStyle={{ borderRadius: radius.lg }}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        >
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.02)',
              'rgba(0,0,0,0.12)',
              'rgba(0,0,0,0.88)',
            ]}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
          />

          {isPremiumWallpaper(item) ? (
            <BlurView intensity={26} tint="dark" style={styles.lockChip}>
              <Ionicons
                name="lock-closed"
                size={14}
                color={colors.textPrimary}
              />
            </BlurView>
          ) : null}

          <VideoBadge item={item} />

          <View style={styles.wallpaperNameBox}>
            <Text style={styles.wallpaperName} numberOfLines={2}>
              {item.title || 'Wallpaper'}
            </Text>
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.cardPlaceholder}>
          <Ionicons
            name="image-outline"
            size={30}
            color={colors.textSecondary}
          />

          {isPremiumWallpaper(item) ? (
            <BlurView intensity={26} tint="dark" style={styles.lockChip}>
              <Ionicons
                name="lock-closed"
                size={14}
                color={colors.textPrimary}
              />
            </BlurView>
          ) : null}

          <VideoBadge item={item} />

          <View style={styles.wallpaperNameBox}>
            <Text style={styles.wallpaperName} numberOfLines={2}>
              {item.title || 'Wallpaper'}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const CategoryDetailScreen = ({ navigation, route }: Props) => {
  const params = route.params as any;
  const category = params?.category ?? {};
  const initialFilter = String(params?.initialFilter || 'All') as CategoryFilter;
  const premiumOnly = Boolean(params?.premiumOnly);

  const [items, setItems] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categoryName = getCategoryName(category);
  const categorySlug = getCategorySlug(category);

  const visibleItems = useMemo(() => {
    const list = [...items];

    if (premiumOnly || initialFilter === 'Premium') {
      return list.filter(isPremiumWallpaper);
    }

    if (initialFilter === 'Popular') {
      return list.sort((a, b) => getDownloadCount(b) - getDownloadCount(a));
    }

    if (initialFilter === 'New') {
      return list.sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
    }

    return list;
  }, [initialFilter, items, premiumOnly]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug]);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!categorySlug) {
        setItems([]);
        return;
      }

      const res = await getCategoryWallpapers(categorySlug, 100, 0);

      const list = uniqueWallpapers(extractWallpapers(res));

      setItems(list);
    } catch (error) {
      console.log('CATEGORY DETAIL ERROR', error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openWallpaper = (wallpaper: Wallpaper) => {
    navigation.navigate('WallpaperDetails', { wallpaper });
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="category" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <RoundButton icon="chevron-back" onPress={() => navigation.goBack()} />

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {categoryName}
            </Text>

          </View>

          <View style={{ width: 44 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : (
          <FlatList
            data={visibleItems}
            keyExtractor={(item, index) => getWallpaperId(item, index)}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={
              visibleItems.length ? styles.columnWrapper : undefined
            }
            contentContainerStyle={[
              styles.listContent,
              !visibleItems.length && styles.emptyListContent,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                tintColor={colors.textPrimary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons
                  name="image-outline"
                  size={32}
                  color={colors.textSecondary}
                />

                <Text style={styles.emptyTitle}>No wallpapers found</Text>

                <Text style={styles.emptyText}>
                  Uploaded wallpapers for this category will appear here after
                  the backend returns them.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <WallpaperTile item={item} onPress={() => openWallpaper(item)} />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default CategoryDetailScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },

  headerTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
  },


  listContent: {
    paddingTop: spacing.lg,
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

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  cardImage: {
    flex: 1,
  },

  cardPlaceholder: {
    flex: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillSoft,
  },

  lockChip: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  videoBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },

  wallpaperNameBox: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
  },

  wallpaperName: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 17,
  },

  emptyBox: {
    marginHorizontal: spacing.xl,
    minHeight: 180,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.lg,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
  },

  emptyText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});