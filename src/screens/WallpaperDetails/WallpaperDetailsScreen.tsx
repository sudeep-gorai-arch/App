import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RoundButton } from '../../components/Header';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../utils/constants';
import { RootStackParamList } from '../../navigation/RootStackParamList';
import { downloadWallpaper } from '../../utils/downloadHelper';
import {
  addDownload,
  addPublicDownload,
} from '../../services/downloadService';

type Props = NativeStackScreenProps<RootStackParamList, 'WallpaperDetails'>;

const CTA = ['#EC4899', '#A855F7', '#3B82F6'] as const;

const SERVER_ORIGIN = 'http://192.168.1.6:5000';

type Status = 'idle' | 'downloading' | 'done';

const getMediaUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${SERVER_ORIGIN}${url}`;
};

const getResponseData = (response: any) => {
  return response?.data?.data ?? response?.data;
};

const WallpaperDetailsScreen = ({ navigation, route }: Props) => {
  const wallpaper: any = route.params?.wallpaper ?? {};

  const rawImage: string | undefined =
    wallpaper.imageUrl || wallpaper.thumbnailUrl;

  const image: string | undefined = getMediaUrl(rawImage);

  const [status, setStatus] = useState<Status>('idle');
  const downloadingRef = useRef(false);

  const onDownload = async () => {
    if (downloadingRef.current || status === 'downloading') return;

    if (!wallpaper.id || String(wallpaper.id).startsWith('ph-')) {
      Alert.alert('Unavailable', 'This wallpaper cannot be downloaded.');
      return;
    }

    downloadingRef.current = true;
    setStatus('downloading');

    try {
      const token = await AsyncStorage.getItem('token');

      const response = token
        ? await addDownload(wallpaper.id)
        : await addPublicDownload(wallpaper.id);

      const data = getResponseData(response);

      const downloadUrl = getMediaUrl(data?.downloadUrl || rawImage);

      if (!downloadUrl) {
        Alert.alert('Unavailable', 'This wallpaper has no downloadable image.');
        setStatus('idle');
        return;
      }

      const ok = await downloadWallpaper(
        downloadUrl,
        wallpaper.title || wallpaper.id,
      );

      if (!ok) {
        setStatus('idle');
        return;
      }

      setStatus('done');

      Alert.alert('Saved', 'Wallpaper saved to your gallery.');

      setTimeout(() => {
        setStatus('idle');
      }, 2500);
    } catch (e: any) {
      console.log('Download failed:', e?.response?.data || e);

      setStatus('idle');

      if (e?.response?.status === 401) {
        await AsyncStorage.removeItem('token');

        Alert.alert(
          'Login expired',
          'Please login again to download wallpapers as a user.',
        );
        return;
      }

      if (e?.response?.status === 403) {
        Alert.alert(
          'Download blocked',
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          'Daily limit reached or premium subscription required.',
        );
        return;
      }

      if (e?.response?.status === 404) {
        Alert.alert('Not found', 'This wallpaper was not found on the server.');
        return;
      }

      Alert.alert('Download failed', 'Something went wrong while downloading.');
    } finally {
      downloadingRef.current = false;
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={{ uri: image || '' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.55)',
            'rgba(0,0,0,0)',
            'rgba(8,6,20,0.92)',
          ]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <RoundButton
              icon="chevron-back"
              onPress={() => navigation.goBack()}
            />

            {wallpaper.quality ? (
              <BlurView intensity={26} tint="dark" style={styles.qualityChip}>
                <Text style={styles.qualityText}>{wallpaper.quality}</Text>
              </BlurView>
            ) : null}
          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.bottom}>
            <BlurView intensity={34} tint="dark" style={styles.infoCard}>
              {wallpaper.category?.name ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {wallpaper.category.name}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.title} numberOfLines={2}>
                {wallpaper.title || 'Wallpaper'}
              </Text>

              <View style={styles.metaRow}>
                <Ionicons
                  name="heart"
                  size={16}
                  color={colors.textSecondary}
                />

                <Text style={styles.metaText}>{wallpaper.likes ?? 0}</Text>

                {wallpaper.downloads != null ||
                  wallpaper.downloadCount != null ? (
                  <>
                    <Ionicons
                      name="download"
                      size={16}
                      color={colors.textSecondary}
                      style={{ marginLeft: spacing.lg }}
                    />

                    <Text style={styles.metaText}>
                      {wallpaper.downloads ?? wallpaper.downloadCount ?? 0}
                    </Text>
                  </>
                ) : null}
              </View>

              <Pressable
                onPress={onDownload}
                disabled={status === 'downloading'}
                style={({ pressed }) => [
                  styles.ctaWrap,
                  {
                    transform: [
                      {
                        scale:
                          pressed && status !== 'downloading' ? 0.98 : 1,
                      },
                    ],
                    opacity: status === 'downloading' ? 0.85 : 1,
                  },
                ]}
              >
                <LinearGradient
                  colors={CTA}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cta}
                >
                  {status === 'downloading' ? (
                    <>
                      <ActivityIndicator color={colors.textPrimary} />
                      <Text style={styles.ctaText}>Downloading…</Text>
                    </>
                  ) : status === 'done' ? (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.textPrimary}
                      />
                      <Text style={styles.ctaText}>Saved to Gallery</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="download-outline"
                        size={22}
                        color={colors.textPrimary}
                      />
                      <Text style={styles.ctaText}>Download</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </BlurView>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default WallpaperDetailsScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },

  qualityChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },

  qualityText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },

  bottom: {
    padding: spacing.xl,
  },

  infoCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },

  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },

  tagText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  metaText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  ctaWrap: {
    borderRadius: radius.pill,
    shadowColor: colors.accentPink,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
  },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 56,
    borderRadius: radius.pill,
  },

  ctaText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
});