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
import { getCategoryWallpapers } from '../../services/categoryService';
import { Wallpaper } from '../../services/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryDetail'>;

const GAP = spacing.lg;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.5;

/** Placeholder tiles so the screen looks complete if the API is empty/offline. */
const placeholderFor = (category: any): Wallpaper[] =>
  Array.from({ length: 6 }).map((_, i) => {
    const seed = `${category?.slug ?? 'cat'}-${i}`;
    return {
      id: `ph-${seed}`,
      title: `${category?.name ?? 'Wallpaper'} ${i + 1}`,
      imageUrl: `https://picsum.photos/seed/${seed}/600/900`,
      thumbnailUrl: `https://picsum.photos/seed/${seed}/600/900`,
      quality: i % 2 === 0 ? '4K' : '8K',
    };
  });

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

const CategoryDetailScreen = ({ navigation, route }: Props) => {
  const category = route.params?.category ?? {};
  const [items, setItems] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      const res = await getCategoryWallpapers(category.slug);
      const list = res.data?.wallpapers ?? [];
      setItems(list.length ? list : placeholderFor(category));
    } catch (error) {
      console.log('CATEGORY DETAIL ERROR', error);
      setItems(placeholderFor(category));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="category" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <RoundButton icon="chevron-back" onPress={() => navigation.goBack()} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {category.name ?? 'Category'}
            </Text>
            <Text style={styles.headerSub}>
              {category.count ?? items.length} wallpapers
            </Text>
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
            renderItem={({ item }) => (
              <WallpaperTile
                item={item}
                onPress={() =>
                  navigation.navigate('WallpaperDetails', { wallpaper: item })
                }
              />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default CategoryDetailScreen;

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
