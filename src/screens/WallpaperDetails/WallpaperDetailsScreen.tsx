import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../../styles/colors';
import { fontFamily } from '../../styles/typography';
import { spacing, radius } from '../../utils/constants';
import { RootStackParamList } from '../../navigation/RootStackParamList';

import API from '../../services/api';
import { downloadWallpaper } from '../../utils/downloadHelper';
import { addDownload, addPublicDownload } from '../../services/downloadService';
import { addFavorite } from '../../services/favoriteService';

type Props = NativeStackScreenProps<RootStackParamList, 'WallpaperDetails'>;

type Status = 'idle' | 'downloading' | 'done';

const DOWNLOAD_GRADIENT = ['#3B82F6', '#8B5CF6', '#EC4899'] as const;
const POPUP_GRADIENT = ['#3B82F6', '#8B5CF6', '#EC4899'] as const;

const API_ORIGIN = String(API.defaults.baseURL || '').replace(/\/api\/?$/, '');

const toAbsoluteMediaUrl = (value?: string | null) => {
  if (!value) return undefined;

  const url = String(value).trim();
  if (!url) return undefined;

  if (/^https?:\/\//i.test(url)) {
    if (!API_ORIGIN) return url;

    return url.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
      API_ORIGIN,
    );
  }

  if (url.startsWith('//')) return `https:${url}`;

  if (url.startsWith('/')) {
    return API_ORIGIN ? `${API_ORIGIN}${url}` : url;
  }

  return API_ORIGIN ? `${API_ORIGIN}/${url}` : url;
};

const getWallpaperId = (wallpaper: any) =>
  String(
    wallpaper?.id ||
      wallpaper?._id ||
      wallpaper?.wallpaperId ||
      wallpaper?.wallpaper_id ||
      '',
  );

const getWallpaperImage = (wallpaper: any): string => {
  const image =
    wallpaper?.imageUrl ||
    wallpaper?.thumbnailUrl ||
    wallpaper?.image_url ||
    wallpaper?.thumbnail_url ||
    wallpaper?.url ||
    wallpaper?.image ||
    wallpaper?.thumbnail ||
    wallpaper?.photoUrl ||
    wallpaper?.photo_url ||
    wallpaper?.mediaUrl ||
    wallpaper?.media_url;

  return (
    toAbsoluteMediaUrl(image) ||
    'https://picsum.photos/seed/flexiwalls-details-fallback/900/1600'
  );
};

const getDownloadUrlFromResponse = (
  response: any,
  fallbackUrl: string,
): string => {
  const data = response?.data?.data ?? response?.data;

  return (
    toAbsoluteMediaUrl(data?.downloadUrl) ||
    toAbsoluteMediaUrl(data?.url) ||
    toAbsoluteMediaUrl(data?.imageUrl) ||
    fallbackUrl
  );
};

const formatCount = (value?: number | string) => {
  const count = Number(value ?? 0);

  if (Number.isNaN(count)) return '0';

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace('.0', '')}M`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace('.0', '')}K`;
  }

  return String(count);
};

const getCategoryName = (wallpaper: any) => {
  if (wallpaper?.category?.name) return wallpaper.category.name;
  if (wallpaper?.categoryName) return wallpaper.categoryName;
  if (wallpaper?.category_name) return wallpaper.category_name;
  if (typeof wallpaper?.category === 'string') return wallpaper.category;

  return 'Wallpaper';
};

const getDownloads = (wallpaper: any) =>
  wallpaper?.downloads ??
  wallpaper?.downloadCount ??
  wallpaper?.download_count ??
  wallpaper?.downloadsThisWeek ??
  wallpaper?.weeklyDownloads ??
  0;

const getDimensions = (wallpaper: any) => {
  if (wallpaper?.dimensions) return String(wallpaper.dimensions);

  const width =
    wallpaper?.width ||
    wallpaper?.imageWidth ||
    wallpaper?.image_width ||
    wallpaper?.meta?.width;

  const height =
    wallpaper?.height ||
    wallpaper?.imageHeight ||
    wallpaper?.image_height ||
    wallpaper?.meta?.height;

  if (width && height) return `${width} × ${height}`;

  return '4K Ultra HD';
};

const isPlaceholder = (wallpaperId: string) =>
  !wallpaperId ||
  wallpaperId.includes('placeholder') ||
  wallpaperId.startsWith('ph-');

