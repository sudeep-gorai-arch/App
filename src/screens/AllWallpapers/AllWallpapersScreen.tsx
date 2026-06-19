import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import MeshBackground from '../../components/MeshBackground';
import { RoundButton } from '../../components/Header';
import { colors } from '../../styles/colors';
import { spacing, radius, SCREEN } from '../../utils/constants';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { getWallpapers } from '../../services/wallpaperService';
import { Wallpaper } from '../../services/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AllWallpapers'>;

const GAP = spacing.lg;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.5;
const PAGE = 30;

/** Newest upload first. Safety net in case any item arrives unordered. */
const byNewest = (a: Wallpaper, b: Wallpaper) => {
  const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return tb - ta;
};

/** Placeholder tiles so the screen looks complete if the API is empty/offline. */
const placeholders = (): Wallpaper[] =>
  Array.from({ length: 12 }).map((_, i) => ({
    id: `ph-all-${i}`,
    title: `Wallpaper ${i + 1}`,
    imageUrl: `https://picsum.photos/seed/all-${i}/600/900`,
    thumbnailUrl: `https://picsum.photos/seed/all-${i}/600/900`,
    quality: i % 2 === 0 ? '4K' : '8K',
  }));

const WallpaperTile = ({
  item,
  onPress,
}: {
  item: Wallpaper;
  onPress: () => void;
}) => (
  <Pressable style={styles.card} onPress={onPress}>
    <Image
      source={{ uri: item.thumbnailUrl ?? item.imageUrl ?? undefined }}
      style={styles.cardImage}
    />
    {item.quality ? (
      <BlurView intensity={26} tint="dark" style={styles.qualityChip}>
        <Text style={styles.qualityText}>{item.quality}</Text>
      </BlurView>
    ) : null}
    {(item as any).isPremium ? (
      <BlurView intensity={26} tint="dark" style={styles.lockChip}>
        <Ionicons name="lock-closed" size={14} color={colors.textPrimary} />
      </BlurView>
    ) : null}
  </Pressable>
);

const AllWallpapersScreen = ({ navigation }: Props) => {
  const [items, setItems] = useState<Wallpaper[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true); // initial load
  const [loadingMore, setLoadingMore] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (reset = false) => {
    if (loadingMore && !reset) return;
    const off = reset ? 0 : offset;

    try {
      reset ? setLoading(true) : setLoadingMore(true);

      const res = await getWallpapers(PAGE, off);
      const batch = res?.data ?? [];

      setItems(prev => {
        const merged = reset ? batch : [...prev, ...batch];
        // de-dupe by id, then keep newest-first
        const seen = new Set<string>();
        const unique = merged.filter(w =>
          seen.has(w.id) ? false : (seen.add(w.id), true),
        );
        return unique.sort(byNewest);
      });

      setOffset(off + batch.length);
      if (batch.length < PAGE) setReachedEnd(true);
    } catch (error) {
      console.log('ALL WALLPAPERS ERROR', error);
      if (reset) {
        setItems(placeholders());
        setReachedEnd(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onEndReached = () => {
    if (!reachedEnd && !loadingMore && !loading) load(false);
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="home" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <RoundButton icon="chevron-back" onPress={() => navigation.goBack()} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Latest Wallpapers</Text>
            <Text style={styles.headerSub}>Sorted by upload date · newest first</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={i => i.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{ paddingHorizontal: spacing.xl, gap: GAP }}
            contentContainerStyle={{
              paddingTop: spacing.lg,
              paddingBottom: 130,
              gap: GAP,
            }}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <WallpaperTile
                item={item}
                onPress={() =>
                  navigation.navigate('WallpaperDetails', { wallpaper: item })
                }
              />
            )}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  color={colors.textPrimary}
                  style={{ marginVertical: spacing.lg }}
                />
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default AllWallpapersScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  headerTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  cardImage: { width: '100%', height: '100%' },
  qualityChip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  qualityText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  lockChip: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
});
