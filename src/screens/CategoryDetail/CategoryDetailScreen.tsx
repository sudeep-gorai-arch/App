import React, { useEffect, useState } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import MeshBackground from '../../components/MeshBackground';
import { RoundButton } from '../../components/Header';

import { colors } from '../../styles/colors';
import { fontFamily } from '../../styles/typography';
import { spacing, radius, SCREEN } from '../../utils/constants';

import { RootStackParamList } from '../../navigation/RootStackParamList';
import { getCategoryWallpapers } from '../../services/wallpaperService';
import { Wallpaper } from '../../services/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryDetail'>;

const GAP = spacing.lg;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.5;

const placeholderFor = (category: any): Wallpaper[] =>
  Array.from({ length: 6 }).map((_, i) => {
    const seed = `${category?.slug ?? 'cat'}-${i}`;

    return {
      id: `ph-${seed}`,

      title: `${category?.name ?? 'Wallpaper'} ${i + 1}`,

      subtitle: undefined,

      description: undefined,

      slug: undefined,

      imageUrl: `https://picsum.photos/seed/${seed}/600/900`,

      thumbnailUrl: `https://picsum.photos/seed/${seed}/600/900`,

      videoUrl: undefined,

      quality: '4K',

      resolution: '2160x3840',

      isFeatured: false,

      isPremium: false,

      active: true,

      likes: 0,

      downloadCount: 0,

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString(),

      category,

      categoryId: category?.id,

      isFavorite: false,

      isLiked: false,
    };
  });

const getWallpaperImage = (item: Wallpaper) => {
  return item.thumbnailUrl || item.imageUrl || undefined;
};

const WallpaperTile = ({
  item,
  onPress,
}: {
  item: Wallpaper;
  onPress: () => void;
}) => {
  const image = getWallpaperImage(item);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <ImageBackground
        source={{ uri: image }}
        style={styles.cardImage}
        imageStyle={{ borderRadius: radius.lg }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.88)']}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        />

        {(item as any).isPremium ? (
          <BlurView intensity={26} tint="dark" style={styles.lockChip}>
            <Ionicons name="lock-closed" size={14} color={colors.textPrimary} />
          </BlurView>
        ) : null}

        <View style={styles.wallpaperNameBox}>
          <Text style={styles.wallpaperName} numberOfLines={2}>
            {item.title || 'Wallpaper'}
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

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

      const list = res.data ?? [];

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
          <RoundButton
            icon="chevron-back"
            onPress={() => navigation.goBack()}
          />

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
            keyExtractor={item => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
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
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
  },
  headerSub: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    marginTop: 2,
  },

  listContent: {
    paddingTop: spacing.lg,
    paddingBottom: 130,
    gap: GAP,
  },
  columnWrapper: {
    paddingHorizontal: spacing.xl,
    gap: GAP,
  },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  cardImage: {
    flex: 1,
  },

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

  wallpaperNameBox: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
  },
  wallpaperName: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 17,
  },
});
