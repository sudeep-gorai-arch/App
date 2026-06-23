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
  Animated,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';

import { colors, gradients } from '../../styles/colors';
import { fontFamily } from '../../styles/typography';

import { spacing, radius, SCREEN } from '../../utils/constants';

import { getFavorites, removeFavorite } from '../../services/favoriteService';

import { Wallpaper } from '../../services/types';

const flexiWallsLogo = require('../../assets/images/flexiwalls-logo.png');
const proButtonIcon = require('../../assets/images/pro-button.png');

const GAP = spacing.lg;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.4;

const FILTERS = ['All', 'Recent', 'Category'] as const;

type Filter = (typeof FILTERS)[number];

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
    <View style={styles.favoritesProIconWrap}>
      <Image
        source={proButtonIcon}
        style={styles.favoritesProIcon}
        resizeMode="contain"
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.favoritesProShine,
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
          style={styles.favoritesProShineGradient}
        />
      </Animated.View>
    </View>
  );
};

const FavoritesTopHeader = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.favoritesHeader}>
      <View style={styles.favoritesActionRow}>
        <Image
          source={flexiWallsLogo}
          style={styles.favoritesLogoLeft}
          resizeMode="contain"
        />

        <View style={styles.favoritesRightActions}>
          <Pressable
            onPress={() => navigation.navigate('Premium')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.favoritesPremiumButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ShinyProIcon />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Search')}
            hitSlop={8}
            style={({ pressed }) => [
              styles.favoritesRightButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <BlurView
              intensity={30}
              tint="dark"
              style={styles.favoritesRoundButton}
            >
              <Ionicons name="search" size={20} color={colors.textPrimary} />
            </BlurView>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const FavoriteCard = ({
  item,
  onRemove,
}: {
  item: Wallpaper;
  onRemove: (id: string) => void;
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          transform: [
            {
              scale: pressed ? 0.98 : 1,
            },
          ],
        },
      ]}
    >
      <ImageBackground
        source={{
          uri:
            item.imageUrl ??
            item.thumbnailUrl ??
            'https://picsum.photos/600/900',
        }}
        style={styles.cardImage}
        imageStyle={{
          borderRadius: radius.lg,
        }}
      >
        <LinearGradient
          colors={[
            'rgba(8,6,20,0.05)',
            'rgba(8,6,20,0.2)',
            'rgba(8,6,20,0.82)',
          ]}
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius.lg,
            },
          ]}
        />

        <BlurView intensity={26} tint="dark" style={styles.qualityChip}>
          <Text style={styles.qualityText}>{item.quality ?? '4K'}</Text>
        </BlurView>

        <Pressable
          hitSlop={8}
          onPress={() => onRemove(item.id)}
          style={styles.heartWrap}
        >
          <BlurView intensity={30} tint="dark" style={styles.heartChip}>
            <Ionicons name="heart" size={18} color={colors.heart} />
          </BlurView>
        </Pressable>

        <View style={styles.cardMeta}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.cardMetaRow}>
            <Text style={styles.cardCategory}>
              {item.category?.name ?? 'Wallpaper'}
            </Text>

            <View style={styles.likeRow}>
              <Ionicons name="heart" size={12} color={colors.textSecondary} />

              <Text style={styles.likeText}>{item.likes ?? 0}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const EmptyState = () => (
  <View style={styles.emptyWrap}>
    <Card
      padding={spacing.xxl}
      style={{
        alignItems: 'center',
      }}
      glowBorder
    >
      <View style={styles.emptyIcon}>
        <Ionicons name="heart-outline" size={34} color={colors.textPrimary} />
      </View>

      <Text style={styles.emptyTitle}>No favorites yet</Text>

      <Text style={styles.emptySubtitle}>
        Tap the heart on any wallpaper to save it here.
      </Text>
    </Card>
  </View>
);

const FavoritesScreen = () => {
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<Wallpaper[]>([]);
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const res = await getFavorites();

      setItems(res.data ?? []);
    } catch (error) {
      console.log('FAVORITE ERROR', error);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await removeFavorite(id);

      setItems(prev => prev.filter(x => x.id !== id));
    } catch (error) {
      console.log('REMOVE ERROR', error);
    }
  };

  const data = useMemo(() => {
    const copy = [...items];

    if (filter === 'Category') {
      return copy.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    }

    return copy;
  }, [items, filter]);

  if (loading) {
    return (
      <View style={[styles.root, styles.loadingRoot]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={data}
          keyExtractor={i => i.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              <FavoritesTopHeader navigation={navigation} />

              <View style={styles.titleBlock}>
                <Text style={styles.title}>Favorites</Text>
                <Text style={styles.subtitle}>
                  Your saved wallpapers collection
                </Text>
              </View>

              <BlurView intensity={30} tint="dark" style={styles.filterBar}>
                {FILTERS.map(f => {
                  const active = f === filter;

                  return (
                    <Pressable
                      key={f}
                      style={styles.filterItem}
                      onPress={() => setFilter(f)}
                    >
                      {active ? (
                        <LinearGradient
                          colors={gradients.blueViolet}
                          style={styles.filterActive}
                        >
                          <Text style={styles.filterTextActive}>{f}</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.filterText}>{f}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </BlurView>
            </View>
          }
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item }) => (
            <FavoriteCard item={item} onRemove={remove} />
          )}
        />
      </SafeAreaView>
    </View>
  );
};

export default FavoritesScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },
  loadingRoot: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  favoritesHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 0,
  },
  favoritesActionRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'visible',
    marginBottom: -8,
  },
  favoritesLogoLeft: {
    width: 175,
    height: 120,
    marginLeft: -18,
    marginTop: 8,
  },
  favoritesRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },
  favoritesPremiumButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  favoritesProIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  favoritesProIcon: {
    width: 36,
    height: 36,
  },
  favoritesProShine: {
    position: 'absolute',
    top: -12,
    bottom: -12,
    width: 22,
    opacity: 0.95,
  },
  favoritesProShineGradient: {
    flex: 1,
  },
  favoritesRightButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  favoritesRoundButton: {
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
    gap: GAP,
  },
  columnWrapper: {
    paddingHorizontal: spacing.xl,
    gap: GAP,
  },

  filterBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillSoft,
  },
  filterItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActive: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  filterText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    paddingVertical: 10,
  },
  filterTextActive: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
  },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  cardImage: {
    flex: 1,
  },
  qualityChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    overflow: 'hidden',
  },
  qualityText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },
  heartWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  heartChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  cardMeta: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  cardCategory: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  likeText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  emptyWrap: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillSoft,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
});