import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import MeshBackground from '../../components/MeshBackground';
import PremiumActionButton from '../../components/PremiumActionButton';

import API from '../../services/api';
import { getCategories } from '../../services/categoryService';
import {
  getTrendingWallpapers,
  getWallpapers,
} from '../../services/wallpaperService';
import { Category, Wallpaper } from '../../services/types';

import { appEvents } from '../../utils/appEvents';
import { colors } from '../../styles/colors';
import { typography, fontFamily } from '../../styles/typography';
import { spacing, radius, SCREEN } from '../../utils/constants';

const flexiWallsLogo = require('../../assets/images/flexiwalls-logo.png');

const TREND_CARD_W = 190;
const TREND_CARD_H = 300;
const TREND_SNAP = 110;
const TREND_SIDE_PADDING = (SCREEN.width - TREND_SNAP) / 2;
const TRENDING_HUB_LIMIT = 10;

const GRID_GAP = spacing.md;
const GRID_CARD_W = (SCREEN.width - spacing.xl * 2 - GRID_GAP) / 2;
const GRID_CARD_H = GRID_CARD_W * 1.52;

const API_ORIGIN = String(API.defaults.baseURL || '').replace(/\/api\/?$/, '');

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

const ALL_CATEGORY: CategoryOption = {
  id: 'all',
  name: 'All',
  slug: 'all',
};

const slugify = (value?: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalizeCategory = (item: Category): CategoryOption => {
  const c = item as Category & Record<string, any>;
  const name = c.name || c.title || c.label || 'Category';
  const slug = c.slug || c.categorySlug || c.category_slug || slugify(name);

  return {
    id: String(c.id || slug),
    name,
    slug,
  };
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

const getVariantUrl = (item: any, preferredTypes: string[]) => {
  const variants = Array.isArray(item?.wallpaperVariants)
    ? item.wallpaperVariants
    : Array.isArray(item?.variants)
      ? item.variants
      : [];

  for (const type of preferredTypes) {
    const found = variants.find(
      (variant: any) =>
        String(variant?.type || '').toUpperCase() === type.toUpperCase(),
    );

    const url =
      found?.url ||
      found?.path ||
      found?.imageUrl ||
      found?.image_url ||
      found?.thumbnailUrl ||
      found?.thumbnail_url;

    if (url) return url;
  }

  const defaultVariant = variants.find((variant: any) => variant?.isDefault);

  return (
    defaultVariant?.url ||
    defaultVariant?.path ||
    defaultVariant?.imageUrl ||
    defaultVariant?.image_url
  );
};

const getRawImageUrl = (item: any) =>
  item?.imageUrl ||
  item?.image_url ||
  item?.displayPath ||
  item?.display_path ||
  getVariantUrl(item, ['DISPLAY', 'ORIGINAL', 'THUMBNAIL']) ||
  item?.url ||
  item?.image ||
  item?.photoUrl ||
  item?.photo_url ||
  item?.mediaUrl ||
  item?.media_url ||
  item?.originalPath ||
  item?.original_path;

const getRawThumbnailUrl = (item: any) =>
  item?.thumbnailUrl ||
  item?.thumbnail_url ||
  item?.thumbnailPath ||
  item?.thumbnail_path ||
  getVariantUrl(item, ['THUMBNAIL', 'DISPLAY', 'ORIGINAL']) ||
  item?.thumbnail ||
  item?.thumbUrl ||
  item?.thumb_url ||
  item?.displayPath ||
  item?.display_path ||
  item?.imageUrl ||
  item?.image_url;

const getWallpaperId = (item: Wallpaper | Record<string, any>, index = 0) => {
  const w = item as Wallpaper & Record<string, any>;

  return String(
    w.id ||
      w._id ||
      w.wallpaperId ||
      w.wallpaper_id ||
      w.uuid ||
      `wallpaper-${index}`,
  );
};

const getWallpaperEventId = (item: Wallpaper | Record<string, any>) => {
  const w = item as Wallpaper & Record<string, any>;

  return String(
    w?.id || w?._id || w?.wallpaperId || w?.wallpaper_id || w?.uuid || '',
  );
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? '').replace(/[^\d]/g, ''));

  return Number.isFinite(parsed) ? parsed : 0;
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

const normalizeWallpaper = (item: Wallpaper, index: number): Wallpaper => {
  const w = item as Wallpaper & Record<string, any>;

  const favoriteCount = Math.max(
    toNumber(w.favoriteCount),
    toNumber(w.favorite_count),
    toNumber(w.favoritesCount),
    toNumber(w.favorites_count),
    toNumber(w._count?.favorites),
    toNumber(w.favorites),
  );

  const downloadCount = Math.max(
    toNumber(w.downloadsThisWeek),
    toNumber(w.weeklyDownloads),
    toNumber(w.downloads_this_week),
    toNumber(w.week_downloads),
    toNumber(w.downloadCount),
    toNumber(w.download_count),
    toNumber(w.downloads),
  );

  return {
    ...item,

    id: getWallpaperId(item, index),

    title: w.title || w.name || '',

    subtitle: w.subtitle,

    description: w.description,

    slug: w.slug,

    imageUrl: toAbsoluteMediaUrl(getRawImageUrl(w)) || '',

    thumbnailUrl: toAbsoluteMediaUrl(getRawThumbnailUrl(w)) || '',

    quality: w.quality || '',

    resolution: w.resolution,

    likes: Number(w.likes ?? w.likeCount ?? w.like_count ?? 0),

    downloadCount,

    isFeatured: Boolean(w.isFeatured),

    isPremium: Boolean(w.isPremium),

    active: w.active === undefined ? true : Boolean(w.active),

    createdAt: w.createdAt || w.created_at || '',

    updatedAt: w.updatedAt || w.updated_at || w.createdAt || w.created_at || '',

    category: w.category,

    categoryId: w.categoryId,

    isFavorite: Boolean(w.isFavorite || w.is_favorite),

    isLiked: Boolean(w.isLiked),

    videoUrl: w.videoUrl,

    favoriteCount,
    favoritesCount: favoriteCount,

    downloadsThisWeek: downloadCount,
    weeklyDownloads: downloadCount,
  } as Wallpaper;
};

const extractWallpapers = (payload: any): Wallpaper[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.wallpapers)) return payload.data.wallpapers;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.wallpapers)) return payload.wallpapers;
  if (Array.isArray(payload?.items)) return payload.items;

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

