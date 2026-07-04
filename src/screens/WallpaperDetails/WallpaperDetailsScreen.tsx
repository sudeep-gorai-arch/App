import React, { useEffect, useState } from 'react';
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
import * as SecureStore from 'expo-secure-store';

import { colors } from '../../styles/colors';
import { fontFamily } from '../../styles/typography';
import { spacing, radius } from '../../utils/constants';
import { RootStackParamList } from '../../navigation/RootStackParamList';

import API from '../../services/api';
import { downloadWallpaper } from '../../utils/downloadHelper';
import { addDownload } from '../../services/downloadService';
import {
  toggleFavorite,
  getFavoriteStatus,
} from '../../services/favoriteService';

import {
  getWallpaperById,
  incrementView,
} from '../../services/wallpaperService';
import {
  applyWallpaperToAndroid,
  WallpaperApplyTarget,
} from '../../services/applyWallpaperService';
import { appEvents } from '../../utils/appEvents';

import { useToast } from '../../components/ui/toast/useToast';

type Props = NativeStackScreenProps<RootStackParamList, 'WallpaperDetails'>;

type Status = 'idle' | 'downloading' | 'done';

const DOWNLOAD_GRADIENT = ['#3B82F6', '#8B5CF6', '#EC4899'] as const;
const APPLY_GRADIENT = ['#0EA5E9', '#14B8A6', '#22D3EE'] as const;
const POPUP_GRADIENT = ['#3B82F6', '#8B5CF6', '#EC4899'] as const;

const API_ORIGIN = String(API.defaults.baseURL || '').replace(/\/api\/?$/, '');
const LOCAL_DOWNLOADS_KEY = '@flexiwalls:guestDownloads';
const MAX_LOCAL_DOWNLOADS = 100;

