import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
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
import { useNavigation } from '@react-navigation/native';

import MeshBackground from '../../components/MeshBackground';
import Header from '../../components/Header';
import Button from '../../components/Button';

import { colors } from '../../styles/colors';
import { spacing, radius, SCREEN } from '../../utils/constants';

import API from '../../services/api';
import {
  getFeaturedWallpapers,
  getTrendingWallpapers,
  getWallpapers,
} from '../../services/wallpaperService';

import { Wallpaper } from '../../services/types';

const HERO_W = SCREEN.width - spacing.xl * 2;
const HERO_H = 480;
const HERO_GAP = spacing.md;
const HERO_SNAP = HERO_W + HERO_GAP;

const TREND_CARD_W = 190;
const TREND_CARD_H = 300;
const TREND_SNAP = 110;
const TREND_SIDE_PADDING = (SCREEN.width - TREND_SNAP) / 2;

const ALL_GRID_GAP = spacing.md;
const ALL_GRID_CARD_W = (SCREEN.width - spacing.xl * 2 - ALL_GRID_GAP) / 2;
const ALL_GRID_CARD_H = ALL_GRID_CARD_W * 1.52;

const ALL_PAGE_SIZE = 80;
const MAX_ALL_PAGES = 10;

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

const API_ORIGIN = String(API.defaults.baseURL || '').replace(/\/api\/?$/, '');

const heroFallbackImage =
  'https://picsum.photos/seed/flexiwalls-hero-fallback/800/1400';

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

const formatLikes = (likes?: number) => {
  if (likes === undefined || likes === null) return '0';
  if (likes >= 1000) return `${(likes / 1000).toFixed(1).replace('.0', '')}K`;
  return String(likes);
};