const patchWallpaperList = (
  items: Wallpaper[],
  wallpaperId: string,
  patch: Record<string, any>,
) => {
  if (!wallpaperId) return items;

  let changed = false;

  const nextItems = items.map((item, index) => {
    if (getWallpaperEventId(item) !== wallpaperId) {
      return item;
    }

    changed = true;

    return normalizeWallpaper(
      {
        ...(item as Wallpaper & Record<string, any>),
        ...patch,
      } as Wallpaper,
      index,
    );
  });

  return changed ? nextItems : items;
};

const getWallpaperImage = (item: Wallpaper) => {
  const w = item as Wallpaper & Record<string, any>;

  return (
    toAbsoluteMediaUrl(getRawThumbnailUrl(w)) ||
    toAbsoluteMediaUrl(getRawImageUrl(w)) ||
    undefined
  );
};

const getFavoriteCount = (item: Wallpaper) => {
  const w = item as Wallpaper & Record<string, any>;

  return Math.max(
    toNumber(w.favoriteCount),
    toNumber(w.favorite_count),
    toNumber(w.favoritesCount),
    toNumber(w.favorites_count),
    toNumber(w._count?.favorites),
    toNumber(w.favorites),
  );
};

const getDownloadCount = (item: Wallpaper) => {
  const w = item as Wallpaper & Record<string, any>;

  return Math.max(
    toNumber(w.downloadsThisWeek),
    toNumber(w.weeklyDownloads),
    toNumber(w.downloads_this_week),
    toNumber(w.week_downloads),
    toNumber(w.downloadCount),
    toNumber(w.download_count),
    toNumber(w.downloads),
  );
};

