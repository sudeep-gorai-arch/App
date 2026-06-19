import { Alert, Linking } from 'react-native';
import {
  Asset,
  Album,
  getPermissionsAsync,
  requestPermissionsAsync,
  type GranularPermission,
} from 'expo-media-library';
import { File, Paths } from 'expo-file-system';

const ALBUM = 'FlexiWalls';
const GRANULAR_PERMISSIONS: GranularPermission[] = ['photo'];

const ensureGalleryPermission = async (): Promise<boolean> => {
  const current = await getPermissionsAsync(true, GRANULAR_PERMISSIONS);

  if (current.granted) return true;

  if (current.canAskAgain) {
    const requested = await requestPermissionsAsync(true, GRANULAR_PERMISSIONS);

    if (requested.granted) return true;
    if (requested.canAskAgain) return false;
  }

  Alert.alert(
    'Storage permission needed',
    'FlexiWalls needs permission to save wallpapers to your gallery. You can enable it in Settings.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );

  return false;
};

const safeName = (name?: string) =>
  `${Date.now()}-${(name ?? 'wallpaper')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'wallpaper'}.jpg`;

export const downloadWallpaper = async (
  imageUrl?: string | null,
  fileName?: string,
): Promise<boolean> => {
  if (!imageUrl) {
    Alert.alert('Unavailable', 'This wallpaper has no downloadable image.');
    return false;
  }

  const granted = await ensureGalleryPermission();
  if (!granted) return false;

  try {
    const target = new File(Paths.cache, safeName(fileName));

    const downloaded = await File.downloadFileAsync(imageUrl, target, {
      idempotent: true,
    });

    const album = await Album.get(ALBUM);

    if (album) {
      await Asset.create(downloaded.uri, album);
    } else {
      await Album.create(ALBUM, [downloaded.uri], false);
    }

    return true;
  } catch (error) {
    console.log('Download Error:', error);
    Alert.alert(
      'Download failed',
      'Something went wrong while saving the wallpaper.',
    );
    return false;
  }
};