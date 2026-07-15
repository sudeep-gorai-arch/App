// import 'react-native-get-random-values';

import React, { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { initializeAds } from './src/ads/MobileAds';
import InterstitialManager from './src/ads/InterstitialManager';
import RewardedManager from './src/ads/RewardedManager';

import { useFonts, Syne_600SemiBold } from '@expo-google-fonts/syne';

import AppNavigator from './src/navigation/AppNavigator';

import { AuthProvider } from './src/context/AuthContext';

import ToastProvider from './src/components/ui/toast/ToastProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

const applyGlobalFont = () => {
  const TextComponent = Text as any;
  const TextInputComponent = TextInput as any;

  TextComponent.defaultProps = TextComponent.defaultProps || {};

  TextInputComponent.defaultProps = TextInputComponent.defaultProps || {};

  TextComponent.defaultProps.style = [
    {
      fontFamily: 'Syne_600SemiBold',
    },
    TextComponent.defaultProps.style,
  ];

  TextInputComponent.defaultProps.style = [
    {
      fontFamily: 'Syne_600SemiBold',
    },
    TextInputComponent.defaultProps.style,
  ];
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Syne_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    const initializeApp = async () => {
      try {
        applyGlobalFont();

        // Initialize AdMob
        try {
          await initializeAds();
        } catch (e) {
          console.log(e);
        }

        // Preload Ads
        InterstitialManager.load();
        RewardedManager.load();
      } catch (error) {
        console.log('App initialization error:', error);
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    };

    initializeApp();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