const sortByDownloads = (items: Wallpaper[]) =>
  [...items].sort((a, b) => getDownloadCount(b) - getDownloadCount(a));

const fetchCategoryWallpapersFromApi = async (category: CategoryOption) => {
  try {
    if (category.slug === 'all') {
      const response = await API.get('/wallpapers', {
        params: {
          limit: 80,
          offset: 0,
        },
      });

      return uniqueWallpapers(extractWallpapers(response.data));
    }

    const response = await getWallpapers({
      limit: 80,
      offset: 0,
      category: category.slug,
    });

    return uniqueWallpapers(extractWallpapers(response));
  } catch (error) {
    console.log('CATEGORY WEEKLY API ERROR', error);
    return [];
  }
};

const fetchWeeklyTopWallpapers = async (
  trendingList: Wallpaper[],
  category: CategoryOption,
) => {
  try {
    const params =
      category.slug === 'all'
        ? { limit: 10 }
        : {
            limit: 10,
            category: category.slug,
            categorySlug: category.slug,
          };

    const response = await API.get('/wallpapers/top-week', {
      params,
    });

    const weeklyList = uniqueWallpapers(extractWallpapers(response.data));

    if (weeklyList.length) {
      return sortByDownloads(weeklyList).slice(0, 10);
    }
  } catch (error) {
    console.log('TOP WEEK WALLPAPERS API ERROR', error);
  }

  const categoryWallpapers = await fetchCategoryWallpapersFromApi(category);

  if (categoryWallpapers.length) {
    return sortByDownloads(categoryWallpapers).slice(0, 10);
  }

  if (category.slug === 'all') {
    const trendingTopList = sortByDownloads(trendingList).slice(0, 10);

    if (trendingTopList.length) {
      return trendingTopList;
    }
  }

  return [];
};

