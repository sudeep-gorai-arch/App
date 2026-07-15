import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';

import { AdIds } from './AdIds';

class RewardedManager {
  private rewarded = RewardedAd.createForAdRequest(
    AdIds.rewarded,
    {
      requestNonPersonalizedAdsOnly: false,
    },
  );

  private loaded = false;

  private showing = false;

  private rewardCallback: (() => void) | null = null;

  constructor() {
    this.registerEvents();
  }

  private registerEvents() {
    this.rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('✅ Rewarded Loaded');

        this.loaded = true;
      },
    );

    this.rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('🎁 Reward Earned', reward);

        if (this.rewardCallback) {
          this.rewardCallback();

          this.rewardCallback = null;
        }
      },
    );

    this.rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('❌ Rewarded Closed');

        this.loaded = false;

        this.showing = false;

        this.load();
      },
    );

    this.rewarded.addAdEventListener(
      AdEventType.ERROR,
      error => {
        console.log('🚨 Rewarded Error', error);

        this.loaded = false;

        this.showing = false;

        this.rewardCallback = null;

        this.load();
      },
    );
  }

  load() {
    console.log('Loading Rewarded Ad...');

    this.rewarded.load();
  }

  show(onReward: () => void) {
    this.rewardCallback = onReward;

    if (!this.loaded) {
      console.log('Rewarded Ad not loaded');

      this.load();

      return false;
    }

    if (this.showing) {
      console.log('Rewarded Ad already showing');

      return false;
    }

    this.showing = true;

    console.log('Showing Rewarded Ad');

    this.rewarded.show();

    return true;
  }

  isLoaded() {
    return this.loaded;
  }

  isShowing() {
    return this.showing;
  }
}

export default new RewardedManager();