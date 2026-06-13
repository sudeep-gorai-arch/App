import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import RootNavigator from './RootNavigator';
import { colors } from '../styles/colors';

// Transparent navigator theme so our mesh gradient shows through every screen.
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.base,
    card: 'transparent',
    text: colors.textPrimary,
    border: 'transparent',
  },
};

const AppNavigator = () => {
  return (
    <NavigationContainer theme={AppTheme}>
      <StatusBar barStyle="light-content" />
      <RootNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;
