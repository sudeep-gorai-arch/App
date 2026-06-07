import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ImageBackground,
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

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const GAP = spacing.lg;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.4;

// ---------------------------------------------------------------------------
// Dummy data (kept local so the folder is fully self-contained)
// ---------------------------------------------------------------------------
const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/900`;

type FavItem = {
  id: string;
  title: string;
  category: string;
  quality: string;
  likes: string;
  addedDaysAgo: number;
  popularity: number;
  image: string;
};

const INITIAL_FAVORITES: FavItem[] = [
  { id: 'f1', title: 'Majestic Lion', category: 'Wildlife', quality: '8K', likes: '12.5K', addedDaysAgo: 1, popularity: 98, image: img('fav-lion') },
  { id: 'f2', title: 'Neon Runner', category: 'Anime', quality: '4K', likes: '9.1K', addedDaysAgo: 3, popularity: 91, image: img('fav-neon') },
  { id: 'f3', title: 'Golden Tiger', category: 'Animals', quality: '8K', likes: '8.7K', addedDaysAgo: 2, popularity: 88, image: img('fav-tiger') },
  { id: 'f4', title: 'Super Saiyan', category: 'Anime', quality: '4K', likes: '15.2K', addedDaysAgo: 5, popularity: 99, image: img('fav-saiyan') },
  { id: 'f5', title: 'Cosmic Wolf', category: 'Abstract', quality: '8K', likes: '7.4K', addedDaysAgo: 4, popularity: 84, image: img('fav-wolf') },
  { id: 'f6', title: 'Crimson Ronin', category: 'Anime', quality: '4K', likes: '6.9K', addedDaysAgo: 7, popularity: 80, image: img('fav-ronin') },
  { id: 'f7', title: 'Alpine Mirror', category: 'Nature', quality: '8K', likes: '9.8K', addedDaysAgo: 6, popularity: 86, image: img('fav-alps') },
  { id: 'f8', title: 'Deep Field', category: 'Space', quality: '8K', likes: '5.2K', addedDaysAgo: 9, popularity: 74, image: img('fav-space') },
];

const FILTERS = ['All', 'Recent', 'Popular'] as const;
type Filter = (typeof FILTERS)[number];

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
const FavoriteCard = ({
  item,
  onRemove,
}: {
  item: FavItem;
  onRemove: (id: string) => void;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.card,
      { transform: [{ scale: pressed ? 0.98 : 1 }] },
    ]}
  >
    <ImageBackground
      source={{ uri: item.image }}
      style={styles.cardImage}
      imageStyle={{ borderRadius: radius.lg }}
    >
      <LinearGradient
        colors={['rgba(8,6,20,0.05)', 'rgba(8,6,20,0.2)', 'rgba(8,6,20,0.82)']}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
      />

      {/* quality chip */}
      <BlurView intensity={26} tint="dark" style={styles.qualityChip}>
        <Text style={styles.qualityText}>{item.quality}</Text>
      </BlurView>

      {/* heart (tap to remove) */}
      <Pressable
        hitSlop={8}
        onPress={() => onRemove(item.id)}
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }, styles.heartWrap]}
      >
        <BlurView intensity={30} tint="dark" style={styles.heartChip}>
          <Ionicons name="heart" size={18} color={colors.heart} />
        </BlurView>
      </Pressable>

      {/* meta */}
      <View style={styles.cardMeta}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardCategory}>{item.category}</Text>
          <View style={styles.likeRow}>
            <Ionicons name="heart" size={12} color={colors.textSecondary} />
            <Text style={styles.likeText}>{item.likes}</Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  </Pressable>
);

const EmptyState = () => (
  <View style={styles.emptyWrap}>
    <Card padding={spacing.xxl} style={{ alignItems: 'center' }} glowBorder>
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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const FavoritesScreen = () => {
  const [items, setItems] = useState<FavItem[]>(INITIAL_FAVORITES);
  const [filter, setFilter] = useState<Filter>('All');

  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const data = useMemo(() => {
    const copy = [...items];
    if (filter === 'Recent') {
      return copy.sort((a, b) => a.addedDaysAgo - b.addedDaysAgo);
    }
    if (filter === 'Popular') {
      return copy.sort((a, b) => b.popularity - a.popularity);
    }
    return copy;
  }, [items, filter]);

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ paddingHorizontal: spacing.xl, gap: GAP }}
          contentContainerStyle={{ paddingBottom: 130, gap: GAP }}
          ListHeaderComponent={
            <View>
              <Header
                title="Favorites"
                subtitle={`${items.length} wallpapers you've saved`}
                rightAction={{ icon: 'search' }}
                style={{ paddingTop: spacing.md }}
              />

              {/* summary banner */}
              <Card
                style={{ marginHorizontal: spacing.xl, marginTop: spacing.xl }}
                padding={spacing.lg}
                strong
              >
                <View style={styles.summaryRow}>
                  <LinearGradient
                    colors={gradients.violetMagenta}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.summaryIcon}
                  >
                    <Ionicons name="heart" size={24} color={colors.textPrimary} />
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.summaryValue}>{items.length} Saved</Text>
                    <Text style={styles.summarySub}>
                      6 collections · 342 downloads
                    </Text>
                  </View>
                  <Pressable style={styles.viewAll} hitSlop={8}>
                    <Text style={styles.viewAllText}>Manage</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={colors.textPrimary}
                    />
                  </Pressable>
                </View>
              </Card>

              {/* filter pills */}
              <BlurView intensity={30} tint="dark" style={styles.filterBar}>
                {FILTERS.map((f) => {
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
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
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
  filterTextActive: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },

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
  cardCategory: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
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
