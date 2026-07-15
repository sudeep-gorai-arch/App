import { TestIds } from 'react-native-google-mobile-ads';

export const AdIds = {

    interstitial: __DEV__
        ? TestIds.INTERSTITIAL
        : 'ca-app-pub-3635933757449986/1376786106',

    rewarded: __DEV__
        ? TestIds.REWARDED
        : 'ca-app-pub-3635933757449986/9339990899',

    native: __DEV__
        ? TestIds.NATIVE
        : 'ca-app-pub-3635933757449986/1968767338',

    // Replace with your actual App Open Ad Unit ID
    app_open: __DEV__
        ? TestIds.APP_OPEN
        : 'ca-app-pub-3635933757449986/9534779041',
};