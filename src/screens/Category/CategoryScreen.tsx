import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import PremiumActionButton from '../../components/PremiumActionButton';

import API from '../../services/api';
import { getCategories } from '../../services/categoryService';
import { Category } from '../../services/types';

import { colors } from '../../styles/colors';
import { fontFamily } from '../../styles/typography';

import { spacing, radius, SCREEN } from '../../utils/constants';

const flexiWallsLogo = require('../../assets/images/flexiwalls-logo.png');

type Nav = { navigate: (name: string, params?: any) => void };

type CategoryTab = 'All' | 'Popular' | 'New' | 'Premium';

const CATEGORY_TABS: CategoryTab[] = ['All', 'Popular', 'New', 'Premium'];

const GAP = spacing.md;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = CARD_W * (9 / 16);

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

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  if (url.startsWith('/')) {
    return API_ORIGIN ? `${API_ORIGIN}${url}` : url;
  }

  return API_ORIGIN ? `${API_ORIGIN}/${url}` : url;
};

const getCategoryThumbnailUrl = (item: Category) => {
  const category = item as Category & Record<string, any>;

  return (
    toAbsoluteMediaUrl(category.thumbnailUrl) ||
    toAbsoluteMediaUrl(category.thumbnail_url) ||
    undefined
  );
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const parsed = Number(String(value ?? '').replace(/[^\d]/g, ''));

  return Number.isFinite(parsed) ? parsed : 0;
};

const getCountValue = (item: Category) => {
  const category = item as Category & Record<string, any>;

  return (
    toNumber(category.count) ||
    toNumber(category.wallpaperCount) ||
    toNumber(category._count?.wallpapers)
  );
};

const getPremiumCountValue = (item: Category) => {
  const category = item as Category & Record<string, any>;

  return toNumber(category.premiumCount);
};

const getCreatedTime = (item: Category) => {
  const value = (item as Category & Record<string, any>).createdAt;

  if (!value) return 0;

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
};

const normalizeCategory = (item: Category) => {
  const category = item as Category & Record<string, any>;

  return {
    ...category,
    id: String(category.id),
    name: String(category.name ?? ''),
    slug: String(category.slug ?? ''),
    thumbnailUrl: getCategoryThumbnailUrl(item),
  } as Category;
};

