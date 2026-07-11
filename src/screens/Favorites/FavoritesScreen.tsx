import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  Animated,
  Easing,
  GestureResponderEvent,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import MeshBackground from '../../components/MeshBackground';
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

const CARD_FADE_ZOOM_DURATION = 320;
const CARD_STAGGER_DELAY = 45;
const MAX_STAGGERED_CARD_INDEX = 8;

const AnimatedFavoriteCard = React.memo(
  ({
    item,
    index,
    animationKey,
    onRemove,
    onPress,
  }: {
    item: FavoriteItem;
    index: number;
    animationKey: number;
    onRemove: (wallpaperId: string) => void;
    onPress: (wallpaper: FavoriteWallpaper) => void;
  }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
      opacity.setValue(0);
      scale.setValue(0.92);

      const delay = Math.min(index, MAX_STAGGERED_CARD_INDEX) * CARD_STAGGER_DELAY;

      const animation = Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: CARD_FADE_ZOOM_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: CARD_FADE_ZOOM_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      animation.start();

      return () => {
        animation.stop();
      };
    }, [animationKey, index, opacity, scale]);

    return (
      <Animated.View
        style={[
          styles.animatedCardWrap,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <FavoriteCard item={item} onRemove={onRemove} onPress={onPress} />
      </Animated.View>
    );
  },
);

AnimatedFavoriteCard.displayName = 'AnimatedFavoriteCard';

const EMPTY_HEART_SIZE = 58;

const EmptyState = React.memo(() => {
  // The icon and label fade in together without any slide movement.
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const wholeHeartOpacity = useRef(new Animated.Value(1)).current;
  const wholeHeartTranslateX = useRef(new Animated.Value(0)).current;
  const wholeHeartRotate = useRef(new Animated.Value(0)).current;

  const brokenHeartOpacity = useRef(new Animated.Value(0)).current;
  const brokenHeartScale = useRef(new Animated.Value(0.92)).current;

  const crackFlashOpacity = useRef(new Animated.Value(0)).current;
  const crackFlashScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    contentOpacity.setValue(0);

    wholeHeartOpacity.setValue(1);
    wholeHeartTranslateX.setValue(0);
    wholeHeartRotate.setValue(0);

    brokenHeartOpacity.setValue(0);
    brokenHeartScale.setValue(0.92);

    crackFlashOpacity.setValue(0);
    crackFlashScale.setValue(0.7);

    const animation = Animated.sequence([
      // Heart/text appear while the crack shake begins immediately.
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(wholeHeartTranslateX, {
              toValue: -4,
              duration: 55,
              useNativeDriver: true,
            }),
            Animated.timing(wholeHeartRotate, {
              toValue: -1,
              duration: 55,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(wholeHeartTranslateX, {
              toValue: 4,
              duration: 65,
              useNativeDriver: true,
            }),
            Animated.timing(wholeHeartRotate, {
              toValue: 1,
              duration: 65,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(wholeHeartTranslateX, {
              toValue: -2,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(wholeHeartRotate, {
              toValue: -0.5,
              duration: 50,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(wholeHeartTranslateX, {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(wholeHeartRotate, {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),

      Animated.parallel([
        Animated.timing(wholeHeartOpacity, {
          toValue: 0,
          duration: 90,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brokenHeartOpacity, {
          toValue: 1,
          duration: 130,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brokenHeartScale, {
          toValue: 1,
          duration: 170,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(crackFlashOpacity, {
              toValue: 0.75,
              duration: 45,
              useNativeDriver: true,
            }),
            Animated.timing(crackFlashScale, {
              toValue: 1,
              duration: 70,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(crackFlashOpacity, {
            toValue: 0,
            duration: 100,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [
    brokenHeartOpacity,
    brokenHeartScale,
    contentOpacity,
    crackFlashOpacity,
    crackFlashScale,
    wholeHeartOpacity,
    wholeHeartRotate,
    wholeHeartTranslateX,
  ]);

  const wholeHeartRotation = wholeHeartRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  return (
    <View style={styles.emptyWrap}>
      <Animated.View
        style={[styles.emptyContent, { opacity: contentOpacity }]}
      >
        <View style={styles.emptyHeartStage}>
          <Animated.View
            style={[
              styles.emptyHeartLayer,
              {
                opacity: wholeHeartOpacity,
                transform: [
                  { translateX: wholeHeartTranslateX },
                  { rotate: wholeHeartRotation },
                ],
              },
            ]}
          >
            <Ionicons name="heart" size={EMPTY_HEART_SIZE} color="#FFFFFF" />
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.emptyHeartCrackFlash,
              {
                opacity: crackFlashOpacity,
                transform: [
                  { rotate: '-16deg' },
                  { scale: crackFlashScale },
                ],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.emptyHeartLayer,
              {
                opacity: brokenHeartOpacity,
                transform: [{ scale: brokenHeartScale }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="heart-broken"
              size={EMPTY_HEART_SIZE}
              color="#FFFFFF"
            />
          </Animated.View>
        </View>

        <Text style={styles.emptyTitle}>No favorites yet</Text>
      </Animated.View>
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
  const [emptyAnimationKey, setEmptyAnimationKey] = useState(0);
  const [cardsAnimationKey, setCardsAnimationKey] = useState(0);

  // Keep the header, title and filters mounted after the first successful load.
  // Later visits refresh only the wallpaper data in the background.
  const hasLoadedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setEmptyAnimationKey(current => current + 1);
      setCardsAnimationKey(current => current + 1);

      void loadFavorites(!hasLoadedOnce.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const loadFavorites = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await getFavorites();

      setFavorites(extractFavoriteWallpapers(response));
      hasLoadedOnce.current = true;
    } finally {
      if (showLoader) {
        setLoading(false);
      }

      setRefreshing(false);
    }
  };

  const loadLiveFavorites = async () => {
    const response = await getLiveFavorites();

    const items = extractFavoriteWallpapers(response);

    setLiveFavorites(items);
  };

  const onFilterChange = async (next: Filter) => {
    if (next === filter) {
      return;
    }

    setFilter(next);
    setCardsAnimationKey(current => current + 1);

    if (next === 'Live') {
      await loadLiveFavorites();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    await loadFavorites(false);
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
          void loadFavorites(false);
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
      void loadFavorites(false);
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
          ListEmptyComponent={
            <EmptyState key={`empty-${filter}-${emptyAnimationKey}`} />
          }
          renderItem={({ item, index }) =>
            item?.wallpaper ? (
              <AnimatedFavoriteCard
                item={item}
                index={index}
                animationKey={cardsAnimationKey}
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

  animatedCardWrap: {
    width: CARD_W,
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
    flex: 1,
    minHeight: Math.max(280, SCREEN.height * 0.42),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 70,
  },

  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyHeartStage: {
    width: EMPTY_HEART_SIZE + 12,
    height: EMPTY_HEART_SIZE + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyHeartLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyHeartCrackFlash: {
    position: 'absolute',
    width: 13,
    height: 42,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});