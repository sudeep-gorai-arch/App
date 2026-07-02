import { NavigatorScreenParams } from '@react-navigation/native';
import { BottomTabParamList } from '../navigation/BottomTabParamList';


/**
 * Route map for the root native-stack (see RootNavigator.tsx).
 *
 * `MainTabs` hosts the bottom-tab navigator (Home/Category/Premium/Favorites/
 * Profile). Tab-internal navigation still uses the tab route names; this list
 * only describes the parent stack.
 */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;

  // Auth
  // Login: undefined;
  // Signup: undefined;

  Payment:
  | {
    planLabel?: string;
    price?: number;
  }
  | undefined;

  // Browse
  AllWallpapers: undefined;

  CategoryDetail: {
    category: any;
  };

  WallpaperDetails: {
    wallpaper: any;
  };

  // Account/Profile
  // AccountSettings: undefined;

  EditProfile: undefined;

  ManagePremium:
  | {
    returnTo?: string;
  }
  | undefined;

  Subscription:
  | {
    returnTo?: string;
  }
  | undefined;

  Downloads: undefined;

  // Other Pages
  HelpSupport: undefined;

  // PrivacySecurity: undefined;

  PrivacyPolicy: undefined;

  About: undefined;

  Settings: undefined;
};