const slugifyCategory = (value?: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const prettifyCategoryName = (value?: string) =>
  String(value || 'Category')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

const getWallpaperCategoryForNavigation = (wallpaper: Wallpaper) => {
  const w = wallpaper as Wallpaper & Record<string, any>;

  if (w.category && typeof w.category === 'object') {
    const categoryName = w.category.name || w.category.slug || 'Category';
    const categorySlug = w.category.slug || slugifyCategory(categoryName);

    return {
      ...w.category,
      id: w.category.id || categorySlug,
      name: categoryName,
      slug: categorySlug,
    };
  }

  const rawCategory =
    w.categorySlug ||
    w.category_slug ||
    w.categoryName ||
    w.category_name ||
    w.category ||
    '';

  if (!rawCategory || typeof rawCategory !== 'string') {
    return null;
  }

  const slug = slugifyCategory(rawCategory);

  return {
    id: slug,
    name: prettifyCategoryName(rawCategory),
    slug,
  };
};

const byNewest = (a: Wallpaper, b: Wallpaper) => {
  const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return tb - ta;
};

const uniqueWallpapers = (items: Wallpaper[]) => {
  const seen = new Set<string>();

  return items
    .filter(item => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort(byNewest);
};

const placeholderWallpapers = (prefix: string, count: number): Wallpaper[] =>
  Array.from({ length: count }).map((_, index) => ({
    id: `${prefix}-placeholder-${index}`,
    title: `Wallpaper ${index + 1}`,
    subtitle: 'Premium 4K Collection',
    imageUrl: `https://picsum.photos/seed/${prefix}-${index}/800/1400`,
    thumbnailUrl: `https://picsum.photos/seed/${prefix}-${index}/600/900`,
    quality: index % 2 === 0 ? '4K' : '8K',
    likes: 1200 + index * 97,
    createdAt: new Date(Date.now() - index * 1000 * 60 * 60).toISOString(),
  }));

const fetchAllWallpapers = async () => {
  try {
    let offset = 0;
    let allItems: Wallpaper[] = [];

    for (let page = 0; page < MAX_ALL_PAGES; page += 1) {
      const res = await getWallpapers(ALL_PAGE_SIZE, offset);
      const batch = res?.data ?? [];

      allItems = [...allItems, ...batch];

      if (batch.length < ALL_PAGE_SIZE) break;

      offset += batch.length;
    }

    return uniqueWallpapers(allItems);
  } catch (error) {
    console.log('HOME ALL WALLPAPERS ERROR', error);
    return [];
  }
};

const HeroCard = ({
  item,
  index,
  onPress,
  onExploreCategory,
}: {
  item: Wallpaper;
  index: number;
  onPress?: () => void;
  onExploreCategory?: () => void;
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const image = imageFailed
    ? heroFallbackImage
    : getWallpaperImage(item, `flexiwalls-hero-${index}`);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.heroCard,
        pressed && onPress && styles.heroPressed,
      ]}
    >
      <ImageBackground
        source={{ uri: image }}
        style={styles.heroImage}
        imageStyle={{ borderRadius: radius.lg }}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0)', 'rgba(10,8,25,0.85)']}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />

        <BlurView intensity={30} tint="dark" style={styles.qualityBadge}>
          <Text style={styles.qualityText}>{item.quality || '4K'}</Text>
          <Text style={styles.qualitySub}>ULTRA HD</Text>
        </BlurView>

        <View style={styles.heroContent}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>
              {item.category?.name || 'Featured'}
            </Text>
          </View>

          <Text style={styles.heroTitle} numberOfLines={2}>
            {item.title || 'Premium Wallpaper'}
          </Text>

          <Text style={styles.heroSubtitle} numberOfLines={2}>
            {item.subtitle ||
              (item as any).description ||
              '4K Ultra HD Collection'}
          </Text>

          <View style={styles.heroFooter}>
            <Button
              label="Explore"
              trailingIcon="arrow-forward"
              onPress={onExploreCategory}
            />

            <View style={styles.likeRow}>
              <Ionicons name="heart" size={18} color={colors.textPrimary} />
              <Text style={styles.likeText}>{formatLikes(item.likes)}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const HeroSmoothCarousel = ({
  data,
  scrollX,
  activeIndex,
  onMomentumEnd,
  onPressItem,
  onExploreCategory,
}: {
  data: Wallpaper[];
  scrollX: Animated.Value;
  activeIndex: number;
  onMomentumEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onPressItem: (item: Wallpaper) => void;
  onExploreCategory: (item: Wallpaper) => void;
}) => {
  if (!data.length) return null;

  return (
    <View style={styles.heroCarouselWrap}>
      <Animated.FlatList
        data={data}
        keyExtractor={(item: Wallpaper) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={HERO_SNAP}
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        contentContainerStyle={styles.heroCarouselContent}
        ItemSeparatorComponent={() => <View style={{ width: HERO_GAP }} />}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, index) => ({
          length: HERO_SNAP,
          offset: HERO_SNAP * index,
          index,
        })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        renderItem={({ item, index }: { item: Wallpaper; index: number }) => {
          const inputRange = [
            (index - 1) * HERO_SNAP,
            index * HERO_SNAP,
            (index + 1) * HERO_SNAP,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.92, 1, 0.92],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.62, 1, 0.62],
            extrapolate: 'clamp',
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [16, 0, 16],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              style={[
                styles.heroCarouselCard,
                {
                  opacity,
                  transform: [{ translateY }, { scale }],
                },
              ]}
            >
              <HeroCard
                item={item}
                index={index}
                onPress={() => onPressItem(item)}
                onExploreCategory={() => onExploreCategory(item)}
              />
            </Animated.View>
          );
        }}
      />

      <View style={styles.heroCarouselDots}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
};

