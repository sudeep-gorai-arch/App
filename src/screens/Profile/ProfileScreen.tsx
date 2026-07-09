import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import MeshBackground from "../../components/MeshBackground";
import Card from "../../components/Card";
import PremiumActionButton, {
  usePremiumNavigation,
} from "../../components/PremiumActionButton";

import { colors, gradients } from "../../styles/colors";
import { spacing } from "../../utils/constants";

import { useAuth } from "../../context/AuthContext";
import { getDownloads } from "../../services/downloadService";
import { Wallpaper } from "../../services/types";
import { appEvents } from "../../utils/appEvents";

type Props = {
  navigation: any;
};

type IconName = keyof typeof Ionicons.glyphMap;

type MenuItemProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

type RecentDownloadItem = {
  id: string;
  image: string;
  downloadedAt: string | Date | null;
  wallpaper: Wallpaper & Record<string, any>;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const RECENT_DOWNLOADS_CARD_PADDING = 16;
const DOWNLOAD_PREVIEW_COLUMNS = 5;
const DOWNLOAD_PREVIEW_LIMIT = 10;
const DOWNLOAD_THUMB_GAP = 7;

const DOWNLOAD_PREVIEW_CONTENT_WIDTH =
  SCREEN_WIDTH - spacing.xl * 2 - RECENT_DOWNLOADS_CARD_PADDING * 2;

const DOWNLOAD_THUMB_SIZE = Math.floor(
  (DOWNLOAD_PREVIEW_CONTENT_WIDTH -
    DOWNLOAD_THUMB_GAP * (DOWNLOAD_PREVIEW_COLUMNS - 1)) /
    DOWNLOAD_PREVIEW_COLUMNS,
);

const DOWNLOAD_PREVIEW_HEIGHT =
  DOWNLOAD_THUMB_SIZE * 2 + DOWNLOAD_THUMB_GAP;

const LOCAL_DOWNLOADS_KEY = "@flexiwalls:guestDownloads";

const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

const isBlankishValue = (value: unknown) => {
  const text = String(value ?? "").trim().toLowerCase();

  return (
    !text ||
    text === "null" ||
    text === "undefined" ||
    text === "false" ||
    text === "0"
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

const getWallpaperMediaType = (item: Record<string, any>) => {
  return String(item?.mediaType || item?.media_type || item?.type || "")
    .trim()
    .toUpperCase();
};

const isVideoWallpaper = (item?: Record<string, any> | null) => {
  if (!item) return false;

  const mediaType = getWallpaperMediaType(item);

  if (mediaType === "IMAGE") return false;
  if (mediaType === "VIDEO") return true;
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

const STAR_PARTICLES = [
  { id: "s1", x: -130, y: -120, size: 20, color: "#FFD76A", rotate: "-18deg" },
  { id: "s2", x: -78, y: -158, size: 15, color: "#FFFFFF", rotate: "18deg" },
  { id: "s3", x: 0, y: -174, size: 22, color: "#FDE68A", rotate: "32deg" },
  { id: "s4", x: 82, y: -150, size: 16, color: "#FFFFFF", rotate: "-28deg" },
  { id: "s5", x: 134, y: -95, size: 20, color: "#FDBA74", rotate: "20deg" },
  { id: "s6", x: 158, y: -8, size: 15, color: "#F9A8D4", rotate: "-10deg" },
  { id: "s7", x: 126, y: 84, size: 21, color: "#FFFFFF", rotate: "34deg" },
  { id: "s8", x: 60, y: 142, size: 16, color: "#C4B5FD", rotate: "-34deg" },
  { id: "s9", x: -10, y: 158, size: 23, color: "#FFD76A", rotate: "16deg" },
  { id: "s10", x: -88, y: 118, size: 16, color: "#FFFFFF", rotate: "-20deg" },
  { id: "s11", x: -148, y: 52, size: 21, color: "#F0ABFC", rotate: "36deg" },
  { id: "s12", x: -158, y: -36, size: 15, color: "#FDBA74", rotate: "-32deg" },
  { id: "s13", x: 42, y: -92, size: 14, color: "#A7F3D0", rotate: "12deg" },
  { id: "s14", x: -48, y: 90, size: 14, color: "#BAE6FD", rotate: "-14deg" },
  { id: "s15", x: 102, y: 28, size: 13, color: "#FDE68A", rotate: "24deg" },
  { id: "s16", x: -98, y: -18, size: 13, color: "#FFFFFF", rotate: "-24deg" },
];

const flexiWallsLogo = require("../../assets/images/flexiwalls-logo.png");
const appIcon = require("../../assets/icons/profileicon.png");

const getWallpaperImage = (item: Wallpaper | Record<string, any>) => {
  const wallpaper = item as Wallpaper & Record<string, any>;

  if (isVideoWallpaper(wallpaper)) {
    return (
      wallpaper.videoThumbnailUrl ||
      wallpaper.video_thumbnail_url ||
      wallpaper.videoThumbnailPath ||
      wallpaper.video_thumbnail_path ||
      wallpaper.videoPreviewUrl ||
      wallpaper.video_preview_url ||
      wallpaper.videoPreviewPath ||
      wallpaper.video_preview_path ||
      wallpaper.thumbnailUrl ||
      wallpaper.imageUrl ||
      wallpaper.thumbnail_url ||
      wallpaper.image_url ||
      wallpaper.thumbnail ||
      wallpaper.image ||
      wallpaper.mediaUrl ||
      wallpaper.media_url
    );
  }

  return (
    wallpaper.imageUrl ||
    wallpaper.thumbnailUrl ||
    wallpaper.image_url ||
    wallpaper.thumbnail_url ||
    wallpaper.displayPath ||
    wallpaper.display_path ||
    wallpaper.thumbnailPath ||
    wallpaper.thumbnail_path ||
    wallpaper.url ||
    wallpaper.image ||
    wallpaper.thumbnail ||
    wallpaper.photoUrl ||
    wallpaper.photo_url ||
    wallpaper.mediaUrl ||
    wallpaper.media_url
  );
};

const getDownloadTime = (value?: string | Date | null) => {
  if (!value) return 0;

  const time =
    value instanceof Date ? value.getTime() : new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
};

const normalizeRecentDownload = (download: any, index: number) => {
  const rawWallpaper = download?.wallpaper || download?.Wallpaper || download;
  const image = getWallpaperImage(rawWallpaper || download);

  if (!image) {
    return null;
  }

  const wallpaperId = String(
    rawWallpaper?.id ||
      download?.wallpaperId ||
      download?.wallpaper_id ||
      download?.id ||
      `${image}-${index}`,
  );

  const downloadedAt =
    download?.downloadedAt ||
    download?.downloaded_at ||
    download?.createdAt ||
    download?.created_at ||
    rawWallpaper?.downloadedAt ||
    rawWallpaper?.downloaded_at ||
    rawWallpaper?.createdAt ||
    rawWallpaper?.created_at ||
    null;

  const wallpaper = {
    ...rawWallpaper,
    id: wallpaperId,
    imageUrl: rawWallpaper?.imageUrl || rawWallpaper?.image_url || image,
    thumbnailUrl:
      rawWallpaper?.videoThumbnailUrl ||
      rawWallpaper?.video_thumbnail_url ||
      rawWallpaper?.videoThumbnailPath ||
      rawWallpaper?.video_thumbnail_path ||
      rawWallpaper?.videoPreviewUrl ||
      rawWallpaper?.video_preview_url ||
      rawWallpaper?.videoPreviewPath ||
      rawWallpaper?.video_preview_path ||
      rawWallpaper?.thumbnailUrl ||
      rawWallpaper?.thumbnail_url ||
      rawWallpaper?.thumbnailPath ||
      rawWallpaper?.thumbnail_path ||
      image,
    mediaType: rawWallpaper?.mediaType || rawWallpaper?.media_type,
    isVideo: Boolean(rawWallpaper?.isVideo || rawWallpaper?.is_video),
    videoUrl: rawWallpaper?.videoUrl || rawWallpaper?.video_url,
    videoPreviewUrl: rawWallpaper?.videoPreviewUrl || rawWallpaper?.video_preview_url,
    videoThumbnailUrl: rawWallpaper?.videoThumbnailUrl || rawWallpaper?.video_thumbnail_url,
    downloadedAt,
    isDownloaded: true,
  } as Wallpaper & Record<string, any>;

  return {
    id: String(
      download?.id ||
        download?.downloadId ||
        download?.download_id ||
        wallpaperId,
    ),
    image: String(image),
    downloadedAt,
    wallpaper,
  } satisfies RecentDownloadItem;
};

const extractDownloadArray = (payload: any) => {
  const data = payload?.data?.data ?? payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.downloads)) return data.downloads;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
};

const getRecentDownloadKey = (item: RecentDownloadItem) =>
  String(item.wallpaper?.id || item.id || item.image || "");

const uniqueRecentDownloads = (items: RecentDownloadItem[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getRecentDownloadKey(item);

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

const createRecentDownloadFromEvent = (payload: {
  wallpaperId: string;
  wallpaper?: any;
}) => {
  const downloadedAt = new Date().toISOString();

  return normalizeRecentDownload(
    {
      ...(payload.wallpaper || {}),
      id: payload.wallpaperId || payload.wallpaper?.id,
      wallpaperId: payload.wallpaperId,
      downloadedAt,
      createdAt: downloadedAt,
    },
    0,
  );
};

const sortRecentDownloads = (items: RecentDownloadItem[]) =>
  uniqueRecentDownloads(items).sort(
    (a, b) => getDownloadTime(b.downloadedAt) - getDownloadTime(a.downloadedAt),
  );

const getLocalRecentDownloads = async () => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_DOWNLOADS_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeRecentDownload)
      .filter(Boolean) as RecentDownloadItem[];
  } catch (error) {
    console.log("PROFILE LOCAL DOWNLOADS ERROR", error);
    return [];
  }
};

const isPremiumActive = (user: any) => {
  if (!user) return false;

  const premiumUntilValue =
    user.premiumUntil ||
    user.premium_until ||
    user.subscription?.premiumUntil ||
    user.subscription?.premium_until;

  const premiumUntilTime = premiumUntilValue
    ? new Date(premiumUntilValue).getTime()
    : 0;

  const hasActivePremiumDate =
    Number.isFinite(premiumUntilTime) && premiumUntilTime > Date.now();

  return Boolean(
    user.isPremium ||
      user.is_premium ||
      user.premium ||
      user.premiumActive ||
      user.subscription?.isPremium ||
      user.subscription?.is_premium ||
      hasActivePremiumDate,
  );
};

const ProfileTopHeader = ({
  onSettingsPress,
}: {
  onSettingsPress: () => void;
}) => {
  return (
    <View style={styles.profileHeader}>
      <View style={styles.profileActionRow}>
        <Image
          source={flexiWallsLogo}
          style={styles.profileLogoLeft}
          resizeMode="contain"
        />

        <View style={styles.profileRightActions}>
          <PremiumActionButton
            returnTo="Profile"
            style={styles.profilePremiumButton}
          />

          <Pressable
            onPress={onSettingsPress}
            hitSlop={8}
            style={({ pressed }) => [
              styles.profileRightButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <BlurView
              intensity={30}
              tint="dark"
              style={styles.profileRoundButton}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={colors.textPrimary}
              />
            </BlurView>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const StatPill = ({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string;
  label: string;
}) => (
  <View style={styles.statPill}>
    <LinearGradient
      colors={["#FFFFFF", "#F3F4F6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statPillGradient}
    >
      <View style={styles.statIconCircle}>
        <Ionicons name={icon} size={16} color={colors.accent} />
      </View>

      <View style={styles.statTextWrap}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>

        <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </Text>
      </View>
    </LinearGradient>
  </View>
);

const MenuItem = ({ icon, title, subtitle, onPress }: MenuItemProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.menuItem,
      pressed && styles.menuItemPressed,
    ]}
    android_ripple={{ color: "rgba(255,255,255,.08)" }}
    onPress={onPress}
  >
    <View style={styles.menuIcon}>
      <Ionicons name={icon} size={22} color={colors.accent} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={styles.menuTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>

    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
  </Pressable>
);

const RecentDownloadsPreview = ({
  downloads,
  onOpenWallpaper,
}: {
  downloads: RecentDownloadItem[];
  onOpenWallpaper: (download: RecentDownloadItem) => void;
}) => {
  const previewDownloads = downloads.slice(0, DOWNLOAD_PREVIEW_LIMIT);

  return (
    <View style={styles.recentPreviewMask}>
      <View style={styles.recentPreviewGrid}>
        {previewDownloads.map((download, index) => (
          <Pressable
            key={`${download.id}-${index}`}
            onPress={() => onOpenWallpaper(download)}
            style={({ pressed }) => [
              styles.recentPreviewThumbPress,
              pressed && styles.recentPreviewThumbPressed,
            ]}
          >
            <Image
              source={{ uri: download.image }}
              style={styles.recentPreviewImage}
              resizeMode="cover"
            />

            {isVideoWallpaper(download.wallpaper) ? (
              <View style={styles.recentVideoBadge}>
                <Ionicons name="videocam" size={10} color={colors.textPrimary} />
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default function ProfileScreen({ navigation }: Props) {
  const { user, loading, authLoading, signInGoogle, logout } = useAuth();
  const openPremium = usePremiumNavigation("Profile");

  const [downloads, setDownloads] = useState<RecentDownloadItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [easterEggActive, setEasterEggActive] = useState(false);

  const footerIconOpacity = useRef(new Animated.Value(1)).current;
  const flyingIconProgress = useRef(new Animated.Value(0)).current;
  const particleProgress = useRef(new Animated.Value(0)).current;
  const blastGlowProgress = useRef(new Animated.Value(0)).current;

  const blastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGuest = !user;
  const isPremiumUser = isPremiumActive(user);
  const displayName = user?.username || "Guest User";
  const displayEmail = user?.email || "Sign in to sync your account";
  const planLabel = isPremiumUser ? "Premium" : "Free";

  const flyingTranslateY = flyingIconProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.34, 0],
  });

  const flyingScale = flyingIconProgress.interpolate({
    inputRange: [0, 0.65, 0.9, 1],
    outputRange: [0.65, 1, 1.28, 0.18],
  });

  const flyingOpacity = flyingIconProgress.interpolate({
    inputRange: [0, 0.12, 0.82, 1],
    outputRange: [0, 1, 1, 0],
  });

  const flyingRotate = flyingIconProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "22deg"],
  });

  const particleOpacity = particleProgress.interpolate({
    inputRange: [0, 0.12, 0.72, 1],
    outputRange: [0, 1, 1, 0],
  });

  const particleScale = particleProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.2, 1.25, 0.65],
  });

  const blastGlowOpacity = blastGlowProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.9, 0],
  });

  const blastGlowScale = blastGlowProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 2.2],
  });

  const firstName = useMemo(() => {
    const name = displayName.trim();
    return name ? name.split(" ")[0] : "Guest";
  }, [displayName]);

  const avatarSource = useMemo(() => {
    if (user?.avatarUrl) {
      return { uri: user.avatarUrl };
    }

    if (user?.username) {
      return {
        uri: `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(
          user.username,
        )}`,
      };
    }

    return appIcon;
  }, [user?.avatarUrl, user?.username]);

  useEffect(() => {
    return () => {
      if (blastTimeoutRef.current) {
        clearTimeout(blastTimeoutRef.current);
        blastTimeoutRef.current = null;
      }
    };
  }, []);

  const loadDownloads = useCallback(async () => {
    let localDownloads: RecentDownloadItem[] = [];

    try {
      localDownloads = await getLocalRecentDownloads();

      if (!user) {
        setDownloads(sortRecentDownloads(localDownloads));
        return;
      }

      const res = await getDownloads();

      const serverDownloads = extractDownloadArray(res)
        .map(normalizeRecentDownload)
        .filter(Boolean) as RecentDownloadItem[];

      setDownloads(sortRecentDownloads([...serverDownloads, ...localDownloads]));
    } catch (err) {
      console.log("PROFILE DOWNLOADS ERROR", err);
      setDownloads(sortRecentDownloads(localDownloads));
    }
  }, [user]);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  useEffect(() => {
    const unsubscribeDownloads = appEvents.on("downloadsChanged", (payload) => {
      const nextDownload = createRecentDownloadFromEvent(payload);

      if (!nextDownload) {
        loadDownloads();
        return;
      }

      setDownloads((current) => sortRecentDownloads([nextDownload, ...current]));
    });

    const unsubscribeWallpapers = appEvents.on("wallpapersChanged", () => {
      loadDownloads();
    });

    return () => {
      unsubscribeDownloads();
      unsubscribeWallpapers();
    };
  }, [loadDownloads]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDownloads();
    setRefreshing(false);
  }, [loadDownloads]);

  const startEasterEggAnimation = useCallback(() => {
    if (easterEggActive) {
      return;
    }

    setEasterEggActive(true);

    footerIconOpacity.setValue(1);
    flyingIconProgress.setValue(0);
    particleProgress.setValue(0);
    blastGlowProgress.setValue(0);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );

    if (blastTimeoutRef.current) {
      clearTimeout(blastTimeoutRef.current);
    }

    blastTimeoutRef.current = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }, 820);

    Animated.sequence([
      Animated.timing(footerIconOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),

      Animated.timing(flyingIconProgress, {
        toValue: 1,
        duration: 680,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.parallel([
        Animated.timing(particleProgress, {
          toValue: 1,
          duration: 780,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.sequence([
          Animated.timing(blastGlowProgress, {
            toValue: 1,
            duration: 230,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),

          Animated.timing(blastGlowProgress, {
            toValue: 0,
            duration: 520,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),

      Animated.delay(100),

      Animated.timing(footerIconOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        flyingIconProgress.setValue(0);
        particleProgress.setValue(0);
        blastGlowProgress.setValue(0);

        if (blastTimeoutRef.current) {
          clearTimeout(blastTimeoutRef.current);
          blastTimeoutRef.current = null;
        }

        setEasterEggActive(false);
      }
    });
  }, [
    blastGlowProgress,
    easterEggActive,
    flyingIconProgress,
    footerIconOpacity,
    particleProgress,
  ]);

  const openSettings = () => navigation.navigate("Settings");

  const openDownloads = () => navigation.navigate("Downloads");

  const openRecentDownloadWallpaper = (download: RecentDownloadItem) => {
    const parentNavigation = navigation.getParent?.();

    if (parentNavigation) {
      parentNavigation.navigate("WallpaperDetails", {
        wallpaper: download.wallpaper,
      });
      return;
    }

    navigation.navigate("WallpaperDetails", {
      wallpaper: download.wallpaper,
    });
  };

  const openManagePremium = openPremium;

  const handleAuthAction = () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      signInGoogle();
      return;
    }

    logout();
  };

  const openHelp = () => navigation.navigate("HelpSupport");

  const openPrivacy = () => navigation.navigate("PrivacyPolicy");

  const openAbout = () => navigation.navigate("About");

  const totalDownloadsLabel = `${downloads.length} Download${
    downloads.length !== 1 ? "s" : ""
  }`;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          <ProfileTopHeader onSettingsPress={openSettings} />

          <View style={styles.heroCard}>
            <LinearGradient
              colors={gradients.violetMagenta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View pointerEvents="none" style={styles.heroGlowOne} />
              <View pointerEvents="none" style={styles.heroGlowTwo} />
              <View pointerEvents="none" style={styles.heroShineLine} />

              <MaterialCommunityIcons
                name="crown"
                size={96}
                color="rgba(255,255,255,0.18)"
                style={styles.heroWatermark}
              />

              <View style={styles.heroTopRow}>
                <Pressable disabled={isGuest} style={styles.avatarShell}>
                  <Image source={avatarSource} style={styles.heroAvatar} />
                </Pressable>

                <View style={styles.heroCopy}>
                  <Text style={styles.welcomeText}>
                    {isGuest ? "Welcome to FlexiWalls" : `Hello, ${firstName}`}
                  </Text>

                  <Text style={styles.heroName} numberOfLines={1}>
                    {displayName}
                  </Text>

                  <Text style={styles.heroEmail} numberOfLines={1}>
                    {displayEmail}
                  </Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.middleEditButton,
                    pressed && styles.heroButtonPressed,
                  ]}
                  onPress={openManagePremium}
                >
                  <MaterialCommunityIcons
                    name={isPremiumUser ? "crown" : "crown-outline"}
                    size={16}
                    color={isPremiumUser ? "#FFD76A" : "#fff"}
                  />

                  <Text style={styles.middleButtonText} numberOfLines={1}>
                    {isPremiumUser ? "Manage Premium" : "Get Premium"}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.middleLogoutButton,
                    authLoading && styles.middleLogoutButtonDisabled,
                    pressed && !authLoading && styles.heroButtonPressed,
                  ]}
                  onPress={handleAuthAction}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={user ? "log-out-outline" : "log-in-outline"}
                        size={17}
                        color="#fff"
                      />

                      <Text style={styles.middleButtonText}>
                        {user ? "Logout" : "Login"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={styles.statsRow}>
                <StatPill
                  icon="diamond-outline"
                  value={isGuest ? "Guest" : planLabel}
                  label="Plan"
                />

                <StatPill
                  icon="cloud-done-outline"
                  value={isGuest ? "Off" : "On"}
                  label="Sync"
                />
              </View>
            </LinearGradient>
          </View>

          <Card style={styles.recentDownloadsCard} padding={16} strong>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.downloadTitle}>Recent Downloads</Text>

                <View style={styles.totalDownloadsPill}>
                  <Ionicons
                    name="download-outline"
                    size={13}
                    color={colors.textPrimary}
                  />

                  <Text style={styles.totalDownloadsText}>
                    {totalDownloadsLabel}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={openDownloads}
                style={({ pressed }) => [
                  styles.viewAllButton,
                  pressed && styles.viewAllButtonPressed,
                ]}
              >
                <Text style={styles.viewAll}>View All</Text>

                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={colors.accent}
                />
              </Pressable>
            </View>

            {downloads.length === 0 ? (
              <View style={styles.emptyDownloads}>
                <Ionicons
                  name="download-outline"
                  size={34}
                  color={colors.textSecondary}
                />

                <Text style={styles.emptyTitle}>No Downloads Yet</Text>

                <Text style={styles.emptySubtitle}>
                  Wallpapers you download will appear here.
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.browseButton,
                    pressed && styles.browseButtonPressed,
                  ]}
                  onPress={() => navigation.navigate("Home")}
                >
                  <Text style={styles.browseText}>Browse Wallpapers</Text>
                </Pressable>
              </View>
            ) : (
              <RecentDownloadsPreview
                downloads={downloads}
                onOpenWallpaper={openRecentDownloadWallpaper}
              />
            )}
          </Card>

          <Card style={styles.card} padding={0} strong>
            <MenuItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="FAQs, Contact us"
              onPress={openHelp}
            />

            <MenuItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              subtitle="Terms & Privacy"
              onPress={openPrivacy}
            />

            <MenuItem
              icon="information-circle-outline"
              title="About FlexiWalls"
              subtitle="Version, Licenses"
              onPress={openAbout}
            />
          </Card>

          <View style={styles.footer}>
            <Pressable
              onPress={startEasterEggAnimation}
              hitSlop={12}
              style={styles.footerLogoButton}
            >
              <Animated.Image
                source={appIcon}
                style={[styles.footerLogo, { opacity: footerIconOpacity }]}
                resizeMode="contain"
              />
            </Pressable>

            <Text style={styles.footerTitle}>FlexiWalls</Text>
            <Text style={styles.footerVersion}>Version 1.0.0</Text>
            <Text style={styles.footerCopyright}>© 2026 FlexiWalls</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {easterEggActive && (
        <View pointerEvents="none" style={styles.easterEggOverlay}>
          <Animated.View
            style={[
              styles.blastGlow,
              {
                opacity: blastGlowOpacity,
                transform: [{ scale: blastGlowScale }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.blastRing,
              {
                opacity: blastGlowOpacity,
                transform: [{ scale: blastGlowScale }],
              },
            ]}
          />

          <Animated.Image
            source={appIcon}
            style={[
              styles.easterEggIcon,
              {
                opacity: flyingOpacity,
                transform: [
                  { translateY: flyingTranslateY },
                  { scale: flyingScale },
                  { rotate: flyingRotate },
                ],
              },
            ]}
            resizeMode="contain"
          />

          {STAR_PARTICLES.map((particle) => {
            const translateX = particleProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, particle.x],
            });

            const translateY = particleProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, particle.y],
            });

            return (
              <Animated.View
                key={particle.id}
                style={[
                  styles.starParticle,
                  {
                    opacity: particleOpacity,
                    transform: [
                      { translateX },
                      { translateY },
                      { scale: particleScale },
                      { rotate: particle.rotate },
                    ],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="star-four-points"
                  size={particle.size}
                  color={particle.color}
                />
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  loader: {
    flex: 1,
    backgroundColor: colors.base,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingBottom: 120,
  },

  profileHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 0,
  },

  profileActionRow: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "visible",
    marginBottom: -8,
  },

  profileLogoLeft: {
    width: 175,
    height: 120,
    marginLeft: -18,
    marginTop: 8,
  },

  profileRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 5,
  },

  profilePremiumButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    backgroundColor: "transparent",
  },

  profileRightButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },

  profileRoundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },

  heroCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: 30,
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 14,
  },

  heroGradient: {
    padding: 22,
    overflow: "hidden",
    borderRadius: 30,
  },

  heroGlowOne: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -95,
    right: -80,
  },

  heroGlowTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -70,
    left: -60,
  },

  heroShineLine: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  heroWatermark: {
    position: "absolute",
    right: 12,
    top: 16,
    opacity: 0.9,
    transform: [{ rotate: "-14deg" }],
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarShell: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  heroAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 41,
    backgroundColor: "#202024",
  },

  heroCopy: {
    flex: 1,
    marginLeft: 16,
  },

  welcomeText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "700",
  },

  heroName: {
    marginTop: 5,
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  heroEmail: {
    marginTop: 5,
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: "500",
  },

  badgeRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  middleEditButton: {
    width: "48%",
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  middleLogoutButton: {
    width: "48%",
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  middleLogoutButtonDisabled: {
    opacity: 0.48,
  },

  heroButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  middleButtonText: {
    marginLeft: 7,
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },

  statsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statPill: {
    width: "48%",
    height: 58,
    borderRadius: 18,
    overflow: "hidden",
  },

  statPillGradient: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "#FFFFFF",
  },

  statIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  statTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  statValue: {
    color: "#111827",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
  },

  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },

  recentDownloadsCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  downloadTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "900",
  },

  totalDownloadsPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderSoft,
  },

  totalDownloadsText: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 12,
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  viewAllButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  viewAll: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: 13,
  },

  recentPreviewMask: {
    height: DOWNLOAD_PREVIEW_HEIGHT,
    marginTop: 16,
    overflow: "visible",
    borderRadius: 20,
  },

  recentPreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: DOWNLOAD_THUMB_GAP,
    rowGap: DOWNLOAD_THUMB_GAP,
    justifyContent: "flex-start",
  },

  recentPreviewThumbPress: {
    width: DOWNLOAD_THUMB_SIZE,
    height: DOWNLOAD_THUMB_SIZE,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.16)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },

  recentPreviewThumbPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },

  recentPreviewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 13,
    backgroundColor: "#1d1d1d",
  },

  recentVideoBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.24)",
  },

  emptyDownloads: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },

  emptyTitle: {
    marginTop: 8,
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  emptySubtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 14,
    fontSize: 12,
  },

  browseButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  browseButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  browseText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,.06)",
  },

  menuItemPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  menuIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  menuTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  menuSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  footer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
    paddingHorizontal: 30,
  },

  footerLogoButton: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  footerLogo: {
    width: 70,
    height: 70,
    borderRadius: 20,
    marginBottom: 14,
  },

  footerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  footerVersion: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },

  footerCopyright: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 12,
    opacity: 0.7,
  },

  easterEggOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
    elevation: 999,
  },

  easterEggIcon: {
    position: "absolute",
    left: SCREEN_WIDTH / 2 - 40,
    top: SCREEN_HEIGHT / 2 - 40,
    width: 80,
    height: 80,
    borderRadius: 24,
  },

  blastGlow: {
    position: "absolute",
    left: SCREEN_WIDTH / 2 - 70,
    top: SCREEN_HEIGHT / 2 - 70,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.24)",
  },

  blastRing: {
    position: "absolute",
    left: SCREEN_WIDTH / 2 - 78,
    top: SCREEN_HEIGHT / 2 - 78,
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 2,
    borderColor: "rgba(255,215,106,0.65)",
  },

  starParticle: {
    position: "absolute",
    left: SCREEN_WIDTH / 2 - 10,
    top: SCREEN_HEIGHT / 2 - 10,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 12,
  },
});