const saveGuestDownloadHistory = async (
  wallpaper: any,
  wallpaperId: string,
  downloadedUrl: string,
) => {
  try {
    const id = String(
      wallpaperId ||
        wallpaper?.id ||
        wallpaper?._id ||
        wallpaper?.wallpaperId ||
        wallpaper?.wallpaper_id ||
        downloadedUrl,
    );

    const record = {
      ...wallpaper,
      id,
      imageUrl:
        wallpaper?.imageUrl ||
        wallpaper?.image_url ||
        wallpaper?.url ||
        wallpaper?.image ||
        wallpaper?.mediaUrl ||
        downloadedUrl,
      thumbnailUrl:
        wallpaper?.thumbnailUrl ||
        wallpaper?.thumbnail_url ||
        wallpaper?.thumbnail ||
        wallpaper?.photoUrl ||
        wallpaper?.photo_url ||
        downloadedUrl,
      downloadedAt: new Date().toISOString(),
    };

    const raw = await AsyncStorage.getItem(LOCAL_DOWNLOADS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const existing = Array.isArray(parsed) ? parsed : [];

    const withoutDuplicate = existing.filter((item: any) => {
      const existingId = String(
        item?.id || item?._id || item?.wallpaperId || item?.wallpaper_id || '',
      );

      return existingId !== id;
    });

    await AsyncStorage.setItem(
      LOCAL_DOWNLOADS_KEY,
      JSON.stringify(
        [record, ...withoutDuplicate].slice(0, MAX_LOCAL_DOWNLOADS),
      ),
    );
  } catch (error) {
    console.log('SAVE GUEST DOWNLOAD HISTORY ERROR', error);
  }
};

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

const unwrapApiData = (response: any) =>
  response?.data?.data ?? response?.data ?? response;

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? '').replace(/[^\d.]/g, ''));

  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCount = (value?: number | string) => {
  const count = toNumber(value);

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
  Math.max(
    toNumber(wallpaper?.downloads),
    toNumber(wallpaper?.downloadCount),
    toNumber(wallpaper?.download_count),
    toNumber(wallpaper?.downloadsThisWeek),
    toNumber(wallpaper?.weeklyDownloads),
    toNumber(wallpaper?._count?.downloads),
  );

const getFavoriteCountValue = (value: any) =>
  Math.max(
    toNumber(value?.favoriteCount),
    toNumber(value?.favorite_count),
    toNumber(value?.favoritesCount),
    toNumber(value?._count?.favorites),
    toNumber(value?.favorites),
  );

const hasFavoriteCountValue = (value: any) =>
  value?.favoriteCount !== undefined ||
  value?.favorite_count !== undefined ||
  value?.favoritesCount !== undefined ||
  value?._count?.favorites !== undefined ||
  value?.favorites !== undefined;

const getFavoriteCountFromPayload = (value: any, fallback: number) => {
  if (!hasFavoriteCountValue(value)) return fallback;

  return getFavoriteCountValue(value);
};

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

const ApplyButtonIcon = () => {
  return (
    <View style={styles.applyIconFrame}>
      <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
    </View>
  );
};

const WallpaperDetailsScreen = ({ navigation, route }: Props) => {
  const [wallpaper, setWallpaper] = useState<any>(
    route.params?.wallpaper ?? {},
  );
  const wallpaperId = getWallpaperId(wallpaper);

  const image = getWallpaperImage(wallpaper);

  const [status, setStatus] = useState<Status>('idle');
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(
    Boolean(wallpaper?.isFavorite || wallpaper?.is_favorite),
  );
  const [favoriteCount, setFavoriteCount] = useState(
    getFavoriteCountValue(wallpaper),
  );
  const [imageFailed, setImageFailed] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenMenuVisible, setFullscreenMenuVisible] = useState(false);
  const [savedPopupVisible, setSavedPopupVisible] = useState(false);
  const [appliedPopupVisible, setAppliedPopupVisible] = useState(false);

  const [applySheetVisible, setApplySheetVisible] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyTarget, setApplyTarget] = useState<WallpaperApplyTarget | null>(
    null,
  );

  const toast = useToast();

  const loadWallpaper = async () => {
    if (!wallpaperId || isPlaceholder(wallpaperId)) return;

    try {
      const detailsResponse = await getWallpaperById(wallpaperId);
      const details = unwrapApiData(detailsResponse);

      if (details) {
        setWallpaper((prev: any) => ({
          ...prev,
          ...details,
        }));

        if (hasFavoriteCountValue(details)) {
          setFavoriteCount(getFavoriteCountValue(details));
        }
      }
    } catch (error: any) {
      console.log('Wallpaper details failed:', error?.response?.data || error);
    }
  };

  const loadFavoriteStatus = async () => {
    if (!wallpaperId || isPlaceholder(wallpaperId)) return;

    try {
      const response = await getFavoriteStatus(wallpaperId);
      const data = unwrapApiData(response);

      setIsFavorite(Boolean(data?.isFavorite ?? data?.favorite));
      setFavoriteCount(getFavoriteCountValue(data));
    } catch (error: any) {
      console.log('Favorite status failed:', error?.response?.data || error);

      if (error?.response?.status === 401) {
        setIsFavorite(false);
      }
    }
  };

  const recordWallpaperView = async () => {
    if (!wallpaperId || isPlaceholder(wallpaperId)) return;

    try {
      await incrementView(wallpaperId);
    } catch (error: any) {
      console.log('Increment view failed:', error?.response?.data || error);
    }
  };

  useEffect(() => {
    if (!wallpaperId) return;

    const unsubscribeFavorite = appEvents.on('favoritesChanged', payload => {
      if (String(payload.wallpaperId) !== wallpaperId) return;

      setIsFavorite(Boolean(payload.isFavorite));

      if (payload.favoriteCount !== undefined) {
        setFavoriteCount(toNumber(payload.favoriteCount));
      }

      setWallpaper((prev: any) => ({
        ...prev,
        ...(payload.wallpaper || {}),
        isFavorite: Boolean(payload.isFavorite),
        is_favorite: Boolean(payload.isFavorite),
        favoriteCount:
          payload.favoriteCount !== undefined
            ? toNumber(payload.favoriteCount)
            : prev?.favoriteCount,
        favoritesCount:
          payload.favoriteCount !== undefined
            ? toNumber(payload.favoriteCount)
            : prev?.favoritesCount,
      }));
    });

    const unsubscribeDownload = appEvents.on('downloadsChanged', payload => {
      if (String(payload.wallpaperId) !== wallpaperId) return;

      if (payload.downloadCount === undefined) return;

      const nextDownloadCount = toNumber(payload.downloadCount);

      setWallpaper((prev: any) => ({
        ...prev,
        ...(payload.wallpaper || {}),
        downloadCount: nextDownloadCount,
        download_count: nextDownloadCount,
        downloads: nextDownloadCount,
      }));
    });

    return () => {
      unsubscribeFavorite();
      unsubscribeDownload();
    };
  }, [wallpaperId]);

  useEffect(() => {
    if (!wallpaperId) return;

    loadWallpaper();
    loadFavoriteStatus();
    recordWallpaperView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallpaperId]);

  const finalImage = imageFailed
    ? 'https://picsum.photos/seed/flexiwalls-details-error/900/1600'
    : image;

  const closeSavedPopup = () => {
    setSavedPopupVisible(false);
    setStatus('idle');
  };

  const closeAppliedPopup = () => {
    setAppliedPopupVisible(false);
  };

  const closeFullscreen = () => {
    setFullscreenMenuVisible(false);
    setFullscreenVisible(false);
  };

  const onDownload = async () => {
    if (status === 'downloading') return;

    setStatus('downloading');

    try {
      const token = await SecureStore.getItemAsync('token');

      const loggedIn = !!token;

      const shouldSaveLocalDownload = !loggedIn;

      let downloadUrl = finalImage;

      /*
    ----------------------------------------
    RECORD DOWNLOAD
    ----------------------------------------
    */

      if (!isPlaceholder(wallpaperId)) {
        try {
          const response = await addDownload(wallpaperId, loggedIn);

          downloadUrl = getDownloadUrlFromResponse(response, finalImage);
        } catch (error: any) {
          console.log(
            'Download record failed:',
            error?.response?.data || error,
          );

          if (error?.response?.status === 401) {
            await SecureStore.deleteItemAsync('token');

            toast.info('Please sign in to continue downloading wallpapers.');

            setStatus('idle');

            navigation.navigate('MainTabs', {
              screen: 'Profile',
            });

            return;
          }

          if (error?.response?.status === 403) {
            const message = error?.response?.data?.message ?? '';

            if (message.includes('Daily free download limit')) {
              toast.warning(
                'Daily limit reached! Upgrade to Premium for unlimited downloads.',
              );

              setStatus('idle');

              setTimeout(() => {
                navigation.navigate('ManagePremium');
              }, 1200);

              return;
            }

            if (
              message.includes('Premium subscription required') ||
              message.includes('premium wallpapers')
            ) {
              toast.warning(
                'This is a Premium wallpaper. Upgrade to unlock it.',
              );

              setStatus('idle');

              setTimeout(() => {
                navigation.navigate('ManagePremium');
              }, 1200);

              return;
            }

            toast.warning(message || 'Download not allowed.');

            setStatus('idle');

            return;
          }

          if (error?.message === 'Network Error' || !error?.response) {
            toast.error('No internet connection. Please try again.');

            setStatus('idle');

            return;
          }

          toast.error(
            error?.response?.data?.message ||
              'Something went wrong while downloading.',
          );

          setStatus('idle');

          return;
        }
      }

      /*
    ----------------------------------------
    DOWNLOAD IMAGE
    ----------------------------------------
    */

      const ok = await downloadWallpaper(
        downloadUrl,
        wallpaper?.title || wallpaperId || 'FlexiWalls Wallpaper',
      );

      if (!ok) {
        setStatus('idle');
        return;
      }

      /*
    ----------------------------------------
    UPDATE UI
    ----------------------------------------
    */

      const nextDownloadCount = getDownloads(wallpaper) + 1;

      const downloadedAt = new Date().toISOString();

      const updatedWallpaper = {
        ...wallpaper,

        downloadCount: nextDownloadCount,

        download_count: nextDownloadCount,

        downloads: nextDownloadCount,

        downloadedAt,
      };

      setWallpaper(updatedWallpaper);

      /*
    ----------------------------------------
    SAVE GUEST HISTORY
    ----------------------------------------
    */

      if (shouldSaveLocalDownload) {
        await saveGuestDownloadHistory(
          updatedWallpaper,
          wallpaperId,
          downloadUrl,
        );
      }

      /*
    ----------------------------------------
    NOTIFY APP
    ----------------------------------------
    */

      if (wallpaperId && !isPlaceholder(wallpaperId)) {
        appEvents.emit('downloadsChanged', {
          wallpaperId,
          downloadCount: nextDownloadCount,
          wallpaper: updatedWallpaper,
        });
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

    const previousIsFavorite = isFavorite;
    const previousFavoriteCount = favoriteCount;
    const nextOptimisticFavorite = !previousIsFavorite;
    const nextOptimisticCount = Math.max(
      0,
      previousFavoriteCount + (nextOptimisticFavorite ? 1 : -1),
    );

    const optimisticWallpaper = {
      ...wallpaper,
      isFavorite: nextOptimisticFavorite,
      is_favorite: nextOptimisticFavorite,
      favoriteCount: nextOptimisticCount,
      favorite_count: nextOptimisticCount,
      favoritesCount: nextOptimisticCount,
    };

    try {
      setFavoriteLoading(true);
      setIsFavorite(nextOptimisticFavorite);
      setFavoriteCount(nextOptimisticCount);
      setWallpaper(optimisticWallpaper);

      appEvents.emit('favoritesChanged', {
        wallpaperId,
        isFavorite: nextOptimisticFavorite,
        favoriteCount: nextOptimisticCount,
        wallpaper: optimisticWallpaper,
      });

      const response = await toggleFavorite(wallpaperId);
      const data = unwrapApiData(response);

      const nextIsFavorite = Boolean(
        data?.isFavorite ?? data?.favorite ?? nextOptimisticFavorite,
      );
      const nextFavoriteCount = getFavoriteCountFromPayload(
        data,
        nextOptimisticCount,
      );

      const confirmedWallpaper = {
        ...optimisticWallpaper,
        isFavorite: nextIsFavorite,
        is_favorite: nextIsFavorite,
        favoriteCount: nextFavoriteCount,
        favorite_count: nextFavoriteCount,
        favoritesCount: nextFavoriteCount,
      };

      setIsFavorite(nextIsFavorite);
      setFavoriteCount(nextFavoriteCount);
      setWallpaper(confirmedWallpaper);

      appEvents.emit('favoritesChanged', {
        wallpaperId,
        isFavorite: nextIsFavorite,
        favoriteCount: nextFavoriteCount,
        wallpaper: confirmedWallpaper,
      });
    } catch (error: any) {
      console.log('Favorite toggle failed:', error?.response?.data || error);

      const rollbackWallpaper = {
        ...wallpaper,
        isFavorite: previousIsFavorite,
        is_favorite: previousIsFavorite,
        favoriteCount: previousFavoriteCount,
        favorite_count: previousFavoriteCount,
        favoritesCount: previousFavoriteCount,
      };

      setIsFavorite(previousIsFavorite);
      setFavoriteCount(previousFavoriteCount);
      setWallpaper(rollbackWallpaper);

      appEvents.emit('favoritesChanged', {
        wallpaperId,
        isFavorite: previousIsFavorite,
        favoriteCount: previousFavoriteCount,
        wallpaper: rollbackWallpaper,
      });

      if (error?.status === 401) {
        Alert.alert(
          'Login required',
          'Please login to add wallpapers to favorites.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('MainTabs', {
                  screen: 'Profile',
                });
              },
            },
          ],
          { cancelable: false },
        );

        return;
      }

      Alert.alert('Failed', 'Could not update this wallpaper favorite.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const onApplyWallpaper = async (target: WallpaperApplyTarget) => {
    if (applyLoading) return;

    try {
      setApplyLoading(true);
      setApplyTarget(target);

      await applyWallpaperToAndroid(finalImage, target);

      setApplySheetVisible(false);
      setAppliedPopupVisible(true);
    } catch (error: any) {
      console.log('Apply wallpaper failed:', error);

      Alert.alert(
        'Apply failed',
        error?.message || 'Could not apply this wallpaper.',
      );
    } finally {
      setApplyLoading(false);
      setApplyTarget(null);
    }
  };

  const onFullscreenDownload = () => {
    setFullscreenMenuVisible(false);
    onDownload();
  };

  const onFullscreenApply = () => {
    setFullscreenMenuVisible(false);
    setApplySheetVisible(true);
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
              <InfoPill
                icon="image-outline"
                text={getCategoryName(wallpaper)}
              />

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
                        size={21}
                        color={colors.textPrimary}
                      />
                      <Text style={styles.downloadText}>Saved</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="download-outline"
                        size={21}
                        color={colors.textPrimary}
                      />
                      <Text style={styles.downloadText}>Download</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() => setApplySheetVisible(true)}
                disabled={applyLoading}
                style={({ pressed }) => [
                  styles.applyButtonWrap,
                  {
                    opacity: applyLoading ? 0.75 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <LinearGradient
                  colors={APPLY_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.applyButton}
                >
                  {applyLoading ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <ApplyButtonIcon />
                  )}

                  <Text style={styles.applyButtonText}>Apply</Text>
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
                      size={25}
                      color={isFavorite ? colors.heart : colors.textPrimary}
                    />
                  )}

                  {/* {favoriteCount > 0 ? (
                    <View style={styles.favoriteCountBadge}>
                      <Text style={styles.favoriteCountText}>
                        {formatCount(favoriteCount)}
                      </Text>
                    </View>
                  ) : null} */}
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
              colors={['rgba(0,0,0,0.34)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.38)']}
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
                        onPress={onFullscreenApply}
                        disabled={applyLoading}
                        style={({ pressed }) => [
                          styles.dropdownItem,
                          { opacity: pressed || applyLoading ? 0.65 : 1 },
                        ]}
                      >
                        {applyLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.textPrimary}
                          />
                        ) : (
                          <ApplyButtonIcon />
                        )}

                        <Text style={styles.dropdownText}>Apply</Text>
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

                        {/* <Text style={styles.dropdownText}>
                          {isFavorite
                            ? `Favorite${
                                favoriteCount > 0
                                  ? ` (${formatCount(favoriteCount)})`
                                  : ''
                              }`
                            : 'Add to Favorite'}
                        </Text> */}
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
        visible={applySheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!applyLoading) setApplySheetVisible(false);
        }}
      >
        <View style={styles.applyOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!applyLoading) setApplySheetVisible(false);
            }}
          />

          <BlurView intensity={52} tint="dark" style={styles.applySheet}>
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.16)',
                'rgba(255,255,255,0.06)',
                'rgba(0,0,0,0.36)',
              ]}
              style={StyleSheet.absoluteFill}
            />

            <Text style={styles.applyTitle}>Apply Wallpaper</Text>

            <Text style={styles.applySubtitle}>
              Choose where you want to apply this wallpaper.
            </Text>

            <Pressable
              disabled={applyLoading}
              onPress={() => onApplyWallpaper('home')}
              style={({ pressed }) => [
                styles.applyOption,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name="home-outline"
                size={22}
                color={colors.textPrimary}
              />

              <Text style={styles.applyOptionText}>Home Screen</Text>

              {applyLoading && applyTarget === 'home' ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              )}
            </Pressable>

            <Pressable
              disabled={applyLoading}
              onPress={() => onApplyWallpaper('lock')}
              style={({ pressed }) => [
                styles.applyOption,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={colors.textPrimary}
              />

              <Text style={styles.applyOptionText}>Lock Screen</Text>

              {applyLoading && applyTarget === 'lock' ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              )}
            </Pressable>

            <Pressable
              disabled={applyLoading}
              onPress={() => onApplyWallpaper('both')}
              style={({ pressed }) => [
                styles.applyOption,
                styles.applyOptionLast,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons
                name="phone-portrait"
                size={22}
                color={colors.textPrimary}
              />

              <Text style={styles.applyOptionText}>Both</Text>

              {applyLoading && applyTarget === 'both' ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              )}
            </Pressable>
          </BlurView>
        </View>
      </Modal>

      <Modal
        visible={appliedPopupVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAppliedPopup}
      >
        <View style={styles.savedOverlay}>
          <BlurView
            intensity={34}
            tint="dark"
            style={styles.savedBackdrop}
            pointerEvents="none"
          />

          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeAppliedPopup}
          />

          <View style={styles.savedCardBorder}>
            <BlurView intensity={48} tint="dark" style={styles.savedCard}>
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.14)',
                  'rgba(255,255,255,0.055)',
                  'rgba(15,15,16,0.92)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <LinearGradient
                colors={[
                  'rgba(59,130,246,0.18)',
                  'rgba(139,92,246,0.12)',
                  'rgba(20,184,166,0.10)',
                  'rgba(0,0,0,0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.savedIconRing}>
                <LinearGradient
                  colors={APPLY_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.savedIconCircle}
                >
                  <Ionicons
                    name="checkmark"
                    size={34}
                    color={colors.textPrimary}
                  />
                </LinearGradient>
              </View>

              <Text style={styles.appliedTitle}>
                Wallpaper Applied Successfully
              </Text>

              <Pressable
                onPress={closeAppliedPopup}
                style={({ pressed }) => [
                  styles.doneButtonWrap,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={APPLY_GRADIENT}
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

      <Modal
        visible={savedPopupVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSavedPopup}
      >
        <View style={styles.savedOverlay}>
          <BlurView
            intensity={34}
            tint="dark"
            style={styles.savedBackdrop}
            pointerEvents="none"
          />

          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeSavedPopup}
          />

          <View style={styles.savedCardBorder}>
            <BlurView intensity={48} tint="dark" style={styles.savedCard}>
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.14)',
                  'rgba(255,255,255,0.055)',
                  'rgba(15,15,16,0.92)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <LinearGradient
                colors={[
                  'rgba(59,130,246,0.18)',
                  'rgba(139,92,246,0.12)',
                  'rgba(236,72,153,0.08)',
                  'rgba(0,0,0,0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.savedIconRing}>
                <LinearGradient
                  colors={POPUP_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.savedIconCircle}
                >
                  <Ionicons
                    name="checkmark"
                    size={34}
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
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
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
    gap: spacing.sm,
    alignItems: 'center',
  },

  downloadButtonWrap: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 9,
  },
  downloadButton: {
    width: '100%',
    height: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  downloadText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 18,
  },

  applyButtonWrap: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#14B8A6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 9,
  },
  applyButton: {
    width: '100%',
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  applyButtonText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 0,
  },
  applyIconFrame: {
    width: 22,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 0,
  },

  favoriteIconButtonWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
  },
  favoriteIconButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(5, 8, 18, 0.18)',
  },
  favoriteCountBadge: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236,72,153,0.95)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  // favoriteCountText: {
  //   color: colors.textPrimary,
  //   fontFamily: fontFamily.semiBold,
  //   fontSize: 9,
  //   lineHeight: 11,
  // },

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

  applyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  applySheet: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: 30,
    overflow: 'hidden',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(6, 8, 20, 0.86)',
  },
  applyTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 24,
    lineHeight: 30,
  },
  applySubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  applyOption: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  applyOptionLast: {
    borderBottomWidth: 0,
  },
  applyOptionText: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },

  savedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  savedBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  savedCardBorder: {
    width: '100%',
    maxWidth: 292,
    borderRadius: 28,
    padding: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.20)',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.24,
    shadowRadius: 26,
    elevation: 16,
  },
  savedCard: {
    borderRadius: 27,
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 26,
    paddingBottom: spacing.lg,
    backgroundColor: 'rgba(15, 15, 16, 0.88)',
  },
  savedIconRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  savedIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  savedSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    textAlign: 'center',
  },
  appliedTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.4,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  doneButtonWrap: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  doneButton: {
    height: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  doneButtonText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 20,
  },
});
