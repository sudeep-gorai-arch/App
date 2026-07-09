import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import { colors } from '../../styles/colors';
import { spacing, radius, SCREEN } from '../../utils/constants';

import { searchWallpapers } from '../../services/wallpaperService';

import { getCategories } from '../../services/categoryService';

import { toggleFavorite } from '../../services/favoriteService';

import { Wallpaper, Category } from '../../services/types';

import { useAuth } from '../../context/AuthContext';

type Nav = { goBack?: () => void };

const COLS = 3;
const GAP = spacing.md;
const TILE = (SCREEN.width - spacing.xl * 2 - GAP * (COLS - 1)) / COLS;

const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

const isBlankishValue = (value: unknown) => {
  const text = String(value ?? '').trim().toLowerCase();

  return (
    !text ||
    text === 'null' ||
    text === 'undefined' ||
    text === 'false' ||
    text === '0'
  );
};

const isRealVideoUrlValue = (value: unknown) => {
  if (isBlankishValue(value)) return false;

  const text = String(value).trim();

  return (
    VIDEO_EXTENSION_PATTERN.test(text) ||
    /\/videos?\//i.test(text) ||
    /video-wallpapers?/i.test(text)
  );
};

const getWallpaperMediaType = (item: Wallpaper & Record<string, any>) => {
  return String(item?.mediaType || item?.media_type || item?.type || '')
    .trim()
    .toUpperCase();
};

const isVideoWallpaper = (item: Wallpaper & Record<string, any>) => {
  const mediaType = getWallpaperMediaType(item);

  if (mediaType === 'IMAGE') return false;
  if (mediaType === 'VIDEO') return true;
  if (item?.isVideo === true || item?.is_video === true) return true;

  return (
    isRealVideoUrlValue(item?.videoUrl) ||
    isRealVideoUrlValue(item?.video_url) ||
    isRealVideoUrlValue(item?.videoPath) ||
    isRealVideoUrlValue(item?.video_path) ||
    isRealVideoUrlValue(item?.downloadUrl) ||
    isRealVideoUrlValue(item?.download_url) ||
    isRealVideoUrlValue(item?.url)
  );
};

const getWallpaperPreviewImage = (wallpaper: Wallpaper) => {
  const w = wallpaper as Wallpaper & Record<string, any>;

  if (isVideoWallpaper(w)) {
    return (
      w.videoThumbnailUrl ||
      w.video_thumbnail_url ||
      w.videoPreviewUrl ||
      w.video_preview_url ||
      w.thumbnailUrl ||
      w.imageUrl
    );
  }

  return w.thumbnailUrl || w.imageUrl;
};

const ResultTile = ({ wallpaper }: { wallpaper: Wallpaper }) => {
  const [fav, setFav] = useState(wallpaper.isFavorite ?? false);

  const { isLoggedIn } = useAuth();
  const onToggleFavorite = async () => {
    if (!isLoggedIn) {
      return;
    }

    const next = !fav;
    setFav(next);

    try {
      await toggleFavorite(wallpaper.id);
    } catch (err) {
      console.log(err);
      setFav(!next);
    }
  };

  return (
    <ImageBackground
      source={{
        uri: getWallpaperPreviewImage(wallpaper),
      }}
      style={styles.tile}
      imageStyle={{ borderRadius: radius.md }}
    >
      <Pressable style={styles.heart} hitSlop={6} onPress={onToggleFavorite}>
        <Ionicons
          name={fav ? 'heart' : 'heart-outline'}
          size={16}
          color={fav ? colors.heart : colors.textPrimary}
        />
      </Pressable>

      <View style={[styles.quality, isVideoWallpaper(wallpaper as Wallpaper & Record<string, any>) && styles.videoQuality]}>
        {isVideoWallpaper(wallpaper as Wallpaper & Record<string, any>) ? (
          <Ionicons name="videocam" size={14} color={colors.textPrimary} />
        ) : (
          <Text style={styles.qualityText}>{wallpaper.quality}</Text>
        )}
      </View>
    </ImageBackground>
  );
};

const SearchScreen = (_: { navigation?: Nav }) => {
  const [query, setQuery] = useState('');

  const [results, setResults] = useState<Wallpaper[]>([]);

  const [popular, setPopular] = useState<Category[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCategories();

      setPopular(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const search = async () => {
    try {
      setLoading(true);

      const response = await searchWallpapers(query);

      setResults(response.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      search();
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <View style={styles.root}>
      <MeshBackground variant="category" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
        >
          <View style={styles.head}>
            <Text style={styles.title}>Search Wallpapers</Text>
            <Text style={styles.subtitle}>
              Find the perfect wallpaper for your device
            </Text>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search wallpapers"
                placeholderTextColor={colors.textTertiary}
                selectionColor={colors.accent}
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  hitSlop={8}
                  style={styles.clear}
                >
                  <Ionicons
                    name="close"
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.section}>Popular Searches</Text>
            <View style={styles.chips}>
              {popular.map(category => (
                <Pressable
                  key={category.id}
                  onPress={() => setQuery(category.name)}
                  style={({ pressed }) => [
                    styles.chip,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.chipText}>{category.name}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.resultsHead}>
              <Text style={styles.resultsTitle}>
                Search Results{' '}
                <Text style={styles.count}>({results.length})</Text>
              </Text>
              <Pressable style={styles.filters} hitSlop={6}>
                <Ionicons
                  name="options-outline"
                  size={16}
                  color={colors.accent}
                />
                <Text style={styles.filtersText}>Filters</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.grid}>
            {results.map(r => (
              <ResultTile key={r.id} wallpaper={r} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  head: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: { color: colors.textSecondary, fontSize: 15, marginTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 58,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 16 },
  clear: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFillStrong,
  },
  section: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  chipText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  resultsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  resultsTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  count: { color: colors.accent },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFillSoft,
  },
  filtersText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: spacing.xl,
  },
  tile: {
    width: TILE,
    height: TILE * 1.55,
    justifyContent: 'space-between',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  heart: {
    alignSelf: 'flex-end',
    margin: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  quality: {
    alignSelf: 'flex-start',
    margin: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoQuality: {
    alignSelf: 'flex-end',
    width: 30,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  qualityText: { color: colors.textPrimary, fontSize: 11, fontWeight: '800' },
});
