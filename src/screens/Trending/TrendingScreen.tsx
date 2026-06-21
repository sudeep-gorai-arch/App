import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  ImageBackground,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Animated,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';

import API from '../../services/api';
import { getCategories } from '../../services/categoryService';
import { getTrendingWallpapers, getWallpapers } from '../../services/wallpaperService';
import { Category, Wallpaper } from '../../services/types';

import { colors } from '../../styles/colors';
import { typography, fontFamily } from '../../styles/typography';
import { spacing, radius, SCREEN } from '../../utils/constants';

const flexiWallsLogo = require('../../assets/images/flexiwalls-logo.png');
const proButtonIcon = require('../../assets/images/pro-button.png');

const TREND_CARD_W = 190;
const TREND_CARD_H = 300;
const TREND_SNAP = 110;
const TREND_SIDE_PADDING = (SCREEN.width - TREND_SNAP) / 2;

const GRID_GAP = spacing.md;
const GRID_CARD_W = (SCREEN.width - spacing.xl * 2 - GRID_GAP) / 2;
const GRID_CARD_H = GRID_CARD_W * 1.52;

const API_ORIGIN = String(API.defaults.baseURL || '').replace(/\/api\/?$/, '');

const LEFT_STACK_VISUAL_POSITIONS = {
  farRight: 270,
  right: 190,
  center: 0,
  left: -80,
  farLeft: -80,
};

const LEFT_STACK_STYLES = {
  farRight: {
    scale: 0.76,
    opacity: 0.3,
    blur: 0.72,
    fade: 0.52,
  },
  right: {
    scale: 0.88,
    opacity: 0.72,
    blur: 0.32,
    fade: 0.2,
  },
  center: {
    scale: 1,
    opacity: 1,
    blur: 0,
    fade: 0,
  },
  left: {
    scale: 0.88,
    opacity: 0.7,
    blur: 0.36,
    fade: 0.24,
  },
  farLeft: {
    scale: 0.78,
    opacity: 0.5,
    blur: 0.55,
    fade: 0.36,
  },
};

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

const FALLBACK_CATEGORIES: CategoryOption[] = [
  { id: 'anime', name: 'Anime', slug: 'anime' },
  { id: 'sports', name: 'Sports', slug: 'sports' },
  { id: 'nature', name: 'Nature', slug: 'nature' },
  { id: 'cars', name: 'Cars', slug: 'cars' },
  { id: 'abstract', name: 'Abstract', slug: 'abstract' },
  { id: 'city', name: 'City', slug: 'city' },
  { id: 'space', name: 'Space', slug: 'space' },
  { id: 'gaming', name: 'Gaming', slug: 'gaming' },
  { id: 'animals', name: 'Animals', slug: 'animals' },
];

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

