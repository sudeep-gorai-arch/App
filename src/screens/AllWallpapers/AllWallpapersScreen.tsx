import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { colors } from '../../styles/colors';
import { spacing, radius, SCREEN } from '../../utils/constants';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import API from '../../services/api';
import { getWallpapers } from '../../services/wallpaperService';
import { Wallpaper } from '../../services/types';
import AdController from '../../ads/AdController';

type Props = NativeStackScreenProps<RootStackParamList, 'AllWallpapers'>;

const PAGE_SIZE = 10;
const GAP = spacing.md;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.52;

const API_ORIGIN = String(API.defaults.baseURL || '').replace(/\/api\/?$/, '');

const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

const isBlankishValue = (value: unknown) => {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();

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

  if (url.startsWith('//')) return `https:${url}`;

  if (url.startsWith('/')) {
    return API_ORIGIN ? `${API_ORIGIN}${url}` : url;
  }

  return API_ORIGIN ? `${API_ORIGIN}/${url}` : url;
};

const getWallpaperImage = (item: Wallpaper) => {
  const w = item as Wallpaper & Record<string, any>;

  if (isVideoWallpaper(w)) {
    return (
      toAbsoluteMediaUrl(w.videoPreviewUrl) ||
      toAbsoluteMediaUrl(w.video_preview_url) ||
      toAbsoluteMediaUrl(w.videoPreviewPath) ||
      toAbsoluteMediaUrl(w.video_preview_path) ||
      toAbsoluteMediaUrl(w.videoThumbnailUrl) ||
      toAbsoluteMediaUrl(w.video_thumbnail_url) ||
      toAbsoluteMediaUrl(w.videoThumbnailPath) ||
      toAbsoluteMediaUrl(w.video_thumbnail_path) ||
      toAbsoluteMediaUrl(w.thumbnailUrl) ||
      toAbsoluteMediaUrl(w.imageUrl) ||
      toAbsoluteMediaUrl(w.thumbnail_url) ||
      toAbsoluteMediaUrl(w.image_url) ||
      toAbsoluteMediaUrl(w.image) ||
      toAbsoluteMediaUrl(w.thumbnail) ||
      toAbsoluteMediaUrl(w.photoUrl) ||
      toAbsoluteMediaUrl(w.photo_url) ||
      toAbsoluteMediaUrl(w.mediaUrl) ||
      toAbsoluteMediaUrl(w.media_url)
    );
  }

  return (
    toAbsoluteMediaUrl(w.thumbnailUrl) ||
    toAbsoluteMediaUrl(w.imageUrl) ||
    toAbsoluteMediaUrl(w.thumbnail_url) ||
    toAbsoluteMediaUrl(w.image_url) ||
    toAbsoluteMediaUrl(w.url) ||
    toAbsoluteMediaUrl(w.image) ||
    toAbsoluteMediaUrl(w.thumbnail) ||
    toAbsoluteMediaUrl(w.photoUrl) ||
    toAbsoluteMediaUrl(w.photo_url) ||
    toAbsoluteMediaUrl(w.mediaUrl) ||
    toAbsoluteMediaUrl(w.media_url)
  );
};

const formatLikes = (likes?: number) => {
  if (likes === undefined || likes === null) return '0';
  if (likes >= 1000) return `${(likes / 1000).toFixed(1).replace('.0', '')}K`;
  return String(likes);
};

