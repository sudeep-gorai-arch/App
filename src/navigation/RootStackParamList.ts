/**
 * Route map for the root native-stack (see RootNavigator.tsx).
 *
 * `MainTabs` hosts the bottom-tab navigator (Home/Category/Premium/Favorites/
 * Profile). Tab-internal navigation still uses the tab route names; this list
 * only describes the parent stack.
 */
export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Signup: undefined;
  PremiumAccess: undefined;
  Payment: { planLabel?: string; price?: number } | undefined;
  WallpaperDetails: { wallpaper: any };
  AccountSettings: undefined;
  HelpSupport: undefined;
  PrivacyPolicy: undefined;
};
