import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Header from '../../components/Header';
import Card from '../../components/Card';

import { colors, gradients } from '../../styles/colors';

import { spacing, radius, SCREEN } from '../../utils/constants';

import { getFavorites, removeFavorite } from '../../services/favoriteService';

import { Wallpaper } from '../../services/types';
import { useNavigation } from '@react-navigation/native';

const GAP = spacing.lg;

const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;

const CARD_H = CARD_W * 1.4;

const FILTERS = ['All', 'Recent', 'Popular'] as const;

type Filter = (typeof FILTERS)[number];

// ================= CARD =================

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
          style={[styles.heartWrap]}
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

// ================= EMPTY =================

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

// ================= SCREEN =================

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
    let copy = [...items];

    if (filter === 'Popular') {
      return copy.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    }

    return copy;
  }, [items, filter]);

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
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={data}
          keyExtractor={i => i.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{
            paddingHorizontal: spacing.xl,

            gap: GAP,
          }}
          contentContainerStyle={{
            paddingBottom: 130,

            gap: GAP,
          }}
          ListHeaderComponent={
            <View>
              <Header
                title="Favorites"
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },

  // summary banner
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  summarySub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },

  // filter pills
  filterBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    padding: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillSoft,
  },
  filterItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterActive: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 10,
  },
  filterTextActive: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },

  // cards
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  cardImage: { flex: 1 },
  qualityChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    overflow: 'hidden',
  },
  qualityText: { color: colors.textPrimary, fontSize: 11, fontWeight: '800' },
  heartWrap: { position: 'absolute', top: 10, right: 10 },
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
  cardMeta: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  cardCategory: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  likeText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },

  // empty state
  emptyWrap: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl },
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
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
});
