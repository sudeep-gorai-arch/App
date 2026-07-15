let wallpaperOpenCounter = 0;
let downloadCounter = 0;
let applyCounter = 0;

export function shouldShowWallpaperAd(limit: number) {
  wallpaperOpenCounter++;
  return wallpaperOpenCounter >= limit
    ? ((wallpaperOpenCounter = 0), true)
    : false;
}

export function shouldShowDownloadAd(limit: number) {
  downloadCounter++;
  return downloadCounter >= limit
    ? ((downloadCounter = 0), true)
    : false;
}

export function shouldShowApplyAd(limit: number) {
  applyCounter++;
  return applyCounter >= limit
    ? ((applyCounter = 0), true)
    : false;
}