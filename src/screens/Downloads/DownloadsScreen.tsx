import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import { RoundButton } from '../../components/Header';
import { colors, gradients } from '../../styles/colors';
import { spacing, radius, SCREEN } from '../../utils/constants';

type Nav = { goBack?: () => void };

const img = (seed: string) => `https://picsum.photos/seed/${seed}/500/800`;

const ITEMS = [
  { id: 'd1', q: '8K', seed: 'dl-tiger' },
  { id: 'd2', q: '8K', seed: 'dl-mountain' },
  { id: 'd3', q: '4K', seed: 'dl-citynight' },
  { id: 'd4', q: '4K', seed: 'dl-wolf' },
  { id: 'd5', q: '8K', seed: 'dl-astronaut' },
  { id: 'd6', q: '4K', seed: 'dl-pagoda' },
  { id: 'd7', q: '4K', seed: 'dl-car' },
  { id: 'd8', q: '8K', seed: 'dl-turtle' },
  { id: 'd9', q: '4K', seed: 'dl-lion' },
];

const COLS = 3;
const GAP = spacing.md;
const TILE = (SCREEN.width - spacing.xl * 2 - GAP * (COLS - 1)) / COLS;

const DownloadsScreen = ({ navigation }: { navigation?: Nav }) => {
  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <RoundButton icon="chevron-back" onPress={() => navigation?.goBack?.()} />
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Downloads</Text>
              <Text style={styles.headerSub}>Your downloaded wallpapers</Text>
            </View>
            <View style={styles.headerRight}>
              <RoundButton icon="search" />
              <RoundButton icon="ellipsis-horizontal" />
            </View>
          </View>

          {/* Storage summary */}
          <Card style={styles.summary} padding={spacing.lg} strong>
            <View style={styles.summaryRow}>
              <LinearGradient colors={gradients.blueViolet} style={styles.summaryIcon}>
                <Ionicons name="download-outline" size={24} color={colors.textPrimary} />
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: spacing.lg }}>
                <Text style={styles.summaryTitle}>128 Items</Text>
                <Text style={styles.summarySub}>45.2 GB Used</Text>
              </View>
              <Pressable hitSlop={8}>
                <Text style={styles.edit}>Edit</Text>
              </Pressable>
            </View>
          </Card>

          {/* Sort + filter */}
          <View style={styles.controls}>
            <View style={styles.sortWrap}>
              <Text style={styles.sortLabel}>Sort by</Text>
              <Pressable style={styles.sortPill} hitSlop={6}>
                <Text style={styles.sortValue}>Newest First</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Pressable style={styles.filter} hitSlop={6}>
              <Ionicons name="funnel-outline" size={16} color={colors.accent} />
              <Text style={styles.filterText}>Filter</Text>
            </Pressable>
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {ITEMS.map(it => (
              <ImageBackground
                key={it.id}
                source={{ uri: img(it.seed) }}
                style={styles.tile}
                imageStyle={{ borderRadius: radius.md }}
              >
                <Pressable style={styles.menu} hitSlop={6}>
                  <Ionicons name="ellipsis-horizontal" size={16} color={colors.textPrimary} />
                </Pressable>
                <View style={styles.quality}>
                  <Text style={styles.qualityText}>{it.q}</Text>
                </View>
              </ImageBackground>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default DownloadsScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  summary: { marginHorizontal: spacing.xl, marginTop: spacing.xl },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  summarySub: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  edit: { color: colors.accentBlue, fontSize: 15, fontWeight: '700' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  sortWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sortLabel: { color: colors.textSecondary, fontSize: 14 },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFillSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  sortValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.chipViolet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  filterText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: spacing.xl },
  tile: {
    width: TILE,
    height: TILE * 1.55,
    justifyContent: 'space-between',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },
  menu: {
    alignSelf: 'flex-end',
    margin: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  quality: {
    alignSelf: 'flex-start',
    margin: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  qualityText: { color: colors.textPrimary, fontSize: 11, fontWeight: '800' },
});