const getWallpaperId = (item: Wallpaper, index = 0) => {
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

const normalizeWallpaper = (item: Wallpaper, index: number): Wallpaper => {
  const w = item as Wallpaper & Record<string, any>;

  return {
    ...item,
    id: getWallpaperId(item, index),
    title: w.title || w.name || `Wallpaper ${index + 1}`,
    imageUrl:
      w.imageUrl ||
      w.image_url ||
      w.url ||
      w.image ||
      w.photoUrl ||
      w.photo_url ||
      w.mediaUrl ||
      w.media_url,
    thumbnailUrl:
      w.thumbnailUrl ||
      w.thumbnail_url ||
      w.thumbnail ||
      w.thumbUrl ||
      w.thumb_url,
    quality: w.quality || '4K',
    likes: Number(w.likes ?? w.likeCount ?? w.like_count ?? 0),
    downloads: Number(
      w.downloads ??
        w.downloadCount ??
        w.download_count ??
        w.downloadsThisWeek ??
        w.weeklyDownloads ??
        w.downloads_this_week ??
        0,
    ),
    createdAt: w.createdAt || w.created_at || w.updatedAt || w.updated_at,
  };
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

const getWallpaperImage = (item: Wallpaper, fallbackSeed: string) => {
  const w = item as Wallpaper & Record<string, any>;

  return (
    toAbsoluteMediaUrl(w.imageUrl) ||
    toAbsoluteMediaUrl(w.thumbnailUrl) ||
    toAbsoluteMediaUrl(w.image_url) ||
    toAbsoluteMediaUrl(w.thumbnail_url) ||
    toAbsoluteMediaUrl(w.url) ||
    toAbsoluteMediaUrl(w.image) ||
    toAbsoluteMediaUrl(w.thumbnail) ||
    toAbsoluteMediaUrl(w.photoUrl) ||
    toAbsoluteMediaUrl(w.photo_url) ||
    toAbsoluteMediaUrl(w.mediaUrl) ||
    toAbsoluteMediaUrl(w.media_url) ||
    `https://picsum.photos/seed/${fallbackSeed}/800/1400`
  );
};

const formatCount = (value?: number) => {
  if (value === undefined || value === null) return '0';
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
  return String(value);
};

const getDownloadCount = (item: Wallpaper) => {
  const w = item as Wallpaper & Record<string, any>;

  return Number(
    w.downloadsThisWeek ??
      w.weeklyDownloads ??
      w.downloads_this_week ??
      w.week_downloads ??
      w.downloadCount ??
      w.download_count ??
      w.downloads ??
      0,
  );
};

const sortByDownloads = (items: Wallpaper[]) =>
  [...items].sort((a, b) => getDownloadCount(b) - getDownloadCount(a));

const placeholderWallpapers = (
  prefix: string,
  count: number,
  categoryName?: string,
): Wallpaper[] =>
  Array.from({ length: count }).map((_, index) => ({
    id: `${prefix}-placeholder-${index}`,
    title:
      categoryName && categoryName !== 'All'
        ? `${categoryName} Top Pick ${index + 1}`
        : prefix === 'weekly'
          ? `Top Pick ${index + 1}`
          : `Trending Wallpaper ${index + 1}`,
    imageUrl: `https://picsum.photos/seed/${prefix}-${categoryName || 'all'}-${index}/800/1400`,
    thumbnailUrl: `https://picsum.photos/seed/${prefix}-${categoryName || 'all'}-${index}/600/900`,
    quality: index % 2 === 0 ? '4K' : '8K',
    likes: 1200 + index * 97,
    downloads: 900 + index * 64,
    createdAt: new Date(Date.now() - index * 1000 * 60 * 60).toISOString(),
  }));

const fetchCategoryWallpapersFallback = async (category: CategoryOption) => {
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

    const response = await getWallpapers(80, 0, '', category.slug);
    return uniqueWallpapers(extractWallpapers(response));
  } catch (error) {
    console.log('CATEGORY WEEKLY FALLBACK ERROR', error);
    return [];
  }
};

const fetchWeeklyTopWallpapers = async (
  fallbackTrending: Wallpaper[],
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
    console.log('TOP WEEK WALLPAPERS API FALLBACK USED');
  }

  const fallbackCategoryWallpapers = await fetchCategoryWallpapersFallback(
    category,
  );

  if (fallbackCategoryWallpapers.length) {
    return sortByDownloads(fallbackCategoryWallpapers).slice(0, 10);
  }

  if (category.slug === 'all') {
    const fallbackList = sortByDownloads(fallbackTrending).slice(0, 10);

    if (fallbackList.length) {
      return fallbackList;
    }
  }

  return placeholderWallpapers('weekly', 10, category.name);
};

