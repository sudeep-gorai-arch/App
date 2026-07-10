import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  GestureResponderEvent,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import PremiumActionButton from '../../components/PremiumActionButton';

import API from '../../services/api';
import { colors, gradients } from '../../styles/colors';
import { fontFamily } from '../../styles/typography';

import { spacing, radius, SCREEN } from '../../utils/constants';

import {
  getFavorites,
  removeFavorite,
  getLiveFavorites,
} from '../../services/favoriteService';

import { Wallpaper } from '../../services/types';
import { appEvents } from '../../utils/appEvents';

const flexiWallsLogo = require('../../assets/images/flexiwalls-logo.png');

const GAP = spacing.lg;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.4;

const FILTERS = ['All', 'Premium', 'Live'] as const;

type Filter = (typeof FILTERS)[number];

type FavoriteWallpaper = Wallpaper & Record<string, any>;

type FavoriteItem = {
  id: string;
  favoriteKey: string;
  wallpaper: FavoriteWallpaper;
  createdAt?: string;
};

const API_ORIGIN = String(API.defaults.baseURL || '').replace(/\/api\/?$/, '');

const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

const getWallpaperMediaType = (item?: Record<string, any>) =>
  String(item?.mediaType ?? '').toUpperCase();

const isVideoWallpaper = (item?: Record<string, any> | null) => {
  if (!item) {
    return false;
  }

  return item.mediaType === 'VIDEO' || !!item.videoUrl;
};

