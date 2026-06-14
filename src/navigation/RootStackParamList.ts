/**
 * Route map for the root native-stack (see RootNavigator.tsx).
 *
 * `MainTabs` hosts the bottom-tab navigator (Home/Category/Premium/Favorites/
 * Profile). Tab-internal navigation still uses the tab route names; this list
 * only describes the parent stack.
 */
export type RootStackParamList = {

  MainTabs: undefined;


  // Auth
  Login: undefined;
  Signup: undefined;


  // Premium Flow
  PremiumAccess: undefined;

  Payment:
  | {
    planLabel?: string;
    price?: number;
  }
  | undefined;


  // Wallpaper
  WallpaperDetails: {
    wallpaper: any;
  };


  // Account/Profile
  AccountSettings: undefined;

  EditProfile: undefined;

  Subscription: undefined;

  Downloads: undefined;


  // Other Pages
  HelpSupport: undefined;

  PrivacySecurity: undefined;

  PrivacyPolicy: undefined;

  About: undefined;

};
