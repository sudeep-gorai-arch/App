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
    wallpaper: any;
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