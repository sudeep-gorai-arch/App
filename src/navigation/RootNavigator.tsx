import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomTabs from './BottomTabs';
import { RootStackParamList } from './RootStackParamList';
import { colors } from '../styles/colors';

import LoginScreen from '../screens/Login/LoginScreen';
import SignupScreen from '../screens/SignUp/SignUpScreen';
import PremiumAccessScreen from '../screens/PremiumAccess/PremiumAccessScreen';
import PaymentScreen from '../screens/Payment/PaymentScreen';
import WallpaperDetailsScreen from '../screens/WallpaperDetails/WallpaperDetailsScreen';
import AccountSettingsScreen from '../screens/AccountSettings/AccountSettingsScreen';
import HelpSupportScreen from '../screens/HelpSupport/HelpSupportScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicy/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * RootNavigator
 *
 * `MainTabs` (the floating glass bottom-tab bar with Home/Category/Premium/
 * Favorites/Profile) is the initial route, so the app ALWAYS opens on Home —
 * never on Login. Login/Signup live in this same stack so they can be pushed
 * on top from anywhere (e.g. after a logout, or from Account Settings), and
 * the previously-orphaned detail screens are registered here too so they're
 * actually navigable.
 */
const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.base },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabs} />

      {/* Auth — wired in the frontend, reachable but not the entry point. */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="Signup" component={SignupScreen} />

      {/* Premium purchase flow. */}
      <Stack.Screen name="PremiumAccess" component={PremiumAccessScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />

      {/* Detail / settings screens. */}
      <Stack.Screen name="WallpaperDetails" component={WallpaperDetailsScreen} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
