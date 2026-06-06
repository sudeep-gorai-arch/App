import React, { useState } from 'react';
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
import { colors, gradients } from '../../styles/colors';
import {
  spacing,
  radius,
  SCREEN,
  CATEGORIES,
  CATEGORY_FILTERS,
} from '../../utils/constants';

const GAP = spacing.lg;
const CARD_W = (SCREEN.width - spacing.xl * 2 - GAP) / 2;
const CARD_H = 150;

type Cat = (typeof CATEGORIES)[number];

const CategoryCard = ({ item }: { item: Cat }) => (
  <Pressable style={styles.card}>
    <ImageBackground
      source={{ uri: item.image }}
      style={styles.cardImage}
      imageStyle={{ borderRadius: radius.lg }}
    >
      <LinearGradient
        colors={['rgba(8,6,20,0.15)', 'rgba(8,6,20,0.78)']}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
      />

      {/* icon chip */}
      <BlurView intensity={26} tint="dark" style={styles.iconChip}>
        <Ionicons
          name={item.icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={colors.textPrimary}
        />
      </BlurView>

      {/* label */}
      <View style={styles.cardLabel}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCount}>{item.count}</Text>
      </View>

      {/* chevron chip */}
      <BlurView intensity={26} tint="dark" style={styles.chevronChip}>
        <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
      </BlurView>
    </ImageBackground>
  </Pressable>
);

const CategoryScreen = () => {
  const [filter, setFilter] = useState(CATEGORY_FILTERS[0]);

  return (
    <View style={styles.root}>
      <MeshBackground variant="category" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={CATEGORIES}
          keyExtractor={(i) => i.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ paddingHorizontal: spacing.xl, gap: GAP }}
          contentContainerStyle={{ paddingBottom: 130, gap: GAP }}
          ListHeaderComponent={
            <View>
              <Header
                title="Categories"
                subtitle="Explore wallpapers by your favorite themes"
                rightAction={{ icon: 'search' }}
                style={{ paddingTop: spacing.md }}
              />

              {/* Filter pills */}
              <BlurView intensity={30} tint="dark" style={styles.filterBar}>
                {CATEGORY_FILTERS.map((f) => {
                  const isActive = f === filter;
                  return (
                    <Pressable
                      key={f}
                      style={styles.filterItem}
                      onPress={() => setFilter(f)}
                    >
                      {isActive ? (
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
          renderItem={({ item }) => <CategoryCard item={item} />}
        />
      </SafeAreaView>
    </View>
  );
};

export default CategoryScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },

  filterBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
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
  filterText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600', paddingVertical: 10 },
  filterTextActive: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  cardImage: { flex: 1 },
  iconChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  cardLabel: { position: 'absolute', left: 14, bottom: 14 },
  cardName: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  cardCount: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 2 },
  chevronChip: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
