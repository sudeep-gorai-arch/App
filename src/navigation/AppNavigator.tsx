import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import BottomTabs from './BottomTabs';
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
      <BottomTabs />
    </NavigationContainer>
  );
};

export default AppNavigator;
