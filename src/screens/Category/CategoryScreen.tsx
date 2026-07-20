import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
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

import { AdIds } from '../../ads/AdIds';
import * as SecureStore from 'expo-secure-store';
import { getProfile } from '../../services/authService';

const flexiWallsLogo = require('../../assets/images/flexiwalls-logo.png');

type Nav = { navigate: (name: string, params?: any) => void };

type CategoryTab = 'All' | 'Popular' | 'New' | 'Premium';
type CategoryDataSet = 'standard' | 'premium';

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
}: {
  item: Category;
  onPress: () => void;
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

          </View>
        </View>
      )}
    </Pressable>
  );
};

const CategoryScreen = ({ navigation }: { navigation: Nav }) => {
  const [standardCategories, setStandardCategories] = useState<Category[]>([]);
  const [premiumCategories, setPremiumCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<CategoryTab>('All');
  const [standardLoaded, setStandardLoaded] = useState(false);
  const [premiumLoaded, setPremiumLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingBySet, setLoadingBySet] = useState<
    Record<CategoryDataSet, boolean>
  >({
    standard: true,
    premium: false,
  });

  const [showAds, setShowAds] = useState(false);
  const cardEntranceAnim = useRef(new Animated.Value(0)).current;
  const requestIdsRef = useRef<Record<CategoryDataSet, number>>({
    standard: 0,
    premium: 0,
  });

  const animatedTabsRef = useRef<Record<CategoryTab, boolean>>({
    All: false,
    Popular: false,
    New: false,
    Premium: false,
  });

  const setDataSetLoading = (dataSet: CategoryDataSet, value: boolean) => {
    setLoadingBySet(current => ({
      ...current,
      [dataSet]: value,
    }));
  };

  const checkAdsVisibility = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('token');

      // Guest users -> show ads
      if (!token) {
        setShowAds(true);
        return;
      }

      const response = await getProfile();

      // Free user -> show ads
      // Premium user -> hide ads
      setShowAds(!response.data.isPremium);
    } catch (error) {
      console.log('Ad visibility error', error);

      // In case of error, show ads
      setShowAds(true);
    }
  }, []);

  const loadData = async (dataSet: CategoryDataSet, isRefresh = false) => {
    const requestId = requestIdsRef.current[dataSet] + 1;
    requestIdsRef.current[dataSet] = requestId;

    if (!isRefresh) {
      setDataSetLoading(dataSet, true);
    }

    try {
      const response = await getCategories({
        premiumOnly: dataSet === 'premium',
      });

      if (requestId !== requestIdsRef.current[dataSet]) {
        return;
      }

      const apiCategories = Array.isArray(response.data)
        ? response.data.map(normalizeCategory)
        : [];

      if (dataSet === 'premium') {
        setPremiumCategories(apiCategories);
        setPremiumLoaded(true);
      } else {
        setStandardCategories(apiCategories);
        setStandardLoaded(true);
      }
    } catch (error) {
      if (requestId !== requestIdsRef.current[dataSet]) {
        return;
      }

      console.log('CATEGORY ERROR', error);

      // Keep previously loaded cards visible when a pull-to-refresh fails.
      if (dataSet === 'premium') {
        if (!isRefresh) {
          setPremiumCategories([]);
        }

        setPremiumLoaded(true);
      } else {
        if (!isRefresh) {
          setStandardCategories([]);
        }

        setStandardLoaded(true);
      }
    } finally {
      if (requestId === requestIdsRef.current[dataSet]) {
        setDataSetLoading(dataSet, false);
      }
    }
  };

  useEffect(() => {
    void loadData('standard');
    checkAdsVisibility();
  }, []);

  const activeDataSet: CategoryDataSet =
    activeTab === 'Premium' ? 'premium' : 'standard';

  const activeDataLoaded =
    activeDataSet === 'premium' ? premiumLoaded : standardLoaded;

  const activeDataLoading = loadingBySet[activeDataSet];

  const sourceCategories =
    activeDataSet === 'premium' ? premiumCategories : standardCategories;

  const visibleCategories = useMemo(() => {
    const list = [...sourceCategories];

    if (activeTab === 'Popular') {
      return list.sort((a, b) => getCountValue(b) - getCountValue(a));
    }

    if (activeTab === 'New') {
      return list.sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
    }

    return list;
  }, [activeTab, sourceCategories]);

  useEffect(() => {
    if (!activeDataLoaded || activeDataLoading) {
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
    activeDataLoaded,
    activeDataLoading,
    activeTab,
    cardEntranceAnim,
    visibleCategories.length,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await loadData(activeDataSet, true);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (tab: CategoryTab) => {
    if (tab === activeTab) return;

    if (animatedTabsRef.current[tab]) {
      cardEntranceAnim.setValue(1);
    } else {
      cardEntranceAnim.setValue(0);
    }

    setActiveTab(tab);

    // All, Popular and New share one cached response. Premium is fetched only
    // the first time it is opened and is then cached as well.
    if (tab === 'Premium' && !premiumLoaded && !loadingBySet.premium) {
      void loadData('premium');
    }
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
        />
      </Animated.View>
    );
  };

  const isInitialLoading = !standardLoaded && loadingBySet.standard;
  const showCardsLoader = !activeDataLoaded || activeDataLoading;

  if (isInitialLoading) {
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
          data={showCardsLoader ? [] : visibleCategories}
          extraData={activeTab}
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
            showCardsLoader ? (
              <View style={styles.cardsLoadingBox}>
                <ActivityIndicator size="small" color={colors.textPrimary} />
                <Text style={styles.cardsLoadingText}>
                  Loading categories...
                </Text>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="grid-outline"
                  size={28}
                  color={colors.textSecondary}
                />

                <Text style={styles.emptyText}>No categories found.</Text>
              </View>
            )
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
  cardsLoadingBox: {
    marginHorizontal: spacing.xl,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  cardsLoadingText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
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
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
});