const TrendFilterChip = ({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) => (
  <BlurView
    intensity={active ? 44 : 26}
    tint="dark"
    style={[styles.filterChip, active && styles.filterChipActive]}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
      {label}
    </Text>
  </BlurView>
);

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
    ? `https://picsum.photos/seed/flexiwalls-trending-fallback-${index}/600/1000`
    : getWallpaperImage(item, `flexiwalls-trending-${index}`);

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
            <Text style={styles.trendLikes}>{formatLikes(item.likes)}</Text>
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
        keyExtractor={(item: Wallpaper) => item.id}
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

const AllWallpaperCard = ({
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
    ? `https://picsum.photos/seed/flexiwalls-all-fallback-${index}/600/900`
    : getWallpaperImage(item, `flexiwalls-all-${index}`);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.allWallpaperCard,
        pressed && styles.allWallpaperPressed,
      ]}
    >
      <ImageBackground
        source={{ uri: image }}
        style={styles.allWallpaperImage}
        imageStyle={{ borderRadius: radius.lg }}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      >
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.05)',
            'rgba(0,0,0,0)',
            'rgba(5,4,14,0.82)',
          ]}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />

        <View style={styles.allWallpaperTop}>
          <BlurView intensity={28} tint="dark" style={styles.allQualityChip}>
            <Text style={styles.allQualityText}>{item.quality || '4K'}</Text>
          </BlurView>
        </View>

        <View style={styles.allWallpaperBottom}>
          <Text style={styles.allWallpaperTitle} numberOfLines={1}>
            {item.title || 'Wallpaper'}
          </Text>

          <View style={styles.allWallpaperMeta}>
            <Ionicons
              name="heart-outline"
              size={13}
              color={colors.textPrimary}
            />
            <Text style={styles.allWallpaperMetaText}>
              {formatLikes(item.likes)}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const AllWallpapersSection = ({
  data,
  onPressItem,
}: {
  data: Wallpaper[];
  onPressItem: (item: Wallpaper) => void;
}) => {
  return (
    <View style={styles.allSection}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>All Wallpapers</Text>
          <Text style={styles.sectionSubtitle}>
            {data.length ? `${data.length} wallpapers available` : 'Latest uploads'}
          </Text>
        </View>
      </View>

      {data.length ? (
        <View style={styles.allGrid}>
          {data.map((item, index) => (
            <AllWallpaperCard
              key={item.id}
              item={item}
              index={index}
              onPress={() => onPressItem(item)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyAllBox}>
          <Ionicons
            name="images-outline"
            size={28}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyAllText}>No wallpapers found.</Text>
        </View>
      )}
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const heroScrollX = useRef(new Animated.Value(0)).current;
  const trendScrollX = useRef(new Animated.Value(0)).current;

  const [activeHero, setActiveHero] = useState(0);
  const [activeTrend, setActiveTrend] = useState(0);
  const [featured, setFeatured] = useState<Wallpaper[]>([]);
  const [trending, setTrending] = useState<Wallpaper[]>([]);
  const [allWallpapers, setAllWallpapers] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHome();
  }, []);

  const loadHome = async () => {
    try {
      setLoading(true);

      let heroData: Wallpaper[] = [];
      let trendData: Wallpaper[] = [];
      let allData: Wallpaper[] = [];

      try {
        const hero = await getFeaturedWallpapers();
        heroData = hero?.data ?? [];
      } catch (error) {
        console.log('HOME FEATURED ERROR', error);
      }

      try {
        const trend = await getTrendingWallpapers();
        trendData = trend?.data ?? [];
      } catch (error) {
        console.log('HOME TRENDING ERROR', error);
      }

      try {
        allData = await fetchAllWallpapers();
      } catch (error) {
        console.log('HOME ALL ERROR', error);
      }

      const fallbackHero = placeholderWallpapers('hero', 5);
      const fallbackTrending = placeholderWallpapers('trending', 10);
      const fallbackAll = placeholderWallpapers('all', 20);

      const safeHeroData =
        heroData.length > 0
          ? heroData
          : trendData.length > 0
            ? trendData.slice(0, 5)
            : fallbackHero;

      const safeTrendingData =
        trendData.length > 0
          ? trendData
          : heroData.length > 0
            ? heroData
            : fallbackTrending;

      const mergedAllData = uniqueWallpapers([
        ...allData,
        ...trendData,
        ...heroData,
      ]);

      const safeAllData =
        mergedAllData.length > 0
          ? mergedAllData
          : fallbackAll;

      const startTrendIndex = Math.min(
        2,
        Math.max(0, safeTrendingData.length - 1),
      );

      setFeatured(safeHeroData);
      setTrending(safeTrendingData);
      setAllWallpapers(safeAllData);
      setActiveHero(0);
      setActiveTrend(startTrendIndex);

      heroScrollX.setValue(0);
      trendScrollX.setValue(startTrendIndex * TREND_SNAP);
    } catch (error) {
      console.log('HOME LOAD ERROR', error);

      setFeatured(placeholderWallpapers('hero', 5));
      setTrending(placeholderWallpapers('trending', 10));
      setAllWallpapers(placeholderWallpapers('all', 20));
    } finally {
      setLoading(false);
    }
  };

  const onHeroScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_SNAP);
    setActiveHero(Math.max(0, Math.min(idx, featured.length - 1)));
  };

  const onTrendScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / TREND_SNAP);
    setActiveTrend(Math.max(0, Math.min(idx, trending.length - 1)));
  };

  const openWallpaper = (wallpaper: Wallpaper) => {
    navigation.navigate('WallpaperDetails', { wallpaper });
  };

  const openWallpaperCategory = (wallpaper: Wallpaper) => {
    const category = getWallpaperCategoryForNavigation(wallpaper);

    if (!category?.slug) {
      console.log('No category linked to this wallpaper');
      return;
    }

    navigation.navigate('CategoryDetail', { category });
  };

  if (loading) {
    return (
      <View
        style={[
          styles.root,
          {
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
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
          contentContainerStyle={{ paddingBottom: 150 }}
        >
          <Header
            eyebrow="Good Morning 👋"
            title={'Find Your\nPerfect Wallpaper'}
            leftAction={{
              icon: 'person-outline',
              onPress: () => navigation.navigate('Profile'),
            }}
            rightAction={{
              icon: 'search',
              onPress: () => navigation.navigate('Search'),
            }}
            style={{
              paddingTop: spacing.xs,
              paddingBottom: 0,
            }}
          />

          <HeroSmoothCarousel
            data={featured}
            scrollX={heroScrollX}
            activeIndex={activeHero}
            onMomentumEnd={onHeroScrollEnd}
            onPressItem={openWallpaper}
            onExploreCategory={openWallpaperCategory}
          />

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Trending Hub</Text>
              <Text style={styles.sectionSubtitle}>Swipe the stack to explore</Text>
            </View>

            <Pressable
              style={styles.viewAll}
              hitSlop={8}
              onPress={() => navigation.navigate('AllWallpapers')}
            >
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>

          <View style={styles.filterRow}>
            <TrendFilterChip label="All" active />
            <TrendFilterChip label="Nature" />
            <TrendFilterChip label="City" />
            <TrendFilterChip label="Abstract" />
          </View>

          <TrendingStackSlider
            data={trending}
            scrollX={trendScrollX}
            activeIndex={activeTrend}
            onMomentumEnd={onTrendScrollEnd}
            onPressItem={openWallpaper}
          />

          <AllWallpapersSection
            data={allWallpapers}
            onPressItem={openWallpaper}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  heroCarouselWrap: {
    marginTop: spacing.xs,
  },
  heroCarouselContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  heroCarouselCard: {
    width: HERO_W,
    height: HERO_H,
  },
  heroCarouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  heroCard: {
    width: HERO_W,
    height: HERO_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  heroPressed: {
    opacity: 0.92,
  },
  heroImage: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.baseElevated,
  },
  qualityBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  qualityText: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 16,
  },
  qualitySub: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroContent: {
    padding: spacing.xl,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  tagText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 4,
    maxWidth: '78%',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textTertiary,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.textPrimary,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 3,
  },
  viewAllText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },

  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    backgroundColor: colors.glassFill,
  },
  filterChipActive: {
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillStrong,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.textPrimary,
  },

  trendStackWrap: {
    height: TREND_CARD_H + 70,
    marginTop: spacing.sm,
  },
  trendStackList: {
    overflow: 'visible',
  },
  trendStackContent: {
    paddingHorizontal: TREND_SIDE_PADDING,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 13,
    fontWeight: '800',
  },

  allSection: {
    marginTop: spacing.sm,
  },
  allGrid: {
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALL_GRID_GAP,
  },
  allWallpaperCard: {
    width: ALL_GRID_CARD_W,
    height: ALL_GRID_CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.baseElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  allWallpaperPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  allWallpaperImage: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.baseElevated,
  },
  allWallpaperTop: {
    alignItems: 'flex-start',
    padding: spacing.sm,
  },
  allQualityChip: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  allQualityText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  allWallpaperBottom: {
    padding: spacing.sm,
  },
  allWallpaperTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  allWallpaperMeta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  allWallpaperMetaText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyAllBox: {
    marginHorizontal: spacing.xl,
    height: 150,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  emptyAllText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});