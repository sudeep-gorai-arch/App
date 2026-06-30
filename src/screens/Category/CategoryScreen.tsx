import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ImageBackground,
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
import { Category } from '../../services/types';

import { colors } from '../../styles/colors';
import { fontFamily } from '../../styles/typography';

import { spacing, radius, SCREEN } from '../../utils/constants';

const flexiWallsLogo = require('../../assets/images/flexiwalls-logo.png');
const proButtonIcon = require('../../assets/images/pro-button.png');

type Nav = { navigate: (name: string, params?: any) => void };

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
    <View style={styles.categoryProIconWrap}>
      <Image
        source={proButtonIcon}
        style={styles.categoryProIcon}
        resizeMode="contain"
      ></Image>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.categoryProShine,
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
          style={styles.categoryProShineGradient}
        />
      </Animated.View>
    </View>
  );
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
          <Pressable
            onPress={() =>
              navigation.navigate('Premium', {
                returnTo: 'Category',
              })
            }
            hitSlop={8}
            style={({ pressed }) => [
              styles.categoryPremiumButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ShinyProIcon />
          </Pressable>

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

            <Text style={styles.cardCount}>
              {item.wallpaperCount ?? 0} Wallpapers
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
              {item.wallpaperCount ?? 0} Wallpapers
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const CategoryScreen = ({ navigation }: { navigation: Nav }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await getCategories({
        active: true,
      });

      const apiCategories = Array.isArray(response.data) ? response.data : [];

      setCategories(apiCategories);
    } catch (error) {
      console.log('CATEGORY ERROR', error);

      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const openCategory = (item: Category) =>
    navigation.navigate('CategoryDetail', {
      category: item,
      slug: item.slug,
    });

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
          data={categories}
          keyExtractor={item => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              <CategoryTopHeader navigation={navigation} />

              <View style={styles.titleBlock}>
                <Text style={styles.title}>Categories</Text>

                <Text style={styles.subtitle}>
                  Explore wallpapers by your favorite themes
                </Text>
              </View>
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
          renderItem={({ item }) => (
            <CategoryCard item={item} onPress={() => openCategory(item)} />
          )}
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

  categoryProIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  categoryProIcon: {
    width: 36,
    height: 36,
  },

  categoryProShine: {
    position: 'absolute',
    top: -12,
    bottom: -12,
    width: 22,
    opacity: 0.95,
  },

  categoryProShineGradient: {
    flex: 1,
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

  listContent: {
    paddingBottom: 130,
  },

  columnWrapper: {
    paddingHorizontal: spacing.xl,
    gap: GAP,
    marginBottom: GAP,
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
