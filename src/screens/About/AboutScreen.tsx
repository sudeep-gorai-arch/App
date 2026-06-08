import React from 'react';

import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { RoundButton } from '../../components/Header';

import { colors, gradients } from '../../styles/colors';

import { spacing, radius } from '../../utils/constants';

type Nav = {
  goBack: () => void;
};

const ABOUT_DATA = {
  appName: 'VividWalls',

  tagline: 'Premium 4K Wallpapers',

  version: '1.0.0',

  versionStatus: 'Latest',

  copyright: '© 2026 VividWalls. All rights reserved.',

  rows: [
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy terms',
      icon: 'shield-checkmark-outline',
    },

    {
      id: 'rate',
      title: 'Rate App',
      subtitle: 'Support us with your rating',
      icon: 'star-outline',
    },

    {
      id: 'share',
      title: 'Share App',
      subtitle: 'Tell your friends',
      icon: 'share-social-outline',
    },

    {
      id: 'contact',
      title: 'Contact',
      subtitle: 'Get support',
      icon: 'mail-outline',
    },
  ],
};

type Row = (typeof ABOUT_DATA.rows)[number];

const InfoRow = ({ row, last }: { row: Row; last: boolean }) => {
  return (
    <Pressable>
      <View style={styles.row}>
        <LinearGradient colors={gradients.blueViolet} style={styles.rowIcon}>
          <Ionicons
            name={row.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={colors.textPrimary}
          />
        </LinearGradient>

        <View
          style={{
            flex: 1,
            marginLeft: spacing.md,
          }}
        >
          <Text style={styles.rowTitle}>{row.title}</Text>

          <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </View>

      {!last && <View style={styles.divider} />}
    </Pressable>
  );
};

const AboutScreen = ({ navigation }: { navigation: Nav }) => {
  return (
    <View style={styles.root}>
      <MeshBackground variant="about" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 130,
          }}
        >
          <View style={styles.topBar}>
            <RoundButton
              icon="chevron-back"
              onPress={() => navigation.goBack()}
            />

            <RoundButton icon="ellipsis-horizontal" />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>About</Text>

            <Text style={styles.subtitle}>
              Learn more about {ABOUT_DATA.appName}
            </Text>
          </View>

          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['#6D5BF0', '#C84BD6', '#4F8DF0']}
              style={styles.appIcon}
            >
              <Ionicons name="image" size={60} color="white" />
            </LinearGradient>
          </View>

          <Text style={styles.appName}>{ABOUT_DATA.appName}</Text>

          <Text style={styles.tagline}>{ABOUT_DATA.tagline}</Text>

          <Card
            style={{
              marginHorizontal: spacing.xl,
              marginTop: spacing.xxl,
            }}
            padding={spacing.lg}
            strong
          >
            <View style={styles.row}>
              <LinearGradient
                colors={gradients.blueViolet}
                style={styles.rowIcon}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.textPrimary}
                />
              </LinearGradient>

              <View
                style={{
                  flex: 1,
                  marginLeft: spacing.md,
                }}
              >
                <Text style={styles.rowTitle}>Version</Text>

                <Text style={styles.rowSubtitle}>{ABOUT_DATA.version}</Text>
              </View>

              <LinearGradient
                colors={gradients.violetMagenta}
                style={styles.versionPill}
              >
                <Text style={styles.versionPillText}>
                  {ABOUT_DATA.versionStatus}
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.divider} />

            {ABOUT_DATA.rows.map((row, index) => (
              <InfoRow
                key={row.id}
                row={row}
                last={index === ABOUT_DATA.rows.length - 1}
              />
            ))}
          </Card>

          <View
            style={{
              alignItems: 'center',
              marginTop: spacing.xxl,
            }}
          >
            <Button
              label="Made with passion"
              icon="heart"
              iconColor={colors.heart}
            />
          </View>

          <Text style={styles.copyright}>{ABOUT_DATA.copyright}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  headerText: { paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  title: {
    color: colors.textPrimary,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: { color: colors.textSecondary, fontSize: 16, marginTop: 4 },

  iconWrap: { alignItems: 'center', marginTop: spacing.xxxl },
  appIcon: {
    width: 132,
    height: 132,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: colors.accentStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 14,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  rowSubtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },

  versionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  versionPillText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },

  copyright: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
