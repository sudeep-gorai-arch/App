import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  ImageBackground,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Animated,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import MeshBackground from "../../components/MeshBackground";
import Button from "../../components/Button";

import { colors } from "../../styles/colors";
import { spacing, radius, SCREEN } from "../../utils/constants";

import API from "../../services/api";
import {
  getFeaturedWallpapers,
  getWallpapers,
} from "../../services/wallpaperService";

import { Wallpaper } from "../../services/types";
import { appEvents } from "../../utils/appEvents";

const flexiWallsLogo = require("../../assets/images/flexiwalls-logo.png");
const proButtonIcon = require("../../assets/images/pro-button.png");

const HERO_W = SCREEN.width - spacing.xl * 2;
const HERO_H = 480;
const HERO_GAP = spacing.md;
const HERO_SNAP = HERO_W + HERO_GAP;

const HOME_WALLPAPER_LIMIT = 10;

const GRID_GAP = spacing.md;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GRID_GAP) / 2;
const CARD_H = CARD_W * 1.52;

const API_ORIGIN = String(API.defaults.baseURL || "").replace(/\/api\/?$/, "");

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

  if (url.startsWith("//")) return `https:${url}`;

  if (url.startsWith("/")) {
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

const getFavoriteCount = (item: Wallpaper) => {
  const wallpaper = item as Wallpaper & Record<string, any>;

  return Math.max(
    toNumber(wallpaper.favoriteCount),
    toNumber(wallpaper.favorite_count),
    toNumber(wallpaper.favoritesCount),
    toNumber(wallpaper.favorites_count),
    toNumber(wallpaper._count?.favorites),
    toNumber(wallpaper.favorites),
  );
};

const slugifyCategory = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const prettifyCategoryName = (value?: string) =>
  String(value || "Category")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getWallpaperCategoryForNavigation = (wallpaper: Wallpaper) => {
  const w = wallpaper as Wallpaper & Record<string, any>;

  if (w.category && typeof w.category === "object") {
    const categoryName = w.category.name || w.category.slug || "Category";
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
    "";

  if (!rawCategory || typeof rawCategory !== "string") {
    return null;
  }

  const slug = slugifyCategory(rawCategory);

  return {
    id: slug,
    name: prettifyCategoryName(rawCategory),
    slug,
  };
};

const uniqueWallpapers = (items: Wallpaper[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const getWallpaperEventId = (item: Wallpaper | Record<string, any>) => {
  const wallpaper = item as Wallpaper & Record<string, any>;

  return String(
    wallpaper?.id ||
      wallpaper?._id ||
      wallpaper?.wallpaperId ||
      wallpaper?.wallpaper_id ||
      "",
  );
};

const patchWallpaperList = (
  items: Wallpaper[],
  wallpaperId: string,
  patch: Record<string, any>,
) => {
  if (!wallpaperId) return items;

  let changed = false;

  const nextItems = items.map((item) => {
    if (getWallpaperEventId(item) !== wallpaperId) {
      return item;
    }

    changed = true;

    return {
      ...(item as Wallpaper & Record<string, any>),
      ...patch,
    } as Wallpaper;
  });

  return changed ? nextItems : items;
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
            transform: [{ translateX: shineTranslate }, { rotate: "18deg" }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.22)",
            "rgba(255,255,255,0.9)",
            "rgba(255,255,255,0.22)",
            "rgba(255,255,255,0)",
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
            onPress={() =>
              navigation.navigate("Premium", {
                returnTo: "Home",
              })
            }
            hitSlop={8}
            style={({ pressed }) => [
              styles.homePremiumButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ShinyProIcon />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("Search")}
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
          <Text style={styles.qualityText}>{item.quality || "4K"}</Text>
          <Text style={styles.qualitySub}>ULTRA HD</Text>
        </BlurView>

        <View style={styles.heroContent}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>
              {item.category?.name || "Featured"}
            </Text>
          </View>

          <Text style={styles.heroTitle} numberOfLines={2}>
            {item.title || "Premium Wallpaper"}
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
          colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)", "rgba(10,8,25,0.85)"]}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />

        <BlurView intensity={30} tint="dark" style={styles.qualityBadge}>
          <Text style={styles.qualityText}>{item.quality || "4K"}</Text>
          <Text style={styles.qualitySub}>ULTRA HD</Text>
        </BlurView>

        <View style={styles.heroContent}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>
              {item.category?.name || "Featured"}
            </Text>
          </View>

          <Text style={styles.heroTitle} numberOfLines={2}>
            {item.title || "Premium Wallpaper"}
          </Text>

          <Text style={styles.heroSubtitle} numberOfLines={2}>
            {item.subtitle ||
              (item as any).description ||
              "4K Ultra HD Collection"}
          </Text>

          <View style={styles.heroFooter}>
            <Button
              label="Explore"
              trailingIcon="arrow-forward"
              onPress={onExploreCategory}
            />

            <View style={styles.likeRow}>
              <Ionicons name="heart" size={18} color={colors.textPrimary} />
              <Text style={styles.likeText}>
                {formatCount(getFavoriteCount(item))}
              </Text>
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
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.62, 1, 0.62],
            extrapolate: "clamp",
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [16, 0, 16],
            extrapolate: "clamp",
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

const WallpaperCard = ({
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
          styles.wallpaperCard,
          styles.missingCard,
          pressed && styles.wallpaperPressed,
        ]}
      >
        <Ionicons name="image-outline" size={26} color={colors.textSecondary} />
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
        styles.wallpaperCard,
        pressed && styles.wallpaperPressed,
      ]}
    >
      <ImageBackground
        source={{ uri: image }}
        style={styles.wallpaperImage}
        imageStyle={{ borderRadius: radius.lg }}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)", "rgba(5,4,14,0.82)"]}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />

        <View style={styles.wallpaperTop}>
          <BlurView intensity={28} tint="dark" style={styles.qualityChip}>
            <Text style={styles.qualityChipText}>{item.quality || "4K"}</Text>
          </BlurView>
        </View>

        <View style={styles.wallpaperBottom}>
          <Text style={styles.wallpaperTitle} numberOfLines={1}>
            {item.title || "Wallpaper"}
          </Text>

          <View style={styles.wallpaperMeta}>
            <Ionicons
              name="heart-outline"
              size={13}
              color={colors.textPrimary}
            />
            <Text style={styles.wallpaperMetaText}>
              {formatCount(getFavoriteCount(item))}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const AllWallpapersPreview = ({
  data,
  onPressItem,
  onViewAll,
}: {
  data: Wallpaper[];
  onPressItem: (item: Wallpaper) => void;
  onViewAll: () => void;
}) => {
  return (
    <View style={styles.allSection}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>All Wallpapers</Text>
          <Text style={styles.sectionSubtitle}>
            {data.length ? "Showing latest 10 wallpapers" : "Latest uploads"}
          </Text>
        </View>
      </View>

      {data.length ? (
        <View style={styles.grid}>
          {data.map((item) => (
            <WallpaperCard
              key={item.id}
              item={item}
              onPress={() => onPressItem(item)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Ionicons
            name="images-outline"
            size={28}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No wallpapers found.</Text>
        </View>
      )}

      <Pressable
        onPress={onViewAll}
        style={({ pressed }) => [
          styles.viewAllButton,
          pressed && styles.viewAllButtonPressed,
        ]}
      >
        <Text style={styles.viewAllText}>View All Wallpapers</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const heroScrollX = useRef(new Animated.Value(0)).current;
  const hasLoadedOnce = useRef(false);

  const [activeHero, setActiveHero] = useState(0);
  const [featured, setFeatured] = useState<Wallpaper[]>([]);
  const [homeWallpapers, setHomeWallpapers] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);

    await loadHome(true);
  };

  const loadHome = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      let heroData: Wallpaper[] = [];
      let latestData: Wallpaper[] = [];

      try {
        const hero = await getFeaturedWallpapers();
        heroData = hero?.data ?? [];
      } catch (error) {
        console.log(
          "HOME FEATURED ERROR",
          (error as any)?.response?.data || (error as any)?.message || error,
        );
      }

      try {
        const latest = await getWallpapers({
          limit: HOME_WALLPAPER_LIMIT,
          offset: 0,
        });
        latestData = latest?.data ?? [];
      } catch (error) {
        console.log(
          "HOME WALLPAPERS ERROR",
          (error as any)?.response?.data || (error as any)?.message || error,
        );
      }

      const safeLatestData = uniqueWallpapers(latestData).slice(
        0,
        HOME_WALLPAPER_LIMIT,
      );

      const safeHeroData =
        heroData.length > 0 ? heroData : safeLatestData.slice(0, 5);

      setFeatured(safeHeroData);
      setHomeWallpapers(safeLatestData);
      setActiveHero(0);
      heroScrollX.setValue(0);
    } catch (error) {
      console.log(
        "HOME LOAD ERROR",
        (error as any)?.response?.data || (error as any)?.message || error,
      );

      setFeatured([]);
      setHomeWallpapers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribeFavorites = appEvents.on("favoritesChanged", (payload) => {
      const wallpaperId = String(payload.wallpaperId || "");

      const patch = {
        ...(payload.wallpaper || {}),
        isFavorite: Boolean(payload.isFavorite),
        is_favorite: Boolean(payload.isFavorite),
        favoriteCount: payload.favoriteCount,
        favorite_count: payload.favoriteCount,
        favoritesCount: payload.favoriteCount,
      };

      setFeatured((current) => patchWallpaperList(current, wallpaperId, patch));
      setHomeWallpapers((current) =>
        patchWallpaperList(current, wallpaperId, patch),
      );
    });

    const unsubscribeDownloads = appEvents.on("downloadsChanged", (payload) => {
      const wallpaperId = String(payload.wallpaperId || "");

      const patch = {
        ...(payload.wallpaper || {}),
        downloadCount: payload.downloadCount,
        download_count: payload.downloadCount,
        downloads: payload.downloadCount,
      };

      setFeatured((current) => patchWallpaperList(current, wallpaperId, patch));
      setHomeWallpapers((current) =>
        patchWallpaperList(current, wallpaperId, patch),
      );
    });

    const unsubscribeWallpaper = appEvents.on("wallpaperChanged", (payload) => {
      const wallpaperId = String(
        payload.wallpaperId || payload.wallpaper?.id || "",
      );

      if (!wallpaperId || !payload.wallpaper) {
        return;
      }

      setFeatured((current) =>
        patchWallpaperList(current, wallpaperId, payload.wallpaper),
      );
      setHomeWallpapers((current) =>
        patchWallpaperList(current, wallpaperId, payload.wallpaper),
      );
    });

    const unsubscribeWallpapers = appEvents.on("wallpapersChanged", () => {
      loadHome(true);
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
        loadHome(true);
        return;
      }

      hasLoadedOnce.current = true;
      loadHome();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onHeroScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_SNAP);
    setActiveHero(Math.max(0, Math.min(idx, featured.length - 1)));
  };

  const openWallpaper = (wallpaper: Wallpaper) => {
    navigation.navigate("WallpaperDetails", { wallpaper });
  };

  const openWallpaperCategory = (wallpaper: Wallpaper) => {
    const category = getWallpaperCategoryForNavigation(wallpaper);

    if (!category?.slug) {
      console.log("No category linked to this wallpaper");
      return;
    }

    navigation.navigate("CategoryDetail", { category });
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

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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
          <HomeTopHeader navigation={navigation} />

          <HeroSmoothCarousel
            data={featured}
            scrollX={heroScrollX}
            activeIndex={activeHero}
            onMomentumEnd={onHeroScrollEnd}
            onPressItem={openWallpaper}
            onExploreCategory={openWallpaperCategory}
          />

          <AllWallpapersPreview
            data={homeWallpapers}
            onPressItem={openWallpaper}
            onViewAll={() => navigation.navigate("AllWallpapers")}
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
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  homeHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 0,
  },
  homeActionRow: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "visible",
    marginBottom: -8,
  },
  homeLogoLeft: {
    width: 175,
    height: 120,
    marginLeft: -18,
    marginTop: 8,
  },
  homeRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 5,
  },
  homePremiumButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    backgroundColor: "transparent",
  },
  homeProIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  homeProIcon: {
    width: 36,
    height: 36,
  },
  homeProShine: {
    position: "absolute",
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
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  homeRoundButton: {
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xs,
  },
  heroCard: {
    width: HERO_W,
    height: HERO_H,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  heroPressed: {
    opacity: 0.92,
  },
  heroImage: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: colors.baseElevated,
  },
  missingHeroCard: {
    justifyContent: "flex-end",
    backgroundColor: colors.baseElevated,
  },
  qualityBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    zIndex: 10,
    elevation: 10,
  },
  qualityText: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 16,
  },
  qualitySub: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 8,
    letterSpacing: 1,
  },
  heroContent: {
    padding: spacing.xl,
  },
  tagPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  tagText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
    maxWidth: "78%",
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  likeText: {
    color: colors.textPrimary,
    fontWeight: "700",
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
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },
  allSection: {
    marginTop: spacing.md,
  },
  grid: {
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  wallpaperCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.baseElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  wallpaperPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  wallpaperImage: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: colors.baseElevated,
  },
  missingCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    gap: 8,
  },
  missingImageText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  wallpaperTop: {
    alignItems: "flex-start",
    padding: spacing.sm,
  },
  qualityChip: {
    borderRadius: radius.pill,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  qualityChipText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 11,
  },
  wallpaperBottom: {
    padding: spacing.sm,
  },
  wallpaperTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 6,
  },
  wallpaperMeta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  wallpaperMetaText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 11,
  },
  emptyBox: {
    marginHorizontal: spacing.xl,
    height: 150,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  emptyText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 14,
  },
  viewAllButton: {
    alignSelf: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.glassFillStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  viewAllButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  viewAllText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
});