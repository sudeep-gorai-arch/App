import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';

import { AdIds } from './AdIds';

class InterstitialManager {
  private interstitial = InterstitialAd.createForAdRequest(
    AdIds.interstitial,
    {
      requestNonPersonalizedAdsOnly: false,
    },
  );

  private loaded = false;

  private showing = false;

  constructor() {
    this.registerEvents();
  }

  private registerEvents() {
    this.interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log('Interstitial Loaded');

        this.loaded = true;
      },
    );

    this.interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('Interstitial Closed');

        this.loaded = false;

        this.showing = false;

        this.load();
      },
    );

    this.interstitial.addAdEventListener(
      AdEventType.ERROR,
      error => {
        console.log('Interstitial Error', error);

        this.loaded = false;

        this.showing = false;

        this.load();
      },
    );
  }

  load() {
    this.interstitial.load();
  }

  show() {
    if (!this.loaded) {
      console.log('Interstitial not loaded');

      this.load();

      return false;
    }

    if (this.showing) {
      return false;
    }

    this.showing = true;

    this.interstitial.show();

    return true;
  }

  isLoaded() {
    return this.loaded;
  }
}

export default new InterstitialManager();