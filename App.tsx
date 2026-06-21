import React, { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import {
  useFonts,
  Syne_600SemiBold,
} from '@expo-google-fonts/syne';

import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

const applyGlobalFont = () => {
  const TextComponent = Text as any;
  const TextInputComponent = TextInput as any;

  TextComponent.defaultProps = TextComponent.defaultProps || {};
  TextInputComponent.defaultProps = TextInputComponent.defaultProps || {};

  TextComponent.defaultProps.style = [
    { fontFamily: 'Syne_600SemiBold' },
    TextComponent.defaultProps.style,
  ];

  TextInputComponent.defaultProps.style = [
    { fontFamily: 'Syne_600SemiBold' },
    TextInputComponent.defaultProps.style,
  ];
};

const App = () => {
  const [fontsLoaded] = useFonts({
    Syne_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyGlobalFont();
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;