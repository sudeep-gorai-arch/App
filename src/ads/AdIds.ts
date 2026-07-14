import { TestIds } from 'react-native-google-mobile-ads';

export const AdIds = {
    banner: {
        home: __DEV__ ? TestIds.BANNER : 'ca-app-pub-3635933757449986/8280537583',
        categories: __DEV__ ? TestIds.BANNER : 'ca-app-pub-3635933757449986/2586880286',
        favorites: __DEV__ ? TestIds.BANNER : 'ca-app-pub-3635933757449986/6349911188',
    },
    interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-3635933757449986/1376786106',
    rewarded: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-3635933757449986/9339990899',
    native: __DEV__ ? TestIds.NATIVE : 'ca-app-pub-3635933757449986/1968767338',
};