const TrendingTopHeader = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.trendingHeader}>
      <View style={styles.trendingActionRow}>
        <Image
          source={flexiWallsLogo}
          style={styles.trendingLogoLeft}
          resizeMode="contain"
        />

        <View style={styles.trendingRightActions}>
          <PremiumActionButton
            returnTo="Trending"
            style={styles.trendingPremiumButton}
          />

          <Pressable
            onPress={() => navigation.navigate('Search')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.trendingRightButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <BlurView
              intensity={30}
              tint="dark"
              style={styles.trendingRoundButton}
            >
              <Ionicons name="search" size={20} color={colors.textPrimary} />
            </BlurView>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const CategoryChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.categoryChipPressable,
      { opacity: pressed ? 0.75 : 1 },
    ]}
  >
    <BlurView
      intensity={active ? 44 : 26}
      tint="dark"
      style={[styles.categoryChip, active && styles.categoryChipActive]}
    >
      <Text
        style={[
          styles.categoryChipText,
          active && styles.categoryChipTextActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </BlurView>
  </Pressable>
);

const CategorySelector = ({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: CategoryOption[];
  selectedCategory: CategoryOption;
  onSelect: (category: CategoryOption) => void;
}) => {
  return (
    <View style={styles.categorySelectorRow}>
      <CategoryChip
        label="All"
        active={selectedCategory.slug === 'all'}
        onPress={() => onSelect(ALL_CATEGORY)}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categorySliderContent}
        style={styles.categorySlider}
      >
        {categories.map(category => (
          <CategoryChip
            key={category.id}
            label={category.name}
            active={selectedCategory.slug === category.slug}
            onPress={() => onSelect(category)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const TrendStackCard = ({
  item,
  onPress,
}: {
  item: Wallpaper;
  index: number;
  onPress: () => void;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const image = imageFailed ? undefined : getWallpaperImage(item);

  const content = image ? (
    <ImageBackground
      source={{ uri: image }}
      style={styles.trendStackImage}
      imageStyle={{ borderRadius: radius.lg }}
      resizeMode="cover"
      onError={() => setImageFailed(true)}
    >
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.18)',
          'rgba(0,0,0,0.02)',
          'rgba(0,0,0,0.82)',
        ]}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
      />

      <View style={styles.trendStackTop}>
        <BlurView intensity={34} tint="dark" style={styles.trendingBadge}>
          <Text style={styles.trendingBadgeText}>Trending</Text>
        </BlurView>
      </View>

      <View style={styles.trendStackBottom}>
        <View style={styles.trendLikePill}>
          <Ionicons
            name="heart-outline"
            size={16}
            color={colors.textPrimary}
          />

          <Text style={styles.trendLikes}>
            {formatCount(getFavoriteCount(item))}
          </Text>
        </View>
      </View>
    </ImageBackground>
  ) : (
    <View style={styles.trendImagePlaceholder}>
      <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
      <Text style={styles.trendPlaceholderText}>No image</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.trendPressable,
        pressed && styles.trendPressed,
      ]}
    >
      {content}
    </Pressable>
  );
};

const TrendingStackSlider = ({
  data,
  scrollX,
  activeIndex,
  onMomentumEnd,
  onPressItem,
}: {
  data: Wallpaper[];
  scrollX: Animated.Value;
  activeIndex: number;
  onMomentumEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onPressItem: (item: Wallpaper) => void;
}) => {
  if (!data.length) return null;

  return (
    <View style={styles.trendStackWrap}>
      <Animated.FlatList
        data={data}
        keyExtractor={(item: Wallpaper, index) => getWallpaperId(item, index)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={TREND_SNAP}
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        initialScrollIndex={activeIndex}
        getItemLayout={(_, index) => ({
          length: TREND_SNAP,
          offset: TREND_SNAP * index,
          index,
        })}
        style={styles.trendStackList}
        contentContainerStyle={styles.trendStackContent}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        renderItem={({ item, index }: { item: Wallpaper; index: number }) => {
          const inputRange = [
            (index - 2) * TREND_SNAP,
            (index - 1) * TREND_SNAP,
            index * TREND_SNAP,
            (index + 1) * TREND_SNAP,
            (index + 2) * TREND_SNAP,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.76, 0.88, 1, 0.88, 0.78],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 0.72, 1, 0.7, 0.5],
            extrapolate: 'clamp',
          });

          const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [
              270 - TREND_SNAP * 2,
              190 - TREND_SNAP,
              0,
              -80 + TREND_SNAP,
              -80 + TREND_SNAP * 2,
            ],
            extrapolateLeft: 'clamp',
            extrapolateRight: 'extend',
          });

          const blurOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.72, 0.32, 0, 0.36, 0.55],
            extrapolate: 'clamp',
          });

          const fadeOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.52, 0.2, 0, 0.24, 0.36],
            extrapolate: 'clamp',
          });

          const isCenter = index === activeIndex;
          const isRightSide = index > activeIndex;

          const stackDepth = isRightSide
            ? 2000 + index
            : isCenter
              ? 1000
              : 300 + index;

          return (
            <View
              style={[
                styles.trendStackSlot,
                {
                  zIndex: stackDepth,
                  elevation: stackDepth,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.trendStackCardShell,
                  {
                    opacity,
                    transform: [{ translateX }, { scale }],
                  },
                ]}
              >
                <TrendStackCard
                  item={item}
                  index={index}
                  onPress={() => onPressItem(item)}
                />

                <Animated.View
                  pointerEvents="none"
                  style={[styles.trendSoftBlurLayer, { opacity: blurOpacity }]}
                >
                  <BlurView
                    intensity={22}
                    tint="dark"
                    style={styles.trendSoftBlur}
                  />
                </Animated.View>

                <Animated.View
                  pointerEvents="none"
                  style={[styles.trendSoftFadeLayer, { opacity: fadeOpacity }]}
                />
              </Animated.View>
            </View>
          );
        }}
      />
    </View>
  );
};

