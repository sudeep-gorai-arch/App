import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomTabs from './BottomTabs';
import { RootStackParamList } from './RootStackParamList';
import { colors } from '../styles/colors';

import PremiumAccessScreen from '../screens/PremiumAccess/PremiumAccessScreen';
import PaymentScreen from '../screens/Payment/PaymentScreen';

import CategoryDetailScreen from '../screens/CategoryDetail/CategoryDetailScreen';

import AllWallpapersScreen from '../screens/AllWallpapers/AllWallpapersScreen';

import WallpaperDetailsScreen from '../screens/WallpaperDetails/WallpaperDetailsScreen';

import EditPersonalInfoScreen from '../screens/EditPersonalInfo/EditPersonalInfoScreen';

import HelpSupportScreen from '../screens/HelpSupport/HelpSupportScreen';

import PrivacyPolicyScreen from '../screens/PrivacyPolicy/PrivacyPolicyScreen';

import ManagePremiumScreen from '../screens/ManagePremium/ManagePremiumScreen';

import DownloadsScreen from '../screens/Downloads/DownloadsScreen';

import SettingsScreen from '../screens/Settings/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.base,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabs} />

      <Stack.Screen name="PremiumAccess" component={PremiumAccessScreen} />

      <Stack.Screen name="Payment" component={PaymentScreen} />

      {/* BROWSE */}

      <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />

      <Stack.Screen name="AllWallpapers" component={AllWallpapersScreen} />

      <Stack.Screen
        name="WallpaperDetails"
        component={WallpaperDetailsScreen}
      />

      {/* PROFILE OPTIONS */}

      <Stack.Screen name="EditProfile" component={EditPersonalInfoScreen} />

      <Stack.Screen name="Subscription" component={ManagePremiumScreen} />

      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />

      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />

      <Stack.Screen name="Downloads" component={DownloadsScreen} />

      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