const InfoPill = ({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) => {
  return (
    <BlurView intensity={30} tint="dark" style={styles.infoPill}>
      <Ionicons name={icon} size={15} color={colors.textPrimary} />

      <Text style={styles.infoPillText} numberOfLines={1}>
        {text}
      </Text>
    </BlurView>
  );
};

const WallpaperDetailsScreen = ({ navigation, route }: Props) => {
  const wallpaper: any = route.params?.wallpaper ?? {};
  const wallpaperId = getWallpaperId(wallpaper);

  const image = getWallpaperImage(wallpaper);

  const [status, setStatus] = useState<Status>('idle');
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenMenuVisible, setFullscreenMenuVisible] = useState(false);
  const [savedPopupVisible, setSavedPopupVisible] = useState(false);

  const finalImage = imageFailed
    ? 'https://picsum.photos/seed/flexiwalls-details-error/900/1600'
    : image;

  const closeSavedPopup = () => {
    setSavedPopupVisible(false);
    setStatus('idle');
  };

  const closeFullscreen = () => {
    setFullscreenMenuVisible(false);
    setFullscreenVisible(false);
  };

  const onDownload = async () => {
    if (status === 'downloading') return;

    setStatus('downloading');

    try {
      const token = await AsyncStorage.getItem('token');

      let downloadUrl: string = finalImage;

      if (!isPlaceholder(wallpaperId)) {
        try {
          const response = token
            ? await addDownload(wallpaperId)
            : await addPublicDownload(wallpaperId);

          downloadUrl = getDownloadUrlFromResponse(response, finalImage);
        } catch (error: any) {
          console.log('addDownload skipped:', error?.response?.data || error);

          if (error?.response?.status === 401) {
            await AsyncStorage.removeItem('token');
          }

          downloadUrl = finalImage;
        }
      }

      const ok = await downloadWallpaper(
        downloadUrl,
        wallpaper?.title || wallpaperId || 'FlexiWalls Wallpaper',
      );

      if (!ok) {
        setStatus('idle');
        return;
      }

      setStatus('done');
      setSavedPopupVisible(true);
    } catch (error: any) {
      console.log('Download failed:', error?.response?.data || error);

      setStatus('idle');
      Alert.alert('Download failed', 'Something went wrong while downloading.');
    }
  };

  const onAddFavorite = async () => {
    if (favoriteLoading) return;

    if (isPlaceholder(wallpaperId)) {
      Alert.alert(
        'Unavailable',
        'This placeholder wallpaper cannot be added to favorites.',
      );
      return;
    }

    try {
      setFavoriteLoading(true);

      await addFavorite(wallpaperId);

      setIsFavorite(true);
      Alert.alert('Added', 'Wallpaper added to favorites.');
    } catch (error: any) {
      console.log('Add favorite failed:', error?.response?.data || error);

      if (error?.response?.status === 401) {
        Alert.alert(
          'Login required',
          'Please login to add wallpapers to favorites.',
        );
        return;
      }

      Alert.alert('Failed', 'Could not add this wallpaper to favorites.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const onFullscreenDownload = () => {
    setFullscreenMenuVisible(false);
    onDownload();
  };

  const onFullscreenFavorite = () => {
    setFullscreenMenuVisible(false);
    onAddFavorite();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ImageBackground
          source={{ uri: finalImage }}
          style={styles.wallpaperPreview}
          imageStyle={styles.wallpaperImage}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        >
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.24)',
              'rgba(0,0,0,0.02)',
              'rgba(0,0,0,0.16)',
            ]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={({ pressed }) => [
                styles.topIconButtonWrap,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <BlurView intensity={30} tint="dark" style={styles.topIconButton}>
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={colors.textPrimary}
                />
              </BlurView>
            </Pressable>

            <Pressable
              onPress={() => setFullscreenVisible(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.topIconButtonWrap,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <BlurView intensity={30} tint="dark" style={styles.topIconButton}>
                <Ionicons
                  name="expand-outline"
                  size={22}
                  color={colors.textPrimary}
                />
              </BlurView>
            </Pressable>
          </View>
        </ImageBackground>

        <View style={styles.detailsSection}>
          <BlurView intensity={52} tint="dark" style={styles.detailsPanel}>
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.15)',
                'rgba(255,255,255,0.055)',
                'rgba(0,0,0,0.40)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <LinearGradient
              colors={[
                'rgba(96,165,250,0.16)',
                'rgba(168,85,247,0.10)',
                'rgba(236,72,153,0.08)',
                'rgba(0,0,0,0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <Text style={styles.title} numberOfLines={2}>
              {wallpaper?.title || 'FlexiWalls Wallpaper'}
            </Text>

            <View style={styles.infoRow}>
              <InfoPill icon="image-outline" text={getCategoryName(wallpaper)} />

              <InfoPill icon="crop-outline" text={getDimensions(wallpaper)} />

              <InfoPill
                icon="download-outline"
                text={formatCount(getDownloads(wallpaper))}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.actionRow}>
              <Pressable
                onPress={onDownload}
                disabled={status === 'downloading'}
                style={({ pressed }) => [
                  styles.downloadButtonWrap,
                  {
                    opacity: status === 'downloading' ? 0.85 : 1,
                    transform: [
                      {
                        scale: pressed && status !== 'downloading' ? 0.98 : 1,
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={DOWNLOAD_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.downloadButton}
                >
                  {status === 'downloading' ? (
                    <>
                      <ActivityIndicator color={colors.textPrimary} />
                      <Text style={styles.downloadText}>Downloading...</Text>
                    </>
                  ) : status === 'done' ? (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={26}
                        color={colors.textPrimary}
                      />
                      <Text style={styles.downloadText}>Saved</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="download-outline"
                        size={27}
                        color={colors.textPrimary}
                      />
                      <Text style={styles.downloadText}>Download</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={onAddFavorite}
                disabled={favoriteLoading}
                style={({ pressed }) => [
                  styles.favoriteIconButtonWrap,
                  {
                    opacity: favoriteLoading ? 0.75 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <BlurView
                  intensity={24}
                  tint="dark"
                  style={styles.favoriteIconButton}
                >
                  {favoriteLoading ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <Ionicons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={30}
                      color={isFavorite ? colors.heart : colors.textPrimary}
                    />
                  )}
                </BlurView>
              </Pressable>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>

      <Modal
        visible={fullscreenVisible}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={closeFullscreen}
      >
        <View style={styles.fullscreenRoot}>
          <ImageBackground
            source={{ uri: finalImage }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          >
            <LinearGradient
              colors={[
                'rgba(0,0,0,0.34)',
                'rgba(0,0,0,0)',
                'rgba(0,0,0,0.38)',
              ]}
              style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.fullscreenSafeArea} edges={['top']}>
              <View style={styles.fullscreenTopBar}>
                <Pressable
                  onPress={closeFullscreen}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.topIconButtonWrap,
                    { opacity: pressed ? 0.65 : 1 },
                  ]}
                >
                  <BlurView
                    intensity={30}
                    tint="dark"
                    style={styles.topIconButton}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={colors.textPrimary}
                    />
                  </BlurView>
                </Pressable>

                <View style={styles.fullscreenMenuWrap}>
                  <Pressable
                    onPress={() =>
                      setFullscreenMenuVisible(current => !current)
                    }
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.topIconButtonWrap,
                      { opacity: pressed ? 0.65 : 1 },
                    ]}
                  >
                    <BlurView
                      intensity={30}
                      tint="dark"
                      style={styles.topIconButton}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={22}
                        color={colors.textPrimary}
                      />
                    </BlurView>
                  </Pressable>

                  {fullscreenMenuVisible ? (
                    <BlurView
                      intensity={42}
                      tint="dark"
                      style={styles.fullscreenDropdown}
                    >
                      <LinearGradient
                        colors={[
                          'rgba(255,255,255,0.16)',
                          'rgba(255,255,255,0.06)',
                          'rgba(0,0,0,0.30)',
                        ]}
                        style={StyleSheet.absoluteFill}
                      />

                      <Pressable
                        onPress={onFullscreenDownload}
                        disabled={status === 'downloading'}
                        style={({ pressed }) => [
                          styles.dropdownItem,
                          {
                            opacity:
                              pressed || status === 'downloading' ? 0.65 : 1,
                          },
                        ]}
                      >
                        {status === 'downloading' ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.textPrimary}
                          />
                        ) : (
                          <Ionicons
                            name="download-outline"
                            size={20}
                            color={colors.textPrimary}
                          />
                        )}

                        <Text style={styles.dropdownText}>
                          {status === 'downloading'
                            ? 'Downloading'
                            : 'Download'}
                        </Text>
                      </Pressable>

                      <View style={styles.dropdownDivider} />

                      <Pressable
                        onPress={onFullscreenFavorite}
                        disabled={favoriteLoading}
                        style={({ pressed }) => [
                          styles.dropdownItem,
                          { opacity: pressed || favoriteLoading ? 0.65 : 1 },
                        ]}
                      >
                        {favoriteLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.textPrimary}
                          />
                        ) : (
                          <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={20}
                            color={
                              isFavorite ? colors.heart : colors.textPrimary
                            }
                          />
                        )}

                        <Text style={styles.dropdownText}>
                          {isFavorite ? 'Favorite' : 'Add to Favorite'}
                        </Text>
                      </Pressable>
                    </BlurView>
                  ) : null}
                </View>
              </View>
            </SafeAreaView>
          </ImageBackground>
        </View>
      </Modal>

      <Modal
        visible={savedPopupVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSavedPopup}
      >
        <View style={styles.savedOverlay}>
          <BlurView intensity={44} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.savedCardBorder}>
            <BlurView intensity={58} tint="dark" style={styles.savedCard}>
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.18)',
                  'rgba(255,255,255,0.08)',
                  'rgba(0,0,0,0.38)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <LinearGradient
                colors={[
                  'rgba(96,165,250,0.18)',
                  'rgba(168,85,247,0.14)',
                  'rgba(236,72,153,0.10)',
                  'rgba(0,0,0,0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.savedIconGlow}>
                <LinearGradient
                  colors={[
                    'rgba(59,130,246,0.28)',
                    'rgba(139,92,246,0.22)',
                    'rgba(236,72,153,0.18)',
                  ]}
                  style={styles.savedIconCircle}
                >
                  <Ionicons
                    name="checkmark"
                    size={54}
                    color={colors.textPrimary}
                  />
                </LinearGradient>
              </View>

              <Text style={styles.savedTitle}>Saved</Text>

              <Text style={styles.savedSubtitle}>
                Wallpaper saved to your gallery
              </Text>

              <Pressable
                onPress={closeSavedPopup}
                style={({ pressed }) => [
                  styles.doneButtonWrap,
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={POPUP_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </LinearGradient>
              </Pressable>
            </BlurView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WallpaperDetailsScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.base,
  },

  wallpaperPreview: {
    flex: 1,
    backgroundColor: colors.baseElevated,
  },
  wallpaperImage: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  topBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topIconButtonWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  topIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },

  detailsSection: {
    backgroundColor: colors.base,
    paddingTop: spacing.md,
  },
  detailsPanel: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(5, 8, 18, 0.82)',
  },

  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },

  infoRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  infoPill: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  infoPillText: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: spacing.xl,
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  downloadButtonWrap: {
    flex: 1,
    borderRadius: 22,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 12,
  },
  downloadButton: {
    height: 62,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  downloadText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
  },

  favoriteIconButtonWrap: {
    width: 62,
    height: 62,
    borderRadius: 22,
    overflow: 'hidden',
  },
  favoriteIconButton: {
    width: 62,
    height: 62,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.3,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(5, 8, 18, 0.18)',
  },

  fullscreenRoot: {
    flex: 1,
    backgroundColor: colors.base,
  },
  fullscreenSafeArea: {
    flex: 1,
  },
  fullscreenTopBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  fullscreenMenuWrap: {
    position: 'relative',
    alignItems: 'flex-end',
  },
  fullscreenDropdown: {
    position: 'absolute',
    top: 56,
    right: 0,
    width: 190,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(5, 8, 18, 0.78)',
  },
  dropdownItem: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropdownText: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginHorizontal: spacing.md,
  },

  savedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  savedCardBorder: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 34,
    padding: 1.2,
    backgroundColor: 'rgba(168,85,247,0.55)',
  },
  savedCard: {
    borderRadius: 33,
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 42,
    paddingBottom: spacing.xl,
    backgroundColor: 'rgba(6, 8, 20, 0.78)',
  },
  savedIconGlow: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  savedIconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 42,
    lineHeight: 50,
    letterSpacing: -1,
    textAlign: 'center',
  },
  savedSubtitle: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  doneButtonWrap: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.xl,
  },
  doneButton: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  doneButtonText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
  },
});