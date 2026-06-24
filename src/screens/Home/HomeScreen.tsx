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
import { useNavigation } from '@react-navigation/native';

import MeshBackground from '../../components/MeshBackground';
import Button from '../../components/Button';

import { colors } from '../../styles/colors';
import { typography, fontFamily } from '../../styles/typography';
import { spacing, radius, SCREEN } from '../../utils/constants';

import API from '../../services/api';
import {
  getFeaturedWallpapers,
  getWallpapers,
} from '../../services/wallpaperService';

import { Wallpaper } from '../../services/types';

const flexiWallsLogo = require('../../assets/images/flexiwalls-logo.png');
const proButtonIcon = require('../../assets/images/pro-button.png');

const HERO_W = SCREEN.width - spacing.xl * 2;
const HERO_H = 480;
const HERO_GAP = spacing.md;
const HERO_SNAP = HERO_W + HERO_GAP;

const ALL_GRID_GAP = spacing.md;
const ALL_GRID_CARD_W = (SCREEN.width - spacing.xl * 2 - ALL_GRID_GAP) / 2;
const ALL_GRID_CARD_H = ALL_GRID_CARD_W * 1.52;

// Keep this 30 because backend max limit is 50.
// 80 was making Home API fail.
const ALL_PAGE_SIZE = 30;
const MAX_ALL_PAGES = 10;

const API_ORIGIN = String(API.defaults.baseURL || '').replace(/\/api\/?$/, '');

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
    console.log(
      'HOME ALL WALLPAPERS ERROR',
      (error as any)?.response?.data || (error as any)?.message || error,
    );

    return [];
  }
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
    <View style={styles.homeProIconWrap}>
      <Image
        source={proButtonIcon}
        style={styles.homeProIcon}
        resizeMode="contain"
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.homeProShine,
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
          style={styles.homeProShineGradient}
        />
      </Animated.View>
    </View>
  );
};

const HomeTopHeader = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.homeHeader}>
      <View style={styles.homeActionRow}>
        <Image
          source={flexiWallsLogo}
          style={styles.homeLogoLeft}
          resizeMode="contain"
        />

        <View style={styles.homeRightActions}>
          <Pressable
            onPress={() => navigation.navigate('Premium')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.homePremiumButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ShinyProIcon />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Search')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.homeRightButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <BlurView intensity={30} tint="dark" style={styles.homeRoundButton}>
              <Ionicons name="search" size={20} color={colors.textPrimary} />
            </BlurView>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const HeroCard = ({
  item,
  onPress,
  onExploreCategory,
}: {
  item: Wallpaper;
  index: number;
  onPress?: () => void;
  onExploreCategory?: () => void;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const image = imageFailed ? undefined : getWallpaperImage(item);

  if (!image) {
    return (
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [
          styles.heroCard,
          styles.missingHeroCard,
          pressed && onPress && styles.heroPressed,
        ]}
      >
        <BlurView intensity={24} tint="dark" style={styles.qualityBadge}>
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
            Image URL missing from DB
          </Text>
        </View>
      </Pressable>
    );
  }

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

const AllWallpaperCard = ({
  item,
  onPress,
}: {
  item: Wallpaper;
  index: number;
  onPress: () => void;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const image = imageFailed ? undefined : getWallpaperImage(item);

  if (!image) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.allWallpaperCard,
          styles.missingAllCard,
          pressed && styles.allWallpaperPressed,
        ]}
      >
        <Ionicons
          name="image-outline"
          size={26}
          color={colors.textSecondary}
        />
        <Text style={styles.missingImageText} numberOfLines={2}>
          Image URL missing
        </Text>
      </Pressable>
    );
  }

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
            {data.length
              ? `${data.length} wallpapers available`
              : 'Latest uploads'}
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

  const [activeHero, setActiveHero] = useState(0);
  const [featured, setFeatured] = useState<Wallpaper[]>([]);
  const [allWallpapers, setAllWallpapers] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHome = async () => {
    try {
      setLoading(true);

      let heroData: Wallpaper[] = [];
      let allData: Wallpaper[] = [];

      try {
        const hero = await getFeaturedWallpapers();
        heroData = hero?.data ?? [];
      } catch (error) {
        console.log(
          'HOME FEATURED ERROR',
          (error as any)?.response?.data || (error as any)?.message || error,
        );
      }

      try {
        allData = await fetchAllWallpapers();
      } catch (error) {
        console.log(
          'HOME ALL ERROR',
          (error as any)?.response?.data || (error as any)?.message || error,
        );
      }

      const mergedAllData = uniqueWallpapers([...allData, ...heroData]);

      const safeHeroData =
        heroData.length > 0 ? heroData : mergedAllData.slice(0, 5);

      setFeatured(safeHeroData);
      setAllWallpapers(mergedAllData);
      setActiveHero(0);
      heroScrollX.setValue(0);
    } catch (error) {
      console.log(
        'HOME LOAD ERROR',
        (error as any)?.response?.data || (error as any)?.message || error,
      );

      setFeatured([]);
      setAllWallpapers([]);
    } finally {
      setLoading(false);
    }
  };

  const onHeroScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_SNAP);
    setActiveHero(Math.max(0, Math.min(idx, featured.length - 1)));
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
          <HomeTopHeader navigation={navigation} />

          <HeroSmoothCarousel
            data={featured}
            scrollX={heroScrollX}
            activeIndex={activeHero}
            onMomentumEnd={onHeroScrollEnd}
            onPressItem={openWallpaper}
            onExploreCategory={openWallpaperCategory}
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
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 90,
  },

  homeHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 0,
  },
  homeActionRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'visible',
    marginBottom: -8,
  },
  homeLogoLeft: {
    width: 175,
    height: 120,
    marginLeft: -18,
    marginTop: 8,
  },
  homeRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },
  homePremiumButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  homeProIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  homeProIcon: {
    width: 36,
    height: 36,
  },
  homeProShine: {
    position: 'absolute',
    top: -12,
    bottom: -12,
    width: 22,
    opacity: 0.95,
  },
  homeProShineGradient: {
    flex: 1,
  },
  homeRightButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  homeRoundButton: {
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

  heroCarouselWrap: {
    marginTop: spacing.xs,
  },
  heroCarouselContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: 0,
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
    marginTop: spacing.xs,
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
  missingHeroCard: {
    justifyContent: 'flex-end',
    backgroundColor: colors.baseElevated,
  },
  qualityBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    zIndex: 10,
    elevation: 10,
  },
  qualityText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 16,
  },
  qualitySub: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 8,
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
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.textPrimary,
    ...typography.heroTitle,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
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
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
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

  allSection: {
    marginTop: spacing.md,
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
  missingAllCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: 8,
  },
  missingImageText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    textAlign: 'center',
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
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },
  allWallpaperBottom: {
    padding: spacing.sm,
  },
  allWallpaperTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
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
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
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
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
});