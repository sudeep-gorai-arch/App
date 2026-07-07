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

const GRANULAR_PERMISSIONS: GranularPermission[] = ['photo', 'video'];

type MediaKind = 'image' | 'video';

type DownloadOptions = {
  mediaType?: 'IMAGE' | 'VIDEO' | string;
  isVideo?: boolean;
  extension?: string | null;
};

export type DownloadWallpaperSuccess = {
  success: true;
  ok: true;
  uri: string;
  localUri: string;
  fileUri: string;
  savedUri: string;
  assetId: string | null;
  mediaAssetId: string | null;
  mediaKind: MediaKind;
  albumName: string;
  fileName: string;
  asset?: {
    id?: string | null;
    uri?: string | null;
    filename?: string | null;
    mediaType?: string | null;
  } | null;
};

export type DownloadWallpaperResult = DownloadWallpaperSuccess | false;

const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
const IMAGE_EXTENSION_PATTERN = /\.(jpg|jpeg|png|webp|avif)(\?|#|$)/i;

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
    'FlexiWalls needs permission to save wallpapers and videos to your gallery. You can enable it in Settings.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );

  return false;
};

const getUrlPath = (url?: string | null) => {
  if (!url) return '';

  try {
    return decodeURIComponent(new URL(url).pathname);
  } catch {
    return decodeURIComponent(String(url).split('?')[0].split('#')[0]);
  }
};

const normalizeExtension = (value?: string | null) => {
  const extension = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\./, '');

  if (extension === 'jpeg') return 'jpg';

  return extension;
};

const detectMediaKind = (
  url?: string | null,
  options?: DownloadOptions,
): MediaKind => {
  const mediaType = String(options?.mediaType || '').trim().toUpperCase();

  if (mediaType === 'VIDEO' || options?.isVideo) {
    return 'video';
  }

  if (mediaType === 'IMAGE') {
    return 'image';
  }

  const extension = normalizeExtension(options?.extension);

  if (['mp4', 'webm', 'mov', 'm4v'].includes(extension)) {
    return 'video';
  }

  const value = String(url || '').toLowerCase();

  if (VIDEO_EXTENSION_PATTERN.test(value)) {
    return 'video';
  }

  const path = getUrlPath(url).toLowerCase();

  if (path.includes('/videos/')) {
    return 'video';
  }

  return 'image';
};

const getExtensionFromUrl = (
  url?: string | null,
  mediaKind?: MediaKind,
  options?: DownloadOptions,
) => {
  const forcedExtension = normalizeExtension(options?.extension);

  if (
    mediaKind === 'video' &&
    ['mp4', 'webm', 'mov', 'm4v'].includes(forcedExtension)
  ) {
    return forcedExtension;
  }

  if (
    mediaKind === 'image' &&
    ['jpg', 'png', 'webp', 'avif'].includes(forcedExtension)
  ) {
    return forcedExtension;
  }

  const path = getUrlPath(url).toLowerCase();

  const match = path.match(/\.([a-z0-9]+)$/i);
  const extension = normalizeExtension(match?.[1]);

  if (extension) {
    if (
      mediaKind === 'video' &&
      ['mp4', 'webm', 'mov', 'm4v'].includes(extension)
    ) {
      return extension;
    }

    if (
      mediaKind === 'image' &&
      ['jpg', 'png', 'webp', 'avif'].includes(extension)
    ) {
      return extension;
    }
  }

  if (mediaKind === 'video') {
    return 'mp4';
  }

  if (IMAGE_EXTENSION_PATTERN.test(String(url || '').toLowerCase())) {
    const imageMatch = String(url || '')
      .toLowerCase()
      .match(/\.(jpg|jpeg|png|webp|avif)(\?|#|$)/i);

    return imageMatch?.[1] === 'jpeg' ? 'jpg' : imageMatch?.[1] || 'jpg';
  }

  return 'jpg';
};

const sanitizeBaseName = (name?: string) =>
  (name ?? 'wallpaper')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'wallpaper';

const safeName = (
  name?: string,
  url?: string | null,
  mediaKind: MediaKind = detectMediaKind(url),
  options?: DownloadOptions,
) => {
  const extension = getExtensionFromUrl(url, mediaKind, options);

  return `${Date.now()}-${sanitizeBaseName(name)}.${extension}`;
};

const getAssetId = (asset: any) => {
  const id = asset?.id || asset?.assetId || asset?.localIdentifier || null;

  return id ? String(id) : null;
};

const getAssetUri = (asset: any) => {
  const uri = asset?.uri || asset?.localUri || asset?.fileUri || null;

  return uri ? String(uri) : null;
};

const getAssetFileName = (asset: any) => {
  const filename = asset?.filename || asset?.fileName || asset?.name || null;

  return filename ? String(filename) : null;
};

const getAssetMediaType = (asset: any) => {
  const mediaType = asset?.mediaType || asset?.type || null;

  return mediaType ? String(mediaType) : null;
};

const createAssetInsideAlbum = async (localUri: string) => {
  const album = await Album.get(ALBUM);

  if (album) {
    const asset = await Asset.create(localUri, album);

    return {
      asset,
      album,
    };
  }

  let asset: any = null;
  let createdAlbum: any = null;

  try {
    asset = await Asset.create(localUri);
    createdAlbum = await Album.create(ALBUM, [asset], false);
  } catch (assetFirstError) {
    console.log('CREATE ASSET FIRST FLOW FAILED:', assetFirstError);

    createdAlbum = await Album.create(ALBUM, [localUri], false);

    try {
      asset = await Asset.create(localUri, createdAlbum);
    } catch (albumAssetError) {
      console.log('CREATE ASSET AFTER ALBUM FAILED:', albumAssetError);
    }
  }

  return {
    asset,
    album: createdAlbum,
  };
};

export const downloadWallpaper = async (
  mediaUrl?: string | null,
  fileName?: string,
  options?: DownloadOptions,
): Promise<DownloadWallpaperResult> => {
  if (!mediaUrl) {
    Alert.alert('Unavailable', 'This wallpaper has no downloadable media.');
    return false;
  }

  const mediaKind = detectMediaKind(mediaUrl, options);

  const granted = await ensureGalleryPermission();

  if (!granted) return false;

  try {
    const finalFileName = safeName(fileName, mediaUrl, mediaKind, options);

    const target = new File(Paths.cache, finalFileName);

    console.log('MEDIA_DOWNLOAD_DEBUG', {
      mediaUrl,
      mediaKind,
      targetUri: target.uri,
      options,
    });

    const downloaded = await File.downloadFileAsync(mediaUrl, target, {
      idempotent: true,
    });

    const downloadedUri = String(downloaded.uri || target.uri);

    const { asset } = await createAssetInsideAlbum(downloadedUri);

    const assetId = getAssetId(asset);
    const assetUri = getAssetUri(asset);
    const savedUri = assetUri || downloadedUri;

    return {
      success: true,
      ok: true,
      uri: savedUri,
      localUri: savedUri,
      fileUri: downloadedUri,
      savedUri,
      assetId,
      mediaAssetId: assetId,
      mediaKind,
      albumName: ALBUM,
      fileName: finalFileName,
      asset: asset
        ? {
            id: assetId,
            uri: assetUri,
            filename: getAssetFileName(asset),
            mediaType: getAssetMediaType(asset),
          }
        : null,
    };
  } catch (error) {
    console.log('Download Error:', error);

    Alert.alert(
      'Download failed',
      mediaKind === 'video'
        ? 'Something went wrong while saving the video wallpaper.'
        : 'Something went wrong while saving the wallpaper.',
    );

    return false;
  }
};