const ShinyProIcon = () => {
  const shineTranslate = useRef(new Animated.Value(-46)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(shineTranslate, {
          toValue: 46,
          duration: 950,
          useNativeDriver: true,
        }),
        Animated.timing(shineTranslate, {
          toValue: -46,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shineTranslate]);

  return (
    <View style={styles.trendingProIconWrap}>
      <Image
        source={proButtonIcon}
        style={styles.trendingProIcon}
        resizeMode="contain"
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.trendingProShine,
          {
            transform: [{ translateX: shineTranslate }, { rotate: '18deg' }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.22)',
            'rgba(255,255,255,0.9)',
            'rgba(255,255,255,0.22)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.trendingProShineGradient}
        />
      </Animated.View>
    </View>
  );
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
          <Pressable
            onPress={() => navigation.navigate('Premium')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.trendingPremiumButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ShinyProIcon />
          </Pressable>

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
        style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
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
  index,
  onPress,
}: {
  item: Wallpaper;
  index: number;
  onPress: () => void;
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const image = imageFailed
    ? `https://picsum.photos/seed/trending-page-fallback-${index}/600/1000`
    : getWallpaperImage(item, `trending-page-${getWallpaperId(item, index)}`);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.trendPressable,
        pressed && styles.trendPressed,
      ]}
    >
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
            <Text style={styles.trendLikes}>{formatCount(item.likes)}</Text>
          </View>
        </View>
      </ImageBackground>
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
            outputRange: [
              LEFT_STACK_STYLES.farRight.scale,
              LEFT_STACK_STYLES.right.scale,
              LEFT_STACK_STYLES.center.scale,
              LEFT_STACK_STYLES.left.scale,
              LEFT_STACK_STYLES.farLeft.scale,
            ],
            extrapolate: 'clamp',
          });

          const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [
              LEFT_STACK_VISUAL_POSITIONS.farRight - TREND_SNAP * 2,
              LEFT_STACK_VISUAL_POSITIONS.right - TREND_SNAP,
              LEFT_STACK_VISUAL_POSITIONS.center,
              LEFT_STACK_VISUAL_POSITIONS.left + TREND_SNAP,
              LEFT_STACK_VISUAL_POSITIONS.farLeft + TREND_SNAP * 2,
            ],
            extrapolateLeft: 'clamp',
            extrapolateRight: 'extend',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [
              LEFT_STACK_STYLES.farRight.opacity,
              LEFT_STACK_STYLES.right.opacity,
              LEFT_STACK_STYLES.center.opacity,
              LEFT_STACK_STYLES.left.opacity,
              LEFT_STACK_STYLES.farLeft.opacity,
            ],
            extrapolate: 'clamp',
          });

          const blurOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [
              LEFT_STACK_STYLES.farRight.blur,
              LEFT_STACK_STYLES.right.blur,
              LEFT_STACK_STYLES.center.blur,
              LEFT_STACK_STYLES.left.blur,
              LEFT_STACK_STYLES.farLeft.blur,
            ],
            extrapolate: 'clamp',
          });

          const fadeOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [
              LEFT_STACK_STYLES.farRight.fade,
              LEFT_STACK_STYLES.right.fade,
              LEFT_STACK_STYLES.center.fade,
              LEFT_STACK_STYLES.left.fade,
              LEFT_STACK_STYLES.farLeft.fade,
            ],
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

  const image = imageFailed
    ? `https://picsum.photos/seed/top-pick-fallback-${index}/600/900`
    : getWallpaperImage(item, `top-pick-${getWallpaperId(item, index)}`);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.topPickCard,
        pressed && styles.topPickPressed,
      ]}
    >
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

        <BlurView intensity={30} tint="dark" style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </BlurView>

        <View style={styles.topPickBottom}>
          <Text style={styles.topPickTitle} numberOfLines={2}>
            {item.title || `Top Pick ${index + 1}`}
          </Text>

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
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const TrendingScreen = ({ navigation }: { navigation: any }) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  const [activeTrend, setActiveTrend] = useState(0);
  const [trending, setTrending] = useState<Wallpaper[]>([]);
  const [topPicks, setTopPicks] = useState<Wallpaper[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryOption>(ALL_CATEGORY);

  const [loading, setLoading] = useState(true);
  const [topPicksLoading, setTopPicksLoading] = useState(false);

  useEffect(() => {
    loadTrendingPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTrendingPage = async () => {
    try {
      setLoading(true);

      let trendList: Wallpaper[] = [];
      let categoryList: CategoryOption[] = [];

      try {
        const response = await getTrendingWallpapers();
        trendList = uniqueWallpapers(extractWallpapers(response));
      } catch (error) {
        console.log('TRENDING PAGE API ERROR', error);
      }

      try {
        const response = await getCategories();
        const backendCategories = Array.isArray(response?.data)
          ? response.data.map(normalizeCategory)
          : [];

        categoryList = backendCategories.length
          ? backendCategories
          : FALLBACK_CATEGORIES;
      } catch (error) {
        console.log('TRENDING CATEGORIES ERROR', error);
        categoryList = FALLBACK_CATEGORIES;
      }

      if (!trendList.length) {
        trendList = placeholderWallpapers('trending-page', 10);
      }

      const startIndex = Math.min(2, Math.max(0, trendList.length - 1));

      setTrending(trendList);
      setCategories(categoryList);
      setActiveTrend(startIndex);
      scrollX.setValue(startIndex * TREND_SNAP);

      const weeklyTop = await fetchWeeklyTopWallpapers(
        trendList,
        ALL_CATEGORY,
      );

      setTopPicks(weeklyTop.slice(0, 10));
    } catch (error) {
      console.log('TRENDING PAGE LOAD ERROR', error);

      setTrending(placeholderWallpapers('trending-page', 10));
      setCategories(FALLBACK_CATEGORIES);
      setTopPicks(placeholderWallpapers('weekly', 10));
    } finally {
      setLoading(false);
    }
  };

  const loadTopPicksByCategory = async (category: CategoryOption) => {
    try {
      setSelectedCategory(category);
      setTopPicksLoading(true);

      const weeklyTop = await fetchWeeklyTopWallpapers(trending, category);
      setTopPicks(weeklyTop.slice(0, 10));
    } catch (error) {
      console.log('TOP PICKS CATEGORY LOAD ERROR', error);
      setTopPicks(placeholderWallpapers('weekly', 10, category.name));
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
          ) : (
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
  trendingProIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trendingProIcon: {
    width: 36,
    height: 36,
  },
  trendingProShine: {
    position: 'absolute',
    top: -12,
    bottom: -12,
    width: 22,
    opacity: 0.95,
  },
  trendingProShineGradient: {
    flex: 1,
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
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  trendSoftBlur: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  trendSoftFadeLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
});