const CategoryTopHeader = ({ navigation }: { navigation: Nav }) => {
  return (
    <View style={styles.categoryHeader}>
      <View style={styles.categoryActionRow}>
        <Image
          source={flexiWallsLogo}
          style={styles.categoryLogoLeft}
          resizeMode="contain"
        />

        <View style={styles.categoryRightActions}>
          <PremiumActionButton
            returnTo="Category"
            style={styles.categoryPremiumButton}
          />

          <Pressable
            onPress={() => navigation.navigate('Search')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.categoryRightButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <BlurView
              intensity={30}
              tint="dark"
              style={styles.categoryRoundButton}
            >
              <Ionicons name="search" size={20} color={colors.textPrimary} />
            </BlurView>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const CategoryTabs = ({
  activeTab,
  onChange,
}: {
  activeTab: CategoryTab;
  onChange: (tab: CategoryTab) => void;
}) => {
  return (
    <View style={styles.tabsWrap}>
      <BlurView intensity={34} tint="dark" style={styles.tabsGlass}>
        <View style={styles.tabsRow}>
          {CATEGORY_TABS.map(tab => {
            const selected = activeTab === tab;

            return (
              <Pressable
                key={tab}
                onPress={() => onChange(tab)}
                style={({ pressed }) => [
                  styles.tabButton,
                  selected && styles.tabButtonActive,
                  pressed && !selected && styles.tabButtonPressed,
                ]}
              >
                {selected ? (
                  <LinearGradient
                    colors={['#4D8DFF', '#8B35FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}

                <Text
                  style={[
                    styles.tabText,
                    selected ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                  numberOfLines={1}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const CategoryCard = ({
  item,
  onPress,
  isPremium,
}: {
  item: Category;
  onPress: () => void;
  isPremium: boolean;
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const thumbnailUrl = imageFailed ? undefined : getCategoryThumbnailUrl(item);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {thumbnailUrl ? (
        <ImageBackground
          source={{ uri: thumbnailUrl }}
          style={styles.cardImage}
          imageStyle={{ borderRadius: radius.lg }}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        >
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.04)',
              'rgba(0,0,0,0.12)',
              'rgba(0,0,0,0.76)',
            ]}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
          />

          <View style={styles.cardLabel}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>

            <Text style={styles.cardCount}>
              {`${
                isPremium ? getPremiumCountValue(item) : getCountValue(item)
              } Wallpapers`}
            </Text>
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.cardPlaceholder}>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.08)',
              'rgba(255,255,255,0.02)',
              'rgba(0,0,0,0.35)',
            ]}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
          />

          <Ionicons
            name="image-outline"
            size={28}
            color={colors.textSecondary}
          />

          <View style={styles.cardLabel}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>

            <Text style={styles.cardCount}>
              {`${
                isPremium ? getPremiumCountValue(item) : getCountValue(item)
              } Wallpapers`}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const CategoryScreen = ({ navigation }: { navigation: Nav }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<CategoryTab>('All');
  const [loadedTab, setLoadedTab] = useState<CategoryTab | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cardEntranceAnim = useRef(new Animated.Value(0)).current;
  const requestIdRef = useRef(0);

  const animatedTabsRef = useRef<Record<CategoryTab, boolean>>({
    All: false,
    Popular: false,
    New: false,
    Premium: false,
  });

  const loadData = async (isRefresh = false, tabForRequest = activeTab) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      if (!isRefresh) {
        setLoading(true);
      }

      const response = await getCategories({
        premiumOnly: tabForRequest === 'Premium',
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      const apiCategories = Array.isArray(response.data)
        ? response.data.map(normalizeCategory)
        : [];

      setCategories(apiCategories);
      setLoadedTab(tabForRequest);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.log('CATEGORY ERROR', error);

      setCategories([]);
      setLoadedTab(tabForRequest);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadData(false, activeTab);
  }, [activeTab]);

  const visibleCategories = useMemo(() => {
    const list = [...categories];

    if (activeTab === 'Popular') {
      return list.sort((a, b) => getCountValue(b) - getCountValue(a));
    }

    if (activeTab === 'New') {
      return list.sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
    }

    return list;
  }, [activeTab, categories]);

  useEffect(() => {
    if (loading || loadedTab !== activeTab) {
      return;
    }

    if (animatedTabsRef.current[activeTab]) {
      cardEntranceAnim.setValue(1);
      return;
    }

    animatedTabsRef.current[activeTab] = true;

    if (visibleCategories.length === 0) {
      cardEntranceAnim.setValue(1);
      return;
    }

    cardEntranceAnim.stopAnimation();
    cardEntranceAnim.setValue(0);

    Animated.timing(cardEntranceAnim, {
      toValue: 1,
      duration: 820,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [
    activeTab,
    loadedTab,
    loading,
    visibleCategories.length,
    cardEntranceAnim,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);

    await loadData(true, activeTab);
  };

  const handleTabChange = (tab: CategoryTab) => {
    if (tab === activeTab) return;

    if (animatedTabsRef.current[tab]) {
      cardEntranceAnim.setValue(1);
    } else {
      cardEntranceAnim.setValue(0);
    }

    setLoadedTab(null);
    setActiveTab(tab);
  };

  const openCategory = (item: Category) =>
    navigation.navigate('CategoryDetail', {
      category: item,
      initialFilter: activeTab,
      premiumOnly: activeTab === 'Premium',
    });

  const renderCategoryCard = ({
    item,
    index,
  }: {
    item: Category;
    index: number;
  }) => {
    const staggerStart = 0.02 + Math.min(index, 9) * 0.045;
    const staggerEnd = Math.min(staggerStart + 0.34, 1);

    const opacity = cardEntranceAnim.interpolate({
      inputRange: [0, staggerStart, staggerEnd, 1],
      outputRange: [0, 0, 1, 1],
      extrapolate: 'clamp',
    });

    const translateY = cardEntranceAnim.interpolate({
      inputRange: [0, staggerStart, staggerEnd, 1],
      outputRange: [24, 24, 0, 0],
      extrapolate: 'clamp',
    });

    const scale = cardEntranceAnim.interpolate({
      inputRange: [0, staggerStart, staggerEnd, 1],
      outputRange: [0.985, 0.985, 1, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.cardAnimWrap,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <CategoryCard
          item={item}
          onPress={() => openCategory(item)}
          isPremium={activeTab === 'Premium'}
        />
      </Animated.View>
    );
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
      <MeshBackground variant="category" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={visibleCategories}
          keyExtractor={item => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textPrimary}
            />
          }
          ListHeaderComponent={
            <View>
              <CategoryTopHeader navigation={navigation} />

              <View style={styles.titleBlock}>
                <Text style={styles.title}>Categories</Text>

                <Text style={styles.subtitle}>
                  Explore wallpapers by your favorite themes
                </Text>
              </View>

              <CategoryTabs activeTab={activeTab} onChange={handleTabChange} />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name="grid-outline"
                size={28}
                color={colors.textSecondary}
              />

              <Text style={styles.emptyText}>No categories found.</Text>
            </View>
          }
          renderItem={renderCategoryCard}
        />
      </SafeAreaView>
    </View>
  );
};

export default CategoryScreen;

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

  categoryHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 0,
  },

  categoryActionRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'visible',
    marginBottom: -8,
  },

  categoryLogoLeft: {
    width: 175,
    height: 120,
    marginLeft: -18,
    marginTop: 8,
  },

  categoryRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },

  categoryPremiumButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },

  categoryRightButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  categoryRoundButton: {
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

  tabsWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },

  tabsGlass: {
    height: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },

  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 6,
  },

  tabButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  tabButtonActive: {
    shadowColor: '#8B35FF',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  tabButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  tabText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    zIndex: 1,
  },

  tabTextActive: {
    color: colors.textPrimary,
  },

  tabTextInactive: {
    color: colors.textSecondary,
  },

  listContent: {
    paddingBottom: 130,
  },

  columnWrapper: {
    paddingHorizontal: spacing.xl,
    gap: GAP,
    marginBottom: GAP,
  },

  cardAnimWrap: {
    width: CARD_W,
    height: CARD_H,
  },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.baseElevated,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  cardImage: {
    flex: 1,
  },

  cardPlaceholder: {
    flex: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },

  cardLabel: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 9,
  },

  cardName: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    letterSpacing: -0.2,
  },

  cardCount: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    marginTop: 1,
  },

  emptyBox: {
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

  emptyText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
});