const mergeUnique = (oldItems: Wallpaper[], newItems: Wallpaper[]) => {
  const seen = new Set<string>();

  return [...oldItems, ...newItems].filter(item => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const QualityChip = ({ item }: { item: Wallpaper }) => {
  if (isVideoWallpaper(item as Wallpaper & Record<string, any>)) {
    return (
      <BlurView
        intensity={28}
        tint="dark"
        style={[styles.qualityChip, styles.videoQualityChip]}
      >
        <Ionicons name="videocam" size={14} color={colors.textPrimary} />
      </BlurView>
    );
  }

  return (
    <BlurView intensity={28} tint="dark" style={styles.qualityChip}>
      <Text style={styles.qualityText}>{item.quality || '4K'}</Text>
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

  if (!image) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          styles.missingCard,
          pressed && styles.cardPressed,
        ]}
      >
        <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
        <Text style={styles.missingText}>Image URL missing</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <ImageBackground
        source={{ uri: image }}
        style={styles.cardImage}
        imageStyle={{ borderRadius: radius.lg }}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0)', 'rgba(5,4,14,0.82)']}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />

        <View style={styles.cardTop}>
          {(item as any).isPremium ? (
            <BlurView intensity={30} tint="dark" style={styles.lockChip}>
              <Ionicons
                name="lock-closed"
                size={14}
                color={colors.textPrimary}
              />
            </BlurView>
          ) : null}
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title || 'Wallpaper'}
          </Text>

          <View style={styles.metaRow}>
            <QualityChip item={item} />

            <View style={styles.likePill}>
              <Ionicons
                name="heart-outline"
                size={13}
                color={colors.textPrimary}
              />
              <Text style={styles.likeText}>{formatLikes(item.likes)}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const AllWallpapersScreen = ({ navigation }: Props) => {
  const loadingMoreRef = useRef(false);
  const [items, setItems] = useState<Wallpaper[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);

  const loadPage = useCallback(
    async (reset = false) => {
      if (loadingMoreRef.current && !reset) return;
      if (reachedEnd && !reset) return;

      const nextOffset = reset ? 0 : offset;

      loadingMoreRef.current = true;

      try {
        if (reset) {
          setLoading(items.length === 0);
          setRefreshing(items.length > 0);
          setReachedEnd(false);
        } else {
          setLoadingMore(true);
        }

        const res = await getWallpapers({
          limit: PAGE_SIZE,
          offset: nextOffset,
        });

        const batch = res.data ?? [];

        setItems(prev => (reset ? batch : mergeUnique(prev, batch)));
        setOffset(nextOffset + batch.length);
        setReachedEnd(batch.length < PAGE_SIZE);
      } catch (error) {
        console.log(
          'ALL WALLPAPERS ERROR',
          (error as any)?.response?.data || (error as any)?.message || error,
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [items.length, offset, reachedEnd],
  );

  useEffect(() => {
    loadPage(true);
  }, []);

  const onEndReached = () => {
    if (!loading && !loadingMore && !reachedEnd) {
      loadPage(false);
    }
  };

  const renderItem = ({ item }: { item: Wallpaper }) => (
    <WallpaperTile
      item={item}
      onPress={() =>
        AdController.navigateWithAd(() => {
          navigation.navigate('WallpaperDetails', {
            wallpaper: item,
          });
        })
      }
    />
  );

  return (
    <View style={styles.root}>
      <MeshBackground variant="home" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              AdController.navigateWithAd(() => {
                navigation.goBack();
              })
            }
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.textPrimary}
              />
            </BlurView>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>All Wallpapers</Text>
            <Text style={styles.headerSub}>Loads 10 wallpapers at a time</Text>
          </View>

          <View style={{ width: 46 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.45}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            removeClippedSubviews
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadPage(true)}
                tintColor={colors.textPrimary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons
                  name="images-outline"
                  size={30}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>No wallpapers found.</Text>
              </View>
            }
            ListFooterComponent={
              <View style={styles.footer}>
                {loadingMore ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : reachedEnd && items.length > 0 ? (
                  <Text style={styles.endText}>You reached the end.</Text>
                ) : null}
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default AllWallpapersScreen;

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
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backButtonBlur: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  listContent: {
    paddingTop: spacing.lg,
    paddingBottom: 130,
    gap: GAP,
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
    backgroundColor: colors.baseElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  cardImage: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.baseElevated,
  },
  missingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: 8,
  },
  missingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardTop: {
    alignItems: 'flex-end',
    padding: spacing.sm,
  },
  lockChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  cardBottom: {
    padding: spacing.sm,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qualityChip: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 11,
    fontWeight: '800',
  },
  likePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  likeText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyBox: {
    marginHorizontal: spacing.xl,
    height: 180,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  endText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
});
