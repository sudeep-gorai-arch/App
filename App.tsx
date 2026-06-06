import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';

/**
 * Root component.
 *
 * AppNavigator is wrapped in <SafeAreaProvider> because the screens under
 * src/screens use <SafeAreaView> and the floating tab bar uses
 * useSafeAreaInsets() (both from react-native-safe-area-context). Without this
 * provider those insets resolve to 0 and the headers / bottom nav would sit
 * under the notch and home indicator.
 */
const App = () => {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;
