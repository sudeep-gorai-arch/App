import { AdConfig } from './AdConfig';
import {
    shouldShowWallpaperAd,
    shouldShowDownloadAd,
    shouldShowApplyAd,
} from './AdCounter';
import InterstitialManager from './InterstitialManager';

class AdController {
    private isPremiumUser = false;

    private lastInterstitialTime = 0;

    setPremiumUser(isPremium: boolean) {
        this.isPremiumUser = isPremium;
    }

    private isCooldownFinished() {
        const now = Date.now();

        return (
            now - this.lastInterstitialTime >
            AdConfig.cooldownInSeconds * 1000
        );
    }

    private async showInterstitial() {
        if (!AdConfig.interstitialEnabled) return;

        if (this.isPremiumUser) return;

        if (!this.isCooldownFinished()) return;

        const shown = InterstitialManager.show();

        if (shown) {
            this.lastInterstitialTime = Date.now();
        }
    }

    async onWallpaperOpen() {
        if (
            shouldShowWallpaperAd(
                AdConfig.wallpaperOpenFrequency,
            )
        ) {
            await this.showInterstitial();
        }
    }

    async onDownload() {
        if (
            shouldShowDownloadAd(
                AdConfig.downloadFrequency,
            )
        ) {
            await this.showInterstitial();
        }
    }

    async onApplyWallpaper() {
        if (
            shouldShowApplyAd(
                AdConfig.applyFrequency,
            )
        ) {
            await this.showInterstitial();
        }
    }

    /**
     * Navigate after checking whether an ad should be shown.
     */
    async navigateWithAd(
        action: () => void,
        type: 'wallpaper' | 'download' | 'apply' = 'wallpaper',
    ) {
        switch (type) {
            case 'wallpaper':
                await this.onWallpaperOpen();
                break;

            case 'download':
                await this.onDownload();
                break;

            case 'apply':
                await this.onApplyWallpaper();
                break;
        }

        action();
    }
}

export default new AdController();