const TopPickCard = ({
  item,
  index,
  onPress,
}: {
  item: Wallpaper;
  index: number;
  onPress: () => void;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const image = imageFailed ? undefined : getWallpaperImage(item);

  const cardContent = (
    <>
      <BlurView intensity={30} tint="dark" style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </BlurView>

      <View style={styles.topPickBottom}>
        <Text style={styles.topPickTitle} numberOfLines={2}>
          {item.title || 'Untitled Wallpaper'}
        </Text>

        <View style={styles.topPickMetaRow}>
          <View style={styles.downloadRow}>
            <Ionicons
              name="download-outline"
              size={13}
              color={colors.textPrimary}
            />

            <Text style={styles.downloadText}>
              {formatCount(getDownloadCount(item))}
            </Text>
          </View>

          <View style={styles.favoriteRow}>
            <Ionicons
              name="heart-outline"
              size={13}
              color={colors.textPrimary}
            />

            <Text style={styles.favoriteText}>
              {formatCount(getFavoriteCount(item))}
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.topPickCard,
        pressed && styles.topPickPressed,
      ]}
    >
      {image ? (
        <ImageBackground
          source={{ uri: image }}
          style={styles.topPickImage}
          imageStyle={{ borderRadius: radius.lg }}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        >
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.04)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.88)',
            ]}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
          />

          {cardContent}
        </ImageBackground>
      ) : (
        <View style={styles.topPickPlaceholder}>
          <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
          {cardContent}
        </View>
      )}
    </Pressable>
  );
};

