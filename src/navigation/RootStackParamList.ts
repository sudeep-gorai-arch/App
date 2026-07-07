/**
 * Route map for the root native-stack (see RootNavigator.tsx).
 *
 * `MainTabs` hosts the bottom-tab navigator. Tab-internal navigation still uses
 * the tab route names; this list only describes the parent stack.
 */

export type PremiumReturnRoute =
  | 'Home'
  | 'Category'
  | 'Trending'
  | 'Favorites'
  | 'Profile'
  | 'Settings';

export type RazorpayOrderParam = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  plan: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  title: string;
};

export type WallpaperCropTarget = 'home' | 'lock' | 'both';

export type WallpaperCropMediaType = 'IMAGE' | 'VIDEO';

export type RootStackParamList = {
  MainTabs:
    | {
        screen?: string;
        params?: Record<string, unknown>;
      }
    | undefined;

  // Auth
  Login: undefined;
  Signup: undefined;

  // Premium / Payment
  Premium:
    | {
        returnTo?: PremiumReturnRoute;
      }
    | undefined;

  ManagePremium:
    | {
        returnTo?: PremiumReturnRoute;
      }
    | undefined;

  Payment:
    | {
        order: RazorpayOrderParam;
      }
    | undefined;

  Subscription: undefined;

  // Browse
  AllWallpapers: undefined;

  CategoryDetail: {
    category: any;
    initialFilter?: string;
    premiumOnly?: boolean;
  };

  WallpaperDetails: {
    wallpaper?: any;
    applied?: boolean;
  };

  WallpaperCropPreview: {
    /**
     * IMAGE: actual wallpaper image URL.
     * VIDEO: poster/preview image URL used behind the video while loading.
     */
    imageUrl: string;

    /**
     * Only for VIDEO wallpapers.
     * This is the real video URL passed to Android live wallpaper preview.
     */
    videoUrl?: string;

    mediaType?: WallpaperCropMediaType;

    isVideo?: boolean;

    /**
     * IMAGE:
     * - home / lock / both based on the option selected from the apply sheet.
     *
     * VIDEO:
     * - forced as lock preview UI in React Native.
     * - Android system preview will decide final Home / Lock / Both target.
     */
    target: WallpaperCropTarget;

    title?: string;

    /**
     * Optional source dimensions for video crop calculation.
     * If not available, crop preview will use a safe 1080x1920 fallback.
     */
    videoWidth?: number | null;
    videoHeight?: number | null;
  };

  // Account/Profile
  AccountSettings: undefined;

  EditProfile: undefined;

  Downloads: undefined;

  // Other Pages
  HelpSupport: undefined;

  PrivacySecurity: undefined;

  PrivacyPolicy: undefined;

  About: undefined;

  Settings: undefined;
};