const toAbsoluteMediaUrl = (value?: string | null) => {
  if (!value) return '';

  const url = String(value).trim();

  if (!url) return '';

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

const toNumber = (value: unknown) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const formatCount = (value?: number | string) => {
  const count = toNumber(value);

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace('.0', '')}K`;
  }

  return String(count);
};

const getFavoriteCount = (wallpaper: FavoriteWallpaper) => {
  return toNumber(wallpaper.favoriteCount ?? wallpaper._count?.favorites);
};

const getVariantUrl = (item: any, preferredTypes: string[]) => {
  const variants = item?.wallpaperVariants ?? [];

  for (const type of preferredTypes) {
    const variant = variants.find((v: any) => v.type === type);

    if (variant?.url) {
      return variant.url;
    }
  }

  return variants.find((v: any) => v.isDefault)?.url;
};

const getRawImageUrl = (item: any) =>
  item?.imageUrl ?? getVariantUrl(item, ['DISPLAY', 'ORIGINAL']);

const getRawThumbnailUrl = (item: any) => item?.thumbnailUrl ?? item?.imageUrl;

const normalizeWallpaper = (
  wallpaper: FavoriteWallpaper,
  index: number,
): FavoriteWallpaper => {
  const favoriteCount = getFavoriteCount(wallpaper);

  return {
    ...wallpaper,

    id: String(wallpaper.id ?? `wallpaper-${index}`),

    title: wallpaper.title ?? 'Wallpaper',

    imageUrl: toAbsoluteMediaUrl(getRawImageUrl(wallpaper)),

    thumbnailUrl: toAbsoluteMediaUrl(getRawThumbnailUrl(wallpaper)),

    likes: toNumber(wallpaper.likes),

    downloadCount: toNumber(wallpaper.downloadCount),

    favoriteCount,

    favoritesCount: favoriteCount,

    quality: wallpaper.quality ?? '',

    isPremium: wallpaper.isPremium ?? false,

    category: wallpaper.category,

    categoryId: wallpaper.categoryId,

    createdAt: wallpaper.createdAt ?? '',

    updatedAt: wallpaper.updatedAt ?? wallpaper.createdAt ?? '',

    isFavorite: true,
  };
};

const extractFavoriteArray = (payload: any): any[] => {
  return Array.isArray(payload?.data) ? payload.data : [];
};

const normalizeFavoriteItem = (
  item: any,
  index: number,
): FavoriteItem | null => {
  const wallpaper = normalizeWallpaper(item, index);

  if (!wallpaper.id) {
    return null;
  }

  return {
    id: wallpaper.id,
    favoriteKey: wallpaper.id,
    wallpaper,
    createdAt: wallpaper.createdAt,
  };
};

const extractFavoriteWallpapers = (payload: any): FavoriteItem[] => {
  const seen = new Set<string>();

  return extractFavoriteArray(payload)
    .map(normalizeFavoriteItem)
    .filter((item): item is FavoriteItem => !!item)
    .filter(item => {
      if (seen.has(item.wallpaper.id)) {
        return false;
      }

      seen.add(item.wallpaper.id);
      return true;
    });
};

const getWallpaperImage = (wallpaper: FavoriteWallpaper) =>
  toAbsoluteMediaUrl(wallpaper.thumbnailUrl || wallpaper.imageUrl);

const getWallpaperEventId = (wallpaper: FavoriteWallpaper) => wallpaper.id;

const createFavoriteItemFromWallpaper = (
  wallpaperInput: FavoriteWallpaper,
  index = 0,
): FavoriteItem | null => {
  const wallpaper = normalizeWallpaper(
    {
      ...wallpaperInput,
      isFavorite: true,
    },
    index,
  );

  return {
    id: wallpaper.id,
    favoriteKey: wallpaper.id,
    wallpaper,
    createdAt: wallpaper.createdAt || new Date().toISOString(),
  };
};

const patchFavoriteWallpaper = (
  wallpaper: FavoriteWallpaper,
  patch: Partial<FavoriteWallpaper>,
  index = 0,
) => {
  return normalizeWallpaper(
    {
      ...wallpaper,
      ...patch,
      isFavorite: true,
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
            onPress={() => navigation.navigate('Search')}
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
  return isVideoWallpaper(wallpaper) ? (
    <BlurView
      intensity={26}
      tint="dark"
      style={[styles.qualityChip, styles.videoQualityChip]}
    >
      <Ionicons name="videocam" size={14} color={colors.textPrimary} />
    </BlurView>
  ) : (
    <BlurView intensity={26} tint="dark" style={styles.qualityChip}>
      <Text style={styles.qualityText}>{wallpaper.quality || 'HD'}</Text>
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

  const handleRemove = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onRemove(wallpaper.id);
  };

  const CardContent = () => (
    <>
      <QualityChip wallpaper={wallpaper} />

      <Pressable hitSlop={8} onPress={handleRemove} style={styles.heartWrap}>
        <BlurView intensity={30} tint="dark" style={styles.heartChip}>
          <Ionicons name="heart" size={18} color={colors.heart} />
        </BlurView>
      </Pressable>

      <View style={styles.cardMeta}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {wallpaper.title}
        </Text>

        <View style={styles.cardMetaRow}>
          <Text style={styles.cardCategory} numberOfLines={1}>
            {wallpaper.category?.name ?? 'Wallpaper'}
          </Text>

          <View style={styles.likeRow}>
            <Ionicons name="heart" size={12} color={colors.textSecondary} />

            <Text style={styles.likeText}>
              {formatCount(wallpaper.favoriteCount)}
            </Text>
          </View>
        </View>
      </View>
    </>
  );

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
              'rgba(8,6,20,0.05)',
              'rgba(8,6,20,0.2)',
              'rgba(8,6,20,0.82)',
            ]}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: radius.lg,
              },
            ]}
          />

          <CardContent />
        </ImageBackground>
      ) : (
        <View style={styles.cardPlaceholder}>
          <Ionicons
            name="image-outline"
            size={30}
            color={colors.textSecondary}
          />

          <CardContent />
        </View>
      )}
    </Pressable>
  );
};

const EmptyState = React.memo(() => {
  return (
    <View style={styles.emptyWrap}>
      <Card
        padding={spacing.xxl}
        glowBorder
        style={{
          alignItems: 'center',
        }}
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
});

EmptyState.displayName = 'EmptyState';

const FavoritesScreen = () => {
  const navigation = useNavigation<any>();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [liveFavorites, setLiveFavorites] = useState<FavoriteItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState<'All' | 'Premium' | 'Live'>('All');

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const loadFavorites = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await getFavorites();

      setFavorites(extractFavoriteWallpapers(response));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLiveFavorites = async () => {
    const response = await getLiveFavorites();

    const items = extractFavoriteWallpapers(response);

    setLiveFavorites(items);
  };

  const onFilterChange = async (next: Filter) => {
    setFilter(next);

    if (next === 'Live') {
    
      await loadLiveFavorites();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    await loadFavorites(true);
  };

  useEffect(() => {
    const unsubscribeFavorites = appEvents.on('favoritesChanged', payload => {
      const wallpaperId = String(
        payload.wallpaperId || payload.wallpaper?.id || '',
      );

      if (!wallpaperId) {
        return;
      }

      if (!payload.isFavorite) {
        setFavorites(current =>
          current.filter(
            item => getWallpaperEventId(item.wallpaper) !== wallpaperId,
          ),
        );
        return;
      }

      setFavorites(current => {
        const existingIndex = current.findIndex(
          item => getWallpaperEventId(item.wallpaper) === wallpaperId,
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

    const unsubscribeWallpaper = appEvents.on('wallpaperChanged', payload => {
      const wallpaperId = String(
        payload.wallpaperId || payload.wallpaper?.id || '',
      );

      if (!wallpaperId || !payload.wallpaper) {
        return;
      }

      setFavorites(current =>
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

    const unsubscribeWallpapers = appEvents.on('wallpapersChanged', () => {
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
    const previousItems = favorites;
    const removedItem = favorites.find(
      item => getWallpaperEventId(item.wallpaper) === wallpaperId,
    );

    if (!removedItem) {
      return;
    }

    const rollbackWallpaper = removedItem.wallpaper;
    const nextFavoriteCount = Math.max(
      0,
      getFavoriteCount(rollbackWallpaper) - 1,
    );

    setFavorites(prev =>
      prev.filter(item => getWallpaperEventId(item.wallpaper) !== wallpaperId),
    );

    appEvents.emit('favoritesChanged', {
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

      appEvents.emit('favoritesChanged', {
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
      console.log('REMOVE FAVORITE ERROR', error);

      setFavorites(previousItems);

      appEvents.emit('favoritesChanged', {
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

  const isPremiumWallpaper = (wallpaper: FavoriteWallpaper) => {
    return (
      wallpaper?.isPremium === true ||
      wallpaper?.is_premium === true ||
      wallpaper?.premium === true ||
      wallpaper?.premiumOnly === true
    );
  };

  const data = useMemo(() => {
    switch (filter) {
      case 'Premium':
        return favorites.filter(item => isPremiumWallpaper(item.wallpaper));

      case 'Live':
        return liveFavorites;

      case 'All':
      default:
        return favorites;
    }
  }, [filter, favorites, liveFavorites]);

  const openWallpaper = (wallpaper: FavoriteWallpaper) => {
    const parentNavigation = navigation.getParent?.();

    if (parentNavigation) {
      parentNavigation.navigate('WallpaperDetails', { wallpaper });
      return;
    }

    navigation.navigate('WallpaperDetails', { wallpaper });
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

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
                {FILTERS.map(f => {
                  const active = f === filter;

                  return (
                    <Pressable
                      key={f}
                      style={styles.filterItem}
                      onPress={() => onFilterChange(f)}
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
    justifyContent: 'center',
    alignItems: 'center',
  },

  favoritesHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 0,
  },

  favoritesActionRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'visible',
    marginBottom: -8,
  },

  favoritesLogoLeft: {
    width: 175,
    height: 120,
    marginLeft: -18,
    marginTop: 8,
  },

  favoritesRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },

  favoritesPremiumButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },

  favoritesRightButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  favoritesRoundButton: {
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
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillSoft,
  },

  filterItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterActive: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
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
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillSoft,
  },

  qualityChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    overflow: 'hidden',
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
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },

  heartWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  heartChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  cardMeta: {
    position: 'absolute',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    marginTop: 6,
  },
});