const TrendingScreen = ({ navigation }: { navigation: any }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const hasLoadedOnce = useRef(false);

  const [activeTrend, setActiveTrend] = useState(0);
  const [trending, setTrending] = useState<Wallpaper[]>([]);
  const [topPicks, setTopPicks] = useState<Wallpaper[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryOption>(ALL_CATEGORY);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topPicksLoading, setTopPicksLoading] = useState(false);

  const loadTrendingPage = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      let trendList: Wallpaper[] = [];
      let categoryList: CategoryOption[] = [];

      try {
        const response = await getTrendingWallpapers(TRENDING_HUB_LIMIT);

        trendList = sortByDownloads(
          uniqueWallpapers(extractWallpapers(response)),
        ).slice(0, TRENDING_HUB_LIMIT);

        if (!trendList.length) {
          const fallbackResponse = await getWallpapers({
            limit: TRENDING_HUB_LIMIT,
            offset: 0,
            active: true,
          });

          trendList = sortByDownloads(
            uniqueWallpapers(extractWallpapers(fallbackResponse)),
          ).slice(0, TRENDING_HUB_LIMIT);
        }
      } catch (error) {
        console.log('TRENDING PAGE API ERROR', error);
      }

      try {
        const response = await getCategories();
        const backendCategories = Array.isArray(response?.data)
          ? response.data.map(normalizeCategory)
          : [];

        categoryList = backendCategories;
      } catch (error) {
        console.log('TRENDING CATEGORIES ERROR', error);
        categoryList = [];
      }

      const startIndex = Math.min(2, Math.max(0, trendList.length - 1));

      setTrending(trendList.slice(0, TRENDING_HUB_LIMIT));
      setCategories(categoryList);
      setActiveTrend(startIndex);
      scrollX.setValue(startIndex * TREND_SNAP);

      const weeklyTop = await fetchWeeklyTopWallpapers(
        trendList,
        selectedCategory.slug === 'all' ? ALL_CATEGORY : selectedCategory,
      );

      setTopPicks(weeklyTop.slice(0, 10));
    } catch (error) {
      console.log('TRENDING PAGE LOAD ERROR', error);

      setTrending([]);
      setCategories([]);
      setTopPicks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribeFavorites = appEvents.on('favoritesChanged', payload => {
      const wallpaperId = String(payload.wallpaperId || '');

      const patch = {
        ...(payload.wallpaper || {}),
        isFavorite: Boolean(payload.isFavorite),
        is_favorite: Boolean(payload.isFavorite),
        favoriteCount: payload.favoriteCount,
        favorite_count: payload.favoriteCount,
        favoritesCount: payload.favoriteCount,
      };

      setTrending(current => patchWallpaperList(current, wallpaperId, patch));
      setTopPicks(current => patchWallpaperList(current, wallpaperId, patch));
    });

    const unsubscribeDownloads = appEvents.on('downloadsChanged', payload => {
      const wallpaperId = String(payload.wallpaperId || '');

      const patch = {
        ...(payload.wallpaper || {}),
        downloadCount: payload.downloadCount,
        download_count: payload.downloadCount,
        downloads: payload.downloadCount,
        downloadsThisWeek: payload.downloadCount,
        downloads_this_week: payload.downloadCount,
        weeklyDownloads: payload.downloadCount,
      };

      setTrending(current => patchWallpaperList(current, wallpaperId, patch));
      setTopPicks(current =>
        sortByDownloads(patchWallpaperList(current, wallpaperId, patch)).slice(
          0,
          10,
        ),
      );
    });

    const unsubscribeWallpaper = appEvents.on('wallpaperChanged', payload => {
      const wallpaperId = String(
        payload.wallpaperId || payload.wallpaper?.id || '',
      );

      if (!wallpaperId || !payload.wallpaper) {
        return;
      }

      setTrending(current =>
        patchWallpaperList(current, wallpaperId, payload.wallpaper),
      );
      setTopPicks(current =>
        patchWallpaperList(current, wallpaperId, payload.wallpaper),
      );
    });

    const unsubscribeWallpapers = appEvents.on('wallpapersChanged', () => {
      loadTrendingPage(true);
    });

    return () => {
      unsubscribeFavorites();
      unsubscribeDownloads();
      unsubscribeWallpaper();
      unsubscribeWallpapers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce.current) {
        loadTrendingPage(true);
        return;
      }

      hasLoadedOnce.current = true;
      loadTrendingPage();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);

    await loadTrendingPage(true);
  };

  const loadTopPicksByCategory = async (category: CategoryOption) => {
    try {
      setSelectedCategory(category);
      setTopPicksLoading(true);

      const weeklyTop = await fetchWeeklyTopWallpapers(trending, category);
      setTopPicks(weeklyTop.slice(0, 10));
    } catch (error) {
      console.log('TOP PICKS CATEGORY LOAD ERROR', error);
      setTopPicks([]);
    } finally {
      setTopPicksLoading(false);
    }
  };

  const onTrendScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / TREND_SNAP);
    setActiveTrend(Math.max(0, Math.min(idx, trending.length - 1)));
  };

  const openWallpaper = (wallpaper: Wallpaper) => {
    const parentNavigation = navigation.getParent?.();

    if (parentNavigation) {
      parentNavigation.navigate('WallpaperDetails', { wallpaper });
      return;
    }

    navigation.navigate('WallpaperDetails', { wallpaper });
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MeshBackground variant="home" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textPrimary}
            />
          }
        >
          <TrendingTopHeader navigation={navigation} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Hub</Text>

            <Text style={styles.sectionSubtitle}>
              Swipe the stack to explore
            </Text>
          </View>

          <TrendingStackSlider
            data={trending}
            scrollX={scrollX}
            activeIndex={activeTrend}
            onMomentumEnd={onTrendScrollEnd}
            onPressItem={openWallpaper}
          />

          {!trending.length ? (
            <View style={styles.emptyStateBox}>
              <Ionicons
                name="trending-up-outline"
                size={28}
                color={colors.textSecondary}
              />

              <Text style={styles.emptyStateTitle}>
                No trending wallpapers found.
              </Text>

              <Text style={styles.emptyStateText}>
                Upload wallpapers or check the trending API response.
              </Text>
            </View>
          ) : null}

          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>Top Picks of this week</Text>

            <Text style={styles.weekSubtitle}>
              {selectedCategory.slug === 'all'
                ? 'Top 10 most downloaded wallpapers this week'
                : `Top 10 most downloaded ${selectedCategory.name} wallpapers this week`}
            </Text>
          </View>

          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={loadTopPicksByCategory}
          />

          {topPicksLoading ? (
            <View style={styles.topPicksLoading}>
              <ActivityIndicator size="small" color={colors.textPrimary} />
            </View>
          ) : topPicks.length ? (
            <View style={styles.topGrid}>
              {topPicks.map((item, index) => (
                <TopPickCard
                  key={getWallpaperId(item, index)}
                  item={item}
                  index={index}
                  onPress={() => openWallpaper(item)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateBox}>
              <Ionicons
                name="download-outline"
                size={28}
                color={colors.textSecondary}
              />

              <Text style={styles.emptyStateTitle}>No top picks found.</Text>

              <Text style={styles.emptyStateText}>
                Weekly top wallpapers will appear here from the backend.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default TrendingScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  loadingRoot: {
    flex: 1,
    backgroundColor: colors.base,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    paddingBottom: 120,
  },

  trendingHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 0,
  },

  trendingActionRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'visible',
    marginBottom: -8,
  },

  trendingLogoLeft: {
    width: 175,
    height: 120,
    marginLeft: -18,
    marginTop: 8,
  },

  trendingRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },

  trendingPremiumButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },

  trendingRightButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  trendingRoundButton: {
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

  sectionHeader: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    color: colors.textPrimary,
    ...typography.sectionTitle,
  },

  sectionSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    marginTop: 3,
  },

  trendStackWrap: {
    height: TREND_CARD_H + 42,
    marginTop: 0,
  },

  trendStackList: {
    overflow: 'visible',
  },

  trendStackContent: {
    paddingHorizontal: TREND_SIDE_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },

  trendStackSlot: {
    width: TREND_SNAP,
    height: TREND_CARD_H + 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },

  trendStackCardShell: {
    width: TREND_CARD_W,
    height: TREND_CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.baseElevated,
    shadowColor: colors.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 0,
  },

  trendSoftBlurLayer: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },

  trendSoftBlur: {
    ...StyleSheet.absoluteFill,
  },

  trendSoftFadeLayer: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(8,8,18,0.48)',
  },

  trendPressable: {
    flex: 1,
  },

  trendPressed: {
    opacity: 0.86,
  },

  trendStackImage: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.baseElevated,
  },

  trendImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.baseElevated,
  },

  trendPlaceholderText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  trendStackTop: {
    alignItems: 'flex-start',
    padding: spacing.md,
  },

  trendingBadge: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  trendingBadgeText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  trendStackBottom: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },

  trendLikePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  trendLikes: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
  },

  weekHeader: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  weekTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },

  weekSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    marginTop: 3,
  },

  categorySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl,
    marginBottom: spacing.md,
  },

  categorySlider: {
    flex: 1,
    marginLeft: spacing.sm,
  },

  categorySliderContent: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },

  categoryChipPressable: {
    borderRadius: radius.pill,
  },

  categoryChip: {
    height: 38,
    paddingHorizontal: 17,
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    backgroundColor: colors.glassFill,
  },

  categoryChipActive: {
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
  },

  categoryChipText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
  },

  categoryChipTextActive: {
    color: colors.textPrimary,
  },

  emptyStateBox: {
    marginHorizontal: spacing.xl,
    minHeight: 150,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.lg,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  emptyStateTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    textAlign: 'center',
  },

  emptyStateText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },

  topPicksLoading: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topGrid: {
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },

  topPickCard: {
    width: GRID_CARD_W,
    height: GRID_CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.baseElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },

  topPickPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  topPickImage: {
    flex: 1,
    justifyContent: 'space-between',
  },

  topPickPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.baseElevated,
  },

  rankBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  rankText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  topPickBottom: {
    marginTop: 'auto',
    padding: spacing.sm,
  },

  topPickTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 17,
    marginBottom: 7,
  },

  topPickMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  downloadRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  downloadText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },

  favoriteRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  favoriteText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },
});