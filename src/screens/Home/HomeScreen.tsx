import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ImageBackground,
  FlatList,
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
} from '../../services/wallpaperService';

import { Wallpaper } from '../../services/types';

const HERO_W = SCREEN.width - spacing.xl * 2;
const HERO_H = 480;

const TREND_CARD_W = 190;
const TREND_CARD_H = 300;
const TREND_SNAP = 110;
const TREND_SIDE_PADDING = (SCREEN.width - TREND_SNAP) / 2;

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

const HeroCard = ({ item, index }: { item: Wallpaper; index: number }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const image = imageFailed
    ? heroFallbackImage
    : getWallpaperImage(item, `flexiwalls-hero-${index}`);

  return (
    <View style={styles.heroCard}>
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
            {(item as any).subtitle ||
              (item as any).description ||
              '4K Ultra HD Collection'}
          </Text>

          <View style={styles.heroFooter}>
            <Button label="Explore" trailingIcon="arrow-forward" />

            <View style={styles.likeRow}>
              <Ionicons name="heart" size={18} color={colors.textPrimary} />
              <Text style={styles.likeText}>{formatLikes(item.likes)}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
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
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    if (!data.length) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        x: activeIndex * TREND_SNAP,
        y: 0,
        animated: false,
      });
    });
  }, [activeIndex, data.length]);

  if (!data.length) return null;

  return (
    <View style={styles.trendStackWrap}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={TREND_SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
        overScrollMode="never"
        style={styles.trendStackList}
        contentContainerStyle={styles.trendStackContent}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
      >
        {data.map((item, index) => {
          const inputRange = [
            (index - 2) * TREND_SNAP,
            (index - 1) * TREND_SNAP,
            index * TREND_SNAP,
            (index + 1) * TREND_SNAP,
            (index + 2) * TREND_SNAP,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 0.92, 1, 0.92, 0.8],
            extrapolate: 'clamp',
          });

          const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [-44, -22, 0, 22, 44],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.34, 0.68, 1, 0.68, 0.34],
            extrapolate: 'clamp',
          });

          const blurOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.78, 0.42, 0, 0.42, 0.78],
            extrapolate: 'clamp',
          });

          const fadeOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.55, 0.24, 0, 0.24, 0.55],
            extrapolate: 'clamp',
          });

          const stackDepth = data.length - Math.abs(activeIndex - index);

          return (
            <View
              key={item.id}
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
                    intensity={24}
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
        })}
      </Animated.ScrollView>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const trendScrollX = useRef(new Animated.Value(0)).current;

  const [active, setActive] = useState(0);
  const [activeTrend, setActiveTrend] = useState(0);
  const [featured, setFeatured] = useState<Wallpaper[]>([]);
  const [trending, setTrending] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHome();
  }, []);

  const loadHome = async () => {
    try {
      const [hero, trend] = await Promise.all([
        getFeaturedWallpapers(),
        getTrendingWallpapers(),
      ]);

      const heroData = hero?.data ?? [];
      const trendData = trend?.data ?? [];

      const safeHeroData = heroData.length ? heroData : trendData.slice(0, 5);
      const startTrendIndex = Math.min(2, Math.max(0, trendData.length - 1));

      setFeatured(safeHeroData);
      setTrending(trendData);
      setActiveTrend(startTrendIndex);
      trendScrollX.setValue(startTrendIndex * TREND_SNAP);
    } catch (error) {
      console.log('HOME API ERROR', error);
    } finally {
      setLoading(false);
    }
  };

  const onHeroScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (HERO_W + spacing.md));
    setActive(Math.max(0, Math.min(idx, featured.length - 1)));
  };

  const onTrendScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / TREND_SNAP);
    setActiveTrend(Math.max(0, Math.min(idx, trending.length - 1)));
  };

  const openWallpaper = (wallpaper: Wallpaper) => {
    navigation.navigate('WallpaperDetails', { wallpaper });
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
          contentContainerStyle={{ paddingBottom: 130 }}
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
            style={{ paddingTop: spacing.md }}
          />

          <FlatList
            data={featured}
            keyExtractor={i => i.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={HERO_W + spacing.md}
            onMomentumScrollEnd={onHeroScrollEnd}
            contentContainerStyle={styles.heroListContent}
            ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
            renderItem={({ item, index }) => (
              <HeroCard item={item} index={index} />
            )}
          />

          <View style={styles.dots}>
            {featured.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === active && styles.dotActive]}
              />
            ))}
          </View>

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

  heroListContent: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  heroCard: {
    width: HERO_W,
    height: HERO_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
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
    marginTop: spacing.xxl,
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
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 12,
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
});