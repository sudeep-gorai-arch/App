import React, { useEffect, useState } from 'react';
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
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Header from '../../components/Header';
import Button from '../../components/Button';

import { colors } from '../../styles/colors';

import { spacing, radius, SCREEN } from '../../utils/constants';

import {
  getFeaturedWallpapers,
  getTrendingWallpapers,
} from '../../services/wallpaperService';

import { Wallpaper, Category } from '../../services/types';

import { useNavigation } from '@react-navigation/native';

const HERO_W = SCREEN.width - spacing.xl * 2;

const HERO_H = 480;

const HeroCard = ({ item }: { item: Wallpaper }) => {
  const image =
    item.imageUrl || item.thumbnailUrl || 'https://picsum.photos/600/1000';

  return (
    <View style={styles.heroCard}>
      <ImageBackground
        source={{
          uri: image,
        }}
        style={styles.heroImage}
        imageStyle={{
          borderRadius: radius.lg,
        }}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0)', 'rgba(10,8,25,0.85)']}
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius.lg,
            },
          ]}
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
            {item.subtitle || '4K Ultra HD Collection'}
          </Text>

          <View style={styles.heroFooter}>
            <Button label="Explore" trailingIcon="arrow-forward" />

            <View style={styles.likeRow}>
              <Ionicons name="heart" size={18} color={colors.textPrimary} />

              <Text style={styles.likeText}>{item.likes ?? 0}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const TrendingCard = ({ item }: { item: Wallpaper }) => (
  <Pressable style={styles.trendCard}>
    <ImageBackground
      source={{
        uri: item.imageUrl ?? 'https://picsum.photos/400/800',
      }}
      style={styles.trendImage}
      imageStyle={{
        borderRadius: radius.md,
      }}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.7)']}
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius.md,
          },
        ]}
      />

      <View style={styles.trendTop}>
        <BlurView intensity={26} tint="dark" style={styles.fireChip}>
          <Text>🔥</Text>
        </BlurView>

        <Text style={styles.trendQuality}>{item.quality ?? '4K'}</Text>
      </View>

      <View style={styles.trendBottom}>
        <Ionicons name="heart" size={14} color={colors.textPrimary} />

        <Text style={styles.trendLikes}>{item.likes ?? 0}</Text>
      </View>
    </ImageBackground>
  </Pressable>
);

const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const [active, setActive] = useState(0);

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

      setFeatured(hero?.data ?? []);

      setTrending(trend?.data ?? []);
    } catch (error) {
      console.log('HOME API ERROR', error);
    } finally {
      setLoading(false);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(
      e.nativeEvent.contentOffset.x / (HERO_W + spacing.md),
    );

    setActive(idx);
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
          contentContainerStyle={{
            paddingBottom: 130,
          }}
        >
          <Header
            eyebrow="Good Morning 👋"
            title={'Find Your\nPerfect Wallpaper'}
            leftAction={{
              icon: 'person-outline',
              onPress: () => navigation.navigate('ProfileScreen'),
            }}
            rightAction={{
              icon: 'search',
              onPress: () => navigation.navigate('SearchScreen'),
            }}
            style={{
              paddingTop: spacing.md,
            }}
          />

          <FlatList
            data={featured}
            keyExtractor={i => i.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={HERO_W + spacing.md}
            onMomentumScrollEnd={onScroll}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,

              marginTop: spacing.xl,
            }}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  width: spacing.md,
                }}
              />
            )}
            renderItem={({ item }) => <HeroCard item={item} />}
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
            <Text style={styles.sectionTitle}>Trending</Text>

            <Text style={styles.viewAllText}>View all</Text>
          </View>

          <FlatList
            data={trending}
            keyExtractor={i => i.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
            }}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  width: spacing.md,
                }}
              />
            )}
            renderItem={({ item }) => <TrendingCard item={item} />}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },

  // Hero
  heroCard: {
    width: HERO_W,
    height: HERO_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  heroImage: { flex: 1, justifyContent: 'space-between' },
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
  heroContent: { padding: spacing.xl },
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
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeText: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },

  // Dots
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
  dotActive: { width: 18, backgroundColor: colors.textPrimary },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },

  // Trending
  trendCard: {
    width: 150,
    height: 230,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  trendImage: { flex: 1, justifyContent: 'space-between' },
  trendTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 10,
  },
  fireChip: {
    width: 30,
    height: 30,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fire: { fontSize: 14 },
  trendQuality: { color: colors.textPrimary, fontSize: 12, fontWeight: '800' },
  trendBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 10,
  },
  trendLikes: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
});
