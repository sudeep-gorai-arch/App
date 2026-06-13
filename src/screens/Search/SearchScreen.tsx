import React, { useMemo, useState } from 'react';
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

type Nav = { goBack?: () => void };

/** picsum seeds render instantly; swap for images.unsplash.com when wiring real data. */
const img = (seed: string) => `https://picsum.photos/seed/${seed}/500/800`;

const POPULAR = ['Nature', 'Anime', 'Dark', 'Abstract', 'Cars', 'Space'];

const RESULTS = Array.from({ length: 12 }).map((_, i) => ({
  id: `r${i}`,
  image: img(`search-night-${i}`),
  quality: i % 4 === 0 ? '8K' : '4K',
  liked: i === 2,
}));

const COLS = 3;
const GAP = spacing.md;
const TILE = (SCREEN.width - spacing.xl * 2 - GAP * (COLS - 1)) / COLS;

const ResultTile = ({
  image,
  quality,
  liked,
}: {
  image: string;
  quality: string;
  liked: boolean;
}) => {
  const [fav, setFav] = useState(liked);
  return (
    <ImageBackground
      source={{ uri: image }}
      style={styles.tile}
      imageStyle={{ borderRadius: radius.md }}
    >
      <Pressable style={styles.heart} hitSlop={6} onPress={() => setFav(f => !f)}>
        <Ionicons
          name={fav ? 'heart' : 'heart-outline'}
          size={16}
          color={fav ? colors.heart : colors.textPrimary}
        />
      </Pressable>
      <View style={styles.quality}>
        <Text style={styles.qualityText}>{quality}</Text>
      </View>
    </ImageBackground>
  );
};

const SearchScreen = (_: { navigation?: Nav }) => {
  const [query, setQuery] = useState('night city');

  const results = useMemo(() => RESULTS, []);

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
            <Text style={styles.subtitle}>Find the perfect wallpaper for your device</Text>

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
                <Pressable onPress={() => setQuery('')} hitSlop={8} style={styles.clear}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.section}>Popular Searches</Text>
            <View style={styles.chips}>
              {POPULAR.map(c => (
                <Pressable
                  key={c}
                  onPress={() => setQuery(c)}
                  style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.chipText}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.resultsHead}>
              <Text style={styles.resultsTitle}>
                Search Results <Text style={styles.count}>({results.length * 10 + 8})</Text>
              </Text>
              <Pressable style={styles.filters} hitSlop={6}>
                <Ionicons name="options-outline" size={16} color={colors.accent} />
                <Text style={styles.filtersText}>Filters</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.grid}>
            {results.map(r => (
              <ResultTile key={r.id} image={r.image} quality={r.quality} liked={r.liked} />
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
  title: { color: colors.textPrimary, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
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
  },
  qualityText: { color: colors.textPrimary, fontSize: 11, fontWeight